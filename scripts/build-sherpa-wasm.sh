#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SHERPA_VERSION="${SHERPA_VERSION:-v1.13.4}"
EMSCRIPTEN_VERSION="${EMSCRIPTEN_VERSION:-4.0.23}"
EMSDK_DIR="${EMSDK_DIR:-$REPO_ROOT/../emsdk}"
MODEL_KEY="${MODEL_KEY:-bilingual}"
BUILD_ROOT="${SHERPA_BUILD_ROOT:-$REPO_ROOT/.build/sherpa}"

if [[ "$EMSDK_DIR" != /* ]]; then
  EMSDK_DIR="$REPO_ROOT/$EMSDK_DIR"
fi

case "$MODEL_KEY" in
  bilingual)
    MODEL_ARCHIVE="sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20"
    MODEL_ARCHIVE_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/${MODEL_ARCHIVE}.tar.bz2"
    MODEL_ARCHIVE_SHA256="27ffbd9ee24ad186d99acc2f6354d7992b27bcab490812510665fa8f9389c5f8"
    MODEL_DIR_NAME="$MODEL_ARCHIVE"
    MODEL_RENAMES=(
      "encoder-epoch-99-avg-1.int8.onnx:encoder.onnx"
      "decoder-epoch-99-avg-1.onnx:decoder.onnx"
      "joiner-epoch-99-avg-1.int8.onnx:joiner.onnx"
    )
    ;;
  en-20m)
    MODEL_ARCHIVE="sherpa-onnx-streaming-zipformer-en-20M-2023-02-17"
    MODEL_ARCHIVE_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/${MODEL_ARCHIVE}.tar.bz2"
    MODEL_ARCHIVE_SHA256="9c559283e8498d3fe95913c79ca1cb454bb26281ac2b102b41306c7d752765d9"
    MODEL_DIR_NAME="$MODEL_ARCHIVE"
    MODEL_RENAMES=(
      "encoder-epoch-99-avg-1.int8.onnx:encoder.onnx"
      "decoder-epoch-99-avg-1.onnx:decoder.onnx"
      "joiner-epoch-99-avg-1.int8.onnx:joiner.onnx"
    )
    ;;
  *)
    echo "Unsupported MODEL_KEY: $MODEL_KEY" >&2
    echo "Currently supported: bilingual, en-20m" >&2
    exit 2
    ;;
esac

SOURCE_DIR="$BUILD_ROOT/source-$SHERPA_VERSION"
ASSET_DIR="$SOURCE_DIR/wasm/asr/assets"
MODEL_DIR="$ASSET_DIR/$MODEL_DIR_NAME"
ARCHIVE_PATH="$BUILD_ROOT/$MODEL_ARCHIVE.tar.bz2"
OUTPUT_DIR="$SOURCE_DIR/build-wasm-simd-asr/install/bin/wasm/asr"
STAGE_DIR="$BUILD_ROOT/staging/$SHERPA_VERSION/$MODEL_KEY"

die() {
  echo "error: $*" >&2
  exit 1
}

[[ -x "$EMSDK_DIR/emsdk" ]] || die "EMSDK not found at $EMSDK_DIR"

# Use the compiler version verified for this repository's Sherpa v1.13.4 build.
EMSDK_QUIET=1 source "$EMSDK_DIR/emsdk_env.sh" >/dev/null
emcc_version="$(emcc --version | sed -n '1p')"
if [[ "$emcc_version" != *"$EMSCRIPTEN_VERSION"* ]]; then
  die "Found $emcc_version; expected Emscripten $EMSCRIPTEN_VERSION. Update EMSDK_DIR and activate that version first."
fi

if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  mkdir -p "$BUILD_ROOT"
  git clone --branch "$SHERPA_VERSION" --depth 1 \
    https://github.com/k2-fsa/sherpa-onnx.git \
    "$SOURCE_DIR"
else
  current_tag="$(git -C "$SOURCE_DIR" describe --tags --exact-match 2>/dev/null || true)"
  [[ "$current_tag" == "$SHERPA_VERSION" ]] || die \
    "$SOURCE_DIR is not checked out at $SHERPA_VERSION (found ${current_tag:-unknown})"
fi

mkdir -p "$ASSET_DIR"
if [[ ! -f "$ARCHIVE_PATH" ]]; then
  curl -fL --retry 3 -o "$ARCHIVE_PATH" "$MODEL_ARCHIVE_URL"
fi

actual_archive_sha256="$(shasum -a 256 "$ARCHIVE_PATH" | awk '{print $1}')"
[[ "$actual_archive_sha256" == "$MODEL_ARCHIVE_SHA256" ]] || die \
  "Model archive checksum mismatch: expected $MODEL_ARCHIVE_SHA256, found $actual_archive_sha256"

# Keep the packaged filesystem deterministic across repeated builds. Only the
# selected quantized model files belong at the root of the Emscripten assets.
rm -f \
  "$ASSET_DIR/encoder.onnx" \
  "$ASSET_DIR/decoder.onnx" \
  "$ASSET_DIR/joiner.onnx" \
  "$ASSET_DIR/tokens.txt"
rm -rf "$MODEL_DIR"
tar -xjf "$ARCHIVE_PATH" -C "$ASSET_DIR"

[[ -d "$MODEL_DIR" ]] || die "Extracted model directory not found: $MODEL_DIR"

for rename in "${MODEL_RENAMES[@]}"; do
  source_name="${rename%%:*}"
  target_name="${rename#*:}"
  source_path="$MODEL_DIR/$source_name"
  target_path="$ASSET_DIR/$target_name"

  if [[ ! -f "$target_path" ]]; then
    if [[ -f "$source_path" ]]; then
      cp "$source_path" "$target_path"
    elif [[ -f "$MODEL_DIR/$target_name" ]]; then
      # Reuse a target prepared by an earlier interrupted build.
      cp "$MODEL_DIR/$target_name" "$target_path"
    else
      die "Missing model file: $source_path"
    fi
  fi
done

if [[ ! -f "$ASSET_DIR/tokens.txt" ]]; then
  [[ -f "$MODEL_DIR/tokens.txt" ]] || die "Missing model file: $MODEL_DIR/tokens.txt"
  cp "$MODEL_DIR/tokens.txt" "$ASSET_DIR/tokens.txt"
fi

rm -rf "$MODEL_DIR"

unexpected_asset_dir="$(find "$ASSET_DIR" -mindepth 1 -maxdepth 1 -type d -print -quit)"
[[ -z "$unexpected_asset_dir" ]] || die \
  "Unexpected directory in Emscripten assets: $unexpected_asset_dir"

rm -rf "$SOURCE_DIR/build-wasm-simd-asr" "$STAGE_DIR"

(cd "$SOURCE_DIR" && ./build-wasm-simd-asr.sh)

for artifact in \
  sherpa-onnx-wasm-main-asr.js \
  sherpa-onnx-asr.js \
  sherpa-onnx-wasm-main-asr.wasm \
  sherpa-onnx-wasm-main-asr.data; do
  [[ -f "$OUTPUT_DIR/$artifact" ]] || die "Build artifact missing: $OUTPUT_DIR/$artifact"
done

# Emscripten records the packaged filesystem size in the generated loader.
# Keep this check next to the build so an accidentally stale or mismatched
# .data file cannot be staged for upload.
data_path="$OUTPUT_DIR/sherpa-onnx-wasm-main-asr.data"
loader_path="$OUTPUT_DIR/sherpa-onnx-wasm-main-asr.js"
data_size="$(wc -c < "$data_path" | tr -d ' ')"
package_size="$(grep -oE 'remote_package_size:[0-9]+' "$loader_path" | head -n 1 | cut -d: -f2)"
[[ -n "$package_size" ]] || die "Could not read packaged filesystem size from $loader_path"
[[ "$data_size" == "$package_size" ]] || die \
  "Emscripten package size mismatch: .data is $data_size bytes, loader declares $package_size"

mkdir -p "$STAGE_DIR"
cp "$OUTPUT_DIR/sherpa-onnx-wasm-main-asr.js" "$STAGE_DIR/"
cp "$OUTPUT_DIR/sherpa-onnx-asr.js" "$STAGE_DIR/"
cp "$OUTPUT_DIR/sherpa-onnx-wasm-main-asr.wasm" "$STAGE_DIR/"
cp "$OUTPUT_DIR/sherpa-onnx-wasm-main-asr.data" "$STAGE_DIR/"

echo "Built Sherpa $SHERPA_VERSION ($MODEL_KEY)"
echo "Staged artifacts: $STAGE_DIR"
echo "Packaged filesystem: $package_size bytes"
ls -lh "$STAGE_DIR"
shasum -a 256 "$STAGE_DIR"/*

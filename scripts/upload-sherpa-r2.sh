#!/usr/bin/env bash

# Upload staged Sherpa WASM model files to the R2 bucket via S3-compatible API.
# Supports files over 300 MiB (unlike wrangler's r2 object put).
#
# Prerequisites:
#   - aws-cli installed (brew install awscli)
#   - R2 S3 API credentials exported in your env:
#       export R2_ACCESS_KEY_ID="<r2-access-key-id>"
#       export R2_SECRET_ACCESS_KEY="<r2-secret-access-key>"
#       export R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
#
# Usage:
#   ./scripts/upload-sherpa-r2.sh bilingual

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHERPA_VERSION="${SHERPA_VERSION:-v1.13.4}"
BUCKET="tovo-sherpa-files"
MODEL_KEY="${1:-}"

if [[ -z "$MODEL_KEY" ]]; then
  echo "Usage: $0 <model-key> (e.g. bilingual)" >&2
  exit 1
fi

STAGE_DIR="$REPO_ROOT/.build/sherpa/staging/$SHERPA_VERSION/$MODEL_KEY"

if [[ ! -d "$STAGE_DIR" ]]; then
  echo "Staged files not found at: $STAGE_DIR" >&2
  echo "Run ./scripts/build-sherpa-wasm.sh with MODEL_KEY=$MODEL_KEY first." >&2
  exit 1
fi

# Determine the CDN folder name for this model
case "$MODEL_KEY" in
  bilingual)     CDN_FOLDER="sherpa-onnx-bilingual" ;;
  en-20m)        CDN_FOLDER="sherpa-onnx-en-20m" ;;
  *)
    echo "Unknown MODEL_KEY: $MODEL_KEY — add a CDN_FOLDER mapping to this script." >&2
    exit 2
    ;;
esac

R2_PREFIX="sherpa/$SHERPA_VERSION/$CDN_FOLDER"

# Validate credentials
if [[ -z "${R2_ENDPOINT:-}" || -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Error: R2 credentials not set. Export them first." >&2
  echo "  export R2_ACCESS_KEY_ID=\"<r2-access-key-id>\"" >&2
  echo "  export R2_SECRET_ACCESS_KEY=\"<r2-secret-access-key>\"" >&2
  echo "  export R2_ENDPOINT=\"https://<account-id>.r2.cloudflarestorage.com\"" >&2
  exit 1
fi

echo "Uploading from: $STAGE_DIR"
echo "  to R2 bucket: $BUCKET/$R2_PREFIX/"
echo "  endpoint:     $R2_ENDPOINT"
echo

for f in \
  sherpa-onnx-wasm-main-asr.js \
  sherpa-onnx-asr.js \
  sherpa-onnx-wasm-main-asr.wasm \
  sherpa-onnx-wasm-main-asr.data; do
  [[ -f "$STAGE_DIR/$f" ]] || { echo "Missing: $STAGE_DIR/$f" >&2; exit 1; }
  size=$(ls -lh "$STAGE_DIR/$f" | awk '{print $5}')
  echo "  uploading $f ($size)..."
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws s3 cp "$STAGE_DIR/$f" \
    "s3://$BUCKET/$R2_PREFIX/$f" \
    --endpoint-url "$R2_ENDPOINT" \
    --region auto \
    --no-progress
done

echo
echo "Done. Files uploaded to $BUCKET/$R2_PREFIX/"
echo "Test at: https://r2.tovo.dev/$R2_PREFIX/sherpa-onnx-asr.js"

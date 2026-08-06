# Sherpa-ONNX WASM assets

This document describes the reproducible path for building the browser
transcription assets, staging them in Cloudflare R2, and testing them before a
deployment. It intentionally uses generic paths so it can be followed by
other contributors.

## Version pins

The current build script pins:

- Sherpa-ONNX `v1.13.4`
- Emscripten `4.0.23`
- the streaming bilingual Chinese/English model from the official Sherpa
  `asr-models` release

Tovo Voice intentionally maintains this single transcription model. The historical
multilingual, English-only, and French build experiments are not part of the
supported release workflow.

The upstream WASM build guide is at
<https://k2-fsa.github.io/sherpa/onnx/wasm/build.html>. The online/streaming
model catalog is at
<https://k2-fsa.github.io/sherpa/onnx/pretrained_models/online-transducer/index.html>.

The repository currently builds the bilingual model as the first staging
target. Add another model only after its archive layout and recognizer behavior
have been verified.

## Prepare EMSDK

An EMSDK checkout can live beside this repository, for example:

```bash
EMSDK_DIR="../emsdk"
git -C "$EMSDK_DIR" pull --ff-only
"$EMSDK_DIR/emsdk" install 4.0.23
"$EMSDK_DIR/emsdk" activate 4.0.23
source "$EMSDK_DIR/emsdk_env.sh"
emcc --version
```

The installed compiler must report `4.0.23`. The build script refuses to use a
different compiler so that artifacts are reproducible. Sherpa's upstream
workflow may use a different Emscripten pin; `4.0.23` is the version verified
for this repository's `v1.13.4` build.

## Build and stage

Run this from the repository root:

```bash
EMSDK_DIR="../emsdk" ./scripts/build-sherpa-wasm.sh
```

The script clones the pinned Sherpa tag into the ignored `.build/` directory,
downloads the official model archive, prepares the filenames expected by the
WASM build, verifies the archive checksum, removes extracted source files, and
runs `build-wasm-simd-asr.sh` from a clean build directory.

The staged output is written to:

```text
.build/sherpa/staging/v1.13.4/bilingual/
```

With the pinned versions, the bilingual staged package is approximately 208
MiB (219 MB decimal): about 190 MiB of model data and 18 MiB of WebAssembly.
The English 20M target is smaller. The generated loader records the exact
packaged filesystem size; the build script now refuses to stage the files if
that value differs from the `.data` byte count.

It must contain exactly these runtime files:

```text
sherpa-onnx-asr.js
sherpa-onnx-wasm-main-asr.js
sherpa-onnx-wasm-main-asr.wasm
sherpa-onnx-wasm-main-asr.data
```

The pthread worker reuses `sherpa-onnx-wasm-main-asr.js`; Emscripten does not
emit a separate worker file for this build. The web loader supplies the cached
runtime to Emscripten through `mainScriptUrlOrBlob` so workers do not resolve
the current application page as JavaScript.

The `.data` file is model-specific. Do not put it in a shared directory unless
the build has proved that the generated data is identical for every model.

## R2 staging layout

The app uses this immutable layout for the current bilingual release:

```text
sherpa/v1.13.4/sherpa-onnx-bilingual/<runtime-file>
```

If a future build changes the generated runtime or model files, publish them
under a new versioned prefix and update the app configuration together. The
current rebuild produces the same bilingual package already used in
production, so it does not need a second R2 copy.

Cloudflare documents the `wrangler r2 object put` command and metadata flags at
<https://developers.cloudflare.com/r2/objects/upload-objects/>.

```bash
R2_BUCKET="<bucket-name>"
STAGE_DIR=".build/sherpa/staging/v1.13.4/bilingual"
R2_PREFIX="sherpa/v1.13.4/sherpa-onnx-bilingual"
WRANGLER="apps/web/node_modules/.bin/wrangler"

"$WRANGLER" r2 object put "$R2_BUCKET/$R2_PREFIX/sherpa-onnx-asr.js" \
  --file="$STAGE_DIR/sherpa-onnx-asr.js" \
  --remote --content-type="text/javascript" \
  --cache-control="public,max-age=31536000,immutable"

"$WRANGLER" r2 object put "$R2_BUCKET/$R2_PREFIX/sherpa-onnx-wasm-main-asr.js" \
  --file="$STAGE_DIR/sherpa-onnx-wasm-main-asr.js" \
  --remote --content-type="text/javascript" \
  --cache-control="public,max-age=31536000,immutable"

"$WRANGLER" r2 object put "$R2_BUCKET/$R2_PREFIX/sherpa-onnx-wasm-main-asr.wasm" \
  --file="$STAGE_DIR/sherpa-onnx-wasm-main-asr.wasm" \
  --remote --content-type="application/wasm" \
  --cache-control="public,max-age=31536000,immutable"

"$WRANGLER" r2 object put "$R2_BUCKET/$R2_PREFIX/sherpa-onnx-wasm-main-asr.data" \
  --file="$STAGE_DIR/sherpa-onnx-wasm-main-asr.data" \
  --remote --content-type="application/octet-stream" \
  --cache-control="public,max-age=31536000,immutable"
```

## CORS

The public R2 custom domain must allow the deployed PWA and local development
origins. In the bucket's CORS JSON editor, use the appropriate public domain
for the deployment and keep the local origins while testing:

```json
[
  {
    "AllowedOrigins": [
      "https://pwa.example.com",
      "http://localhost:3003",
      "https://localhost:3003"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range", "Content-Type"],
    "ExposeHeaders": ["Content-Length", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Origins must be exact scheme/host/port values and must not include a path.
Cloudflare's CORS guide is at
<https://developers.cloudflare.com/r2/buckets/cors/>. Existing custom-domain
responses may need a cache purge after a CORS policy change.

## Local configuration and test

Do not commit local environment files. For a local test, set the public R2
domain and the versioned asset prefix in the local environment:

```text
NEXT_PUBLIC_R2_BASE_URL=https://<public-r2-domain>
NEXT_PUBLIC_R2_ASSET_PREFIX=sherpa/v1.13.4
NEXT_PUBLIC_R2_ASSET_VERSION=sherpa-v1.13.4
```

Then run the app with the repository's Node/pnpm toolchain:

```bash
pnpm --dir apps/web dev:http
```

Verify the following in the browser:

1. The bilingual download moves past initialization and reaches 100%.
2. All four files are present in IndexedDB under the versioned R2 path.
3. The model loads after a reload without another network download.
4. Microphone transcription starts and produces partial and final results.
5. Deleting and downloading the model again works.

The direct asset check should include an `Origin` header:

```bash
curl -sS -D - -o /dev/null \
  -H "Origin: http://localhost:3003" \
  "https://<public-r2-domain>/sherpa/v1.13.4/sherpa-onnx-bilingual/sherpa-onnx-wasm-main-asr.wasm?v=sherpa-v1.13.4"
```

Expect HTTP `200` and an `Access-Control-Allow-Origin` value matching the
request origin.

## Deploy only after local verification

After the local download/load test succeeds, run the normal Cloudflare build
and deployment flow:

```bash
pnpm --dir apps/web run build:cf
pnpm --dir apps/web run deploy
```

The production environment must use the same versioned prefix before the new
worker is deployed. Keep the old R2 prefix available until the new worker and
the PWA download flow have been verified in production.

# Scripts

## Sherpa WASM Build

Build sherpa-onnx WASM packages for different ASR models.

```bash
# Build the bilingual ZH-EN model
./build-sherpa-wasm.sh

# Build the Nemotron EN model
MODEL_KEY=nemotron-en ./build-sherpa-wasm.sh
```

Staged artifacts land in `.build/sherpa/staging/v1.13.4/<model-key>/`.

### Uploading to R2

The staged files must be uploaded to the `tovo-sherpa-files` R2 bucket at
`sherpa/v1.13.4/<cdn-folder>/`. Both the Cloudflare dashboard and wrangler
have a 300 MiB upload limit, so use the **S3-compatible API** via the
upload script:

```bash
# Export R2 S3 credentials first (from 1Password "R2 Credentials")
export R2_ACCESS_KEY_ID="<r2-access-key-id>"
export R2_SECRET_ACCESS_KEY="<r2-secret-access-key>"
export R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"

# Upload the model
./scripts/upload-sherpa-r2.sh nemotron-en
./scripts/upload-sherpa-r2.sh bilingual
```

Requires `aws-cli` (`brew install awscli`).

## WebLLM Model Size Filter

This script helps you find smaller WebLLM models suitable for iOS's 1GB storage limit.

## Usage

```bash
# Find models under 800MB (recommended for iOS)
node filter-small-models.js 800

# Find very small models (under 500MB)
node filter-small-models.js 500

# Find models under 1GB
node filter-small-models.js 1000

# Use default (800MB)
node filter-small-models.js
```

## iOS Storage Recommendations

- **iOS Safari limit**: ~1GB per origin
- **Recommended max**: 800MB (safety margin for metadata)
- **Extra safe**: 600MB (for older iOS devices)

## Output

The script will show:

- ✅ Models grouped by family (Llama, Gemma, etc.)
- 📊 Size, quantization, and features for each model
- 💡 Specific iOS recommendations
- 🔧 Ready-to-use code snippets for `WEBLLM_MODELS`

## Model Features

- **📝 Instruct**: Fine-tuned for following instructions
- **📱 Low-Resource**: Optimized for resource-constrained devices
- **🪟 Context**: Custom context window size
- **Quantization**: q4f32_1, q4f16_1, etc. (smaller = more compressed)

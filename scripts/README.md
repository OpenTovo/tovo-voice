# WebLLM Model Size Filter

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

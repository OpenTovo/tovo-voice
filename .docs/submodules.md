# Submodule Management

## Overview

This project uses git submodules to manage external dependencies for AI/ML libraries.

## Current Submodules

- **`whisper.cpp/`** - Whisper C++ implementation for WASM transcription

  - Fork: https://github.com/qiweiii/whisper.cpp.git
  - Custom branch: `tovo-custom-wasm` (with WASM optimizations)
  - Upstream: https://github.com/ggml-org/whisper.cpp.git

- **`sherpa-onnx/`** - Speech recognition and synthesis toolkit
  - Repository: https://github.com/qiweiii/sherpa-onnx.git
  - Branch: `master`

## Quick Setup

```bash
# Clone with all submodules
git clone --recursive https://github.com/OpenTovo/tovo-voice.git

# Or if already cloned, initialize submodules
cd tovo-voice
git submodule update --init --recursive
```

## Working with Submodules

### Custom Branch Workflow (whisper.cpp) as an example

We use a forked repository with a custom branch for whisper.cpp to maintain our WASM optimizations:

1. **Make changes to whisper.cpp:**

   ```bash
   cd whisper.cpp
   git checkout tovo-custom-wasm
   # Make your changes
   git add .
   git commit -m "Your changes"
   git push origin tovo-custom-wasm
   ```

2. **Update parent repository:**

   ```bash
   cd ..
   git add whisper.cpp
   git commit -m "Update whisper.cpp submodule"
   ```

3. **Sync with upstream (optional):**
   ```bash
   cd whisper.cpp
   git fetch upstream
   git checkout master
   git merge upstream/master
   git push origin master
   git checkout tovo-custom-wasm
   git merge master
   git push origin tovo-custom-wasm
   ```

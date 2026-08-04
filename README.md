## Tovo Voice

Tovo Voice is a privacy-first voice app that transcribes speech in real time and
turns it into useful AI insights—all locally in your browser. Transcription
runs on-device, while WebLLM uses WebGPU for local language-model analysis,
keeping your audio and conversations private.

## Clone

```bash
git clone https://github.com/OpenTovo/tovo-voice.git
cd tovo-voice
pnpm install
```

## Local Development

This repo uses `pnpm` workspaces and requires Node.js 20+.

### Web App over HTTP

If you do not need local HTTPS:

```bash
cd apps/web
pnpm dev:http
```

### Web App over HTTPS

Some features work better over HTTPS during local development. The HTTPS
dev script expects these files:

- `apps/web/certs/cert.pem`
- `apps/web/certs/key.pem`

One simple way to generate them locally is:

```bash
mkdir -p apps/web/certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout apps/web/certs/key.pem \
  -out apps/web/certs/cert.pem \
  -days 365 \
  -subj "/CN=localhost"
```

Then run:

```bash
cd apps/web
pnpm dev
```

These cert files are for local development only and should not be committed.

## Notes

- This is a POC project created in 2025
- cloudflare R2 setup will be required to deploy the web app

## Sherpa-ONNX assets

The reproducible WASM build, R2 staging layout, CORS policy, and local test
flow are documented in [`docs/sherpa-wasm-build.md`](docs/sherpa-wasm-build.md).

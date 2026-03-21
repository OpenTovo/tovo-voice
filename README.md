## TOVO

- a real-time AI buddy for
  - meetings
  - interviews
  - pitches
  - companionship
- privacy-first: everything stays on your device
- real-time transcription
- local LLM models (powered by WebLLM via WebGPU)
- LLM analysis output as text

## Clone

```bash
git clone --recursive https://github.com/OpenTovo/tovo-voice.git
cd tovo-voice
pnpm install
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
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
- clouflare R2 setup will be required to deploy the web app

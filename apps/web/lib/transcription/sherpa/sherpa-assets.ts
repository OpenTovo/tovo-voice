const DEFAULT_SHERPA_BASE_URL = "https://r2.tovo.dev"
const DEFAULT_SHERPA_ASSET_PREFIX = "sherpa/v1.13.4"

// The path version is the cache namespace. The query token also lets us
// refresh CDN/CORS responses without changing the public asset contract.
const SHERPA_ASSET_PREFIX =
  process.env.NEXT_PUBLIC_R2_ASSET_PREFIX || DEFAULT_SHERPA_ASSET_PREFIX
const SHERPA_ASSET_VERSION =
  process.env.NEXT_PUBLIC_R2_ASSET_VERSION || "sherpa-v1.13.4"

export const SHERPA_ASSET_FILES = {
  api: "sherpa-onnx-asr.js",
  wasm: "sherpa-onnx-wasm-main-asr.wasm",
  wasmLoader: "sherpa-onnx-wasm-main-asr.js",
  data: "sherpa-onnx-wasm-main-asr.data",
} as const

export function getSherpaBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_R2_BASE_URL || DEFAULT_SHERPA_BASE_URL

  return `${baseUrl.replace(/\/$/, "")}/${SHERPA_ASSET_PREFIX.replace(/^\/+|\/+$/g, "")}`
}

export function getSherpaAssetUrl(path: string): string {
  const assetUrl = new URL(path, `${getSherpaBaseUrl()}/`)

  if (SHERPA_ASSET_VERSION) {
    assetUrl.searchParams.set("v", SHERPA_ASSET_VERSION)
  }

  return assetUrl.toString()
}

export function getSherpaModelAssetUrls(modelFolder: string) {
  return {
    api: getSherpaAssetUrl(`${modelFolder}/${SHERPA_ASSET_FILES.api}`),
    wasm: getSherpaAssetUrl(`${modelFolder}/${SHERPA_ASSET_FILES.wasm}`),
    wasmLoader: getSherpaAssetUrl(
      `${modelFolder}/${SHERPA_ASSET_FILES.wasmLoader}`
    ),
    data: getSherpaAssetUrl(`${modelFolder}/${SHERPA_ASSET_FILES.data}`),
  }
}

export function normalizeSherpaAssetUrl(url: string): string {
  try {
    const normalizedUrl = new URL(url)
    normalizedUrl.search = ""
    normalizedUrl.hash = ""
    return normalizedUrl.toString()
  } catch {
    return url.split(/[?#]/, 1)[0] || url
  }
}

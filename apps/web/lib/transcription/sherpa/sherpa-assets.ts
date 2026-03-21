const DEFAULT_SHERPA_BASE_URL = "https://r2.tovo.dev"

// Use a stable cache-busting token so browsers and the edge fetch a fresh
// response after CORS policy changes, while IndexedDB keys stay normalized.
const SHERPA_ASSET_VERSION =
  process.env.NEXT_PUBLIC_R2_ASSET_VERSION || "20260320-cors"

export function getSherpaBaseUrl(): string {
  return process.env.NEXT_PUBLIC_R2_BASE_URL || DEFAULT_SHERPA_BASE_URL
}

export function getSherpaAssetUrl(path: string): string {
  const assetUrl = new URL(path, `${getSherpaBaseUrl()}/`)

  if (SHERPA_ASSET_VERSION) {
    assetUrl.searchParams.set("v", SHERPA_ASSET_VERSION)
  }

  return assetUrl.toString()
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

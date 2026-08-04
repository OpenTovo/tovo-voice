import { tovoDB } from "@/lib/tovo-idb"

const LEGACY_WHISPER_MODEL_URLS = [
  "https://whisper.ggerganov.com/ggml-model-whisper-tiny.en-q5_1.bin",
  "https://whisper.ggerganov.com/ggml-model-whisper-base.en-q5_1.bin",
] as const

export async function removeLegacyWhisperModels(): Promise<void> {
  const cachedModels = await tovoDB.listModels()
  const cachedUrls = new Set(cachedModels.map((model) => model.url))
  const legacyUrls = LEGACY_WHISPER_MODEL_URLS.filter((url) =>
    cachedUrls.has(url)
  )

  await Promise.all(legacyUrls.map((url) => tovoDB.deleteModel(url)))
}

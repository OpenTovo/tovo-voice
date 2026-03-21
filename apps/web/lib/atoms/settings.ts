import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import type { UnifiedModelId } from "@/lib/transcription/unified-models"
import type { WebLLMModelName } from "../llm/models"

export const defaultTranscriptionModelAtom =
  atomWithStorage<UnifiedModelId | null>(
    "tovo-default-transcription-model",
    null
  )

export const defaultAnalysisModelAtom = atomWithStorage<WebLLMModelName | null>(
  "tovo-default-analysis-model",
  null
)

// UI state atoms
export const transcriptionVisibleAtom = atomWithStorage<boolean>(
  "tovo-transcription-toggle-visible",
  true
)

// Update detection atoms
export const currentVersionAtom = atomWithStorage<string | null>(
  "tovo-current-version",
  null
)

export const updateDismissedAtom = atomWithStorage<string>(
  "tovo-update-dismissed-version",
  ""
)

export const lastUpdateCheckAtom = atomWithStorage<number>(
  "tovo-last-update-check",
  0
)

// Download progress atoms for persistent state across dialog close/open
export const transcriptionDownloadProgressAtom = atom<{
  modelName: string | null
  progress: number
  isDownloading: boolean
}>({
  modelName: null,
  progress: 0,
  isDownloading: false,
})

export const webllmDownloadProgressAtom = atom<{
  modelName: string | null
  progress: number
  isDownloading: boolean
  status: string
}>({
  modelName: null,
  progress: 0,
  isDownloading: false,
  status: "",
})

// Session context persistence
export const sessionContextAtom = atomWithStorage<string>(
  "tovo-user-session-context",
  ""
)

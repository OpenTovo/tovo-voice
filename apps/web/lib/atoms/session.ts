import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import type { AnalysisResponse } from "@/lib/llm/analysis-engine"
import { SessionType } from "@/lib/llm/session-types"

export enum SessionStatus {
  Idle = "idle",
  Recording = "recording",
  Paused = "paused",
}

// Main session status atom - not persisted as it's runtime state
export const sessionStatusAtom = atom<SessionStatus>(SessionStatus.Idle)

// Current session type atom - persisted for user preference
export const sessionTypeAtom = atomWithStorage<SessionType>(
  "tovo-session-type",
  SessionType.GENERAL
)

// AI Analysis responses atom - stores list of analysis results (max 10)
export const analysisResponsesAtom = atom<AnalysisResponse[]>([])

// Analysis loading state
export const analysisLoadingAtom = atom<boolean>(false)

// Engine state atoms - runtime state only
export const llmEngineReadyAtom = atom<boolean>(false)

// Session data (will be stored in localStorage)
export interface SessionData {
  id: string
  title: string
  startTime: Date
  endTime?: Date
  duration?: number
  sessionType: SessionType
  messages: any[] // Will define proper type later
}

// Persisted atoms using localStorage
export const currentSessionAtom = atomWithStorage<SessionData | null>(
  "tovo-current-session",
  null
)

export const sessionHistoryAtom = atomWithStorage<SessionData[]>(
  "tovo-session-history",
  []
)

// Action atom to clear all session data (for ending sessions)
export const clearSessionDataAtom = atom(null, (get, set) => {
  // Clear analysis data
  set(analysisResponsesAtom, [])
  set(llmEngineReadyAtom, false)

  // Clear current session
  set(currentSessionAtom, null)

  // Reset session status to idle
  set(sessionStatusAtom, SessionStatus.Idle)

  // Note: Transcription clearing is handled separately by clearTranscriptionAtom
  // This separation allows for flexible clearing scenarios
})

// Action atom to reset engine state (for troubleshooting)
export const resetEngineStateAtom = atom(null, (get, set) => {
  set(llmEngineReadyAtom, false)
  set(analysisLoadingAtom, false)
})

// Helper atom to check if session is active (recording or paused)
export const isSessionActiveAtom = atom((get) => {
  const status = get(sessionStatusAtom)
  const responses = get(analysisResponsesAtom)
  return status !== SessionStatus.Idle || responses.length > 0
})

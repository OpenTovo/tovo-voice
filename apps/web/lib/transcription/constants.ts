/**
 * Transcription Engine Configuration
 *
 * This file controls which transcription engine is used throughout the application.
 * Change the TRANSCRIPTION_ENGINE constant to switch between engines.
 */

export enum TranscriptionEngine {
  WHISPER = "whisper",
  SHERPA = "sherpa",
}

/**
 * Default transcription engine
 * Change this constant to switch the entire application to use a different engine
 */
export const TRANSCRIPTION_ENGINE: TranscriptionEngine =
  TranscriptionEngine.SHERPA

/**
 * Audio processing configuration shared between engines
 */
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BUFFER_SIZE: 4096,
  MAX_RECORDING_DURATION: 120, // seconds
} as const

/**
 * Real-time transcription configuration
 */
export const TRANSCRIPTION_CONFIG = {
  CHUNK_DURATION: 2000, // ms - how often to process audio chunks
  MIN_SILENCE_DURATION: 500, // ms - minimum silence before considering utterance complete
  MAX_PARTIAL_DISPLAY_LENGTH: 100, // characters - truncate long partial results
} as const

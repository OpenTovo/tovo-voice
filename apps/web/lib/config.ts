// Configuration for Tovo Voice app features
// Central place to toggle development and feature flags

export const config = {
  // Development and debugging
  development: {
    enableDebugDisplay: false, // process.env.NODE_ENV === "development",
    enableDetailedLogs: false, // process.env.NODE_ENV === "development",
  },

  // Feature flags
  features: {
    voiceRecording: true,
    fileUpload: true,
    realTimeTranscription: true,
  },
} as const

export type Config = typeof config

// Configuration for TOVO app features
// Central place to toggle development and feature flags

export const config = {
  // Development and debugging
  development: {
    enableDebugDisplay: false, // process.env.NODE_ENV === "development",
    enableDetailedLogs: false, // process.env.NODE_ENV === "development",
  },

  // WASM module configuration
  wasm: {
    // Whether to enable both threaded and non-threaded WASM modules
    enableMobileSupport: true,

    // Module file names
    desktopModule: "stream.js", // Threaded version for desktop
    mobileModule: "stream-mobile.js", // Non-threaded version for mobile

    // Base path for WASM files
    basePath: "/wasm",

    // Memory configuration
    memory: {
      // Desktop (threaded) memory settings
      desktop: {
        initial: 1024, // MB
        maximum: 2048, // MB
      },

      // Mobile (non-threaded) memory settings
      mobile: {
        initial: 256, // MB - Safari friendly
        maximum: 1024, // MB
      },
    },
  },

  // Feature flags
  features: {
    voiceRecording: true,
    fileUpload: true,
    realTimeTranscription: true,
  },
} as const

export type Config = typeof config

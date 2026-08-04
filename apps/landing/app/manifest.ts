import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tovo Voice",
    short_name: "Tovo Voice",
    description: "Private, on-device transcription and local AI analysis",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#667eea",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/tovo-logo-128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/tovo-logo-384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/tovo-logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["productivity", "business", "utilities"],
  }
}

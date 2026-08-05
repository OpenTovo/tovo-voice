import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tovo Voice",
    short_name: "Tovo Voice",
    description: "Private, on-device transcription and local AI analysis",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbf9",
    theme_color: "#2b8fe6",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/tovo-icon.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
    categories: ["productivity", "business", "utilities"],
  }
}

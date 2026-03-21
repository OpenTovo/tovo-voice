import { ImageResponse } from "next/og"

// Image metadata
export const alt = "Tovo - AI Sidekick for Interviews & Meetings"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Image generation - same as OG image for consistency
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 24,
            fontSize: 48,
            fontWeight: "bold",
            color: "#667eea",
          }}
        >
          T
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "white",
            letterSpacing: "-0.02em",
          }}
        >
          Tovo
        </div>
      </div>
      <div
        style={{
          fontSize: 32,
          color: "white",
          textAlign: "center",
          maxWidth: 800,
          lineHeight: 1.2,
          opacity: 0.9,
        }}
      >
        AI Sidekick for Interviews & Meetings
      </div>
      <div
        style={{
          fontSize: 24,
          color: "white",
          textAlign: "center",
          maxWidth: 600,
          marginTop: 16,
          opacity: 0.7,
        }}
      >
        Privacy-first local AI that listens quietly and helps in real time
      </div>
    </div>,
    {
      ...size,
    }
  )
}

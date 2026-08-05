const logoSrc =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxMjgiIHkyPSIxMjgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjNkZDQkVFIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMkI4RkU2Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSIyNiIgZmlsbD0idXJsKCNnKSIvPjxwYXRoIGQ9Ik03NS4xMjcgNDIuNDRMNzEuMDIzIDEwMi4zOEM3MC45NTEgMTAzLjQ2IDcwLjU1NSAxMDQgNjkuODM1IDEwNEg2My44OTVDNTkuODYzIDEwNCA1Ni45ODMgMTAzLjIwOCA1NS4yNTUgMTAxLjYyNEM1My41MjcgMTAwLjA0IDUyLjY2MyA5Ny43NzIgNTIuNjYzIDk0LjgyQzUyLjY2MyA5My43NCA1Mi42OTkgOTIuMTIgNTIuNzcxIDg5Ljk2QzUyLjkxNSA4Ny44IDUzLjA5NSA4NS4yOCA1My4zMTEgODIuNEM1My41MjcgNzkuNDQ4IDUzLjc0MyA3Ni4yOCA1My45NTkgNzIuODk2QzU0LjI0NyA2OS40NCA1NC41MzUgNjUuOTg0IDU0LjgyMyA2Mi41MjhDNTUuMTExIDU5IDU1LjM2MyA1NS41MDggNTUuNTc5IDUyLjA1MkM1NS44NjcgNDguNTk2IDU2LjExOSA0NS4zOTIgNTYuMzM1IDQyLjQ0SDM5LjA1NUMzOC4yNjMgNDIuNDQgMzcuODY3IDQxLjkzNiAzNy44NjcgNDAuOTI4TDM4LjE5MSAzNC44OEMzOC4yNjMgMzMuOTQ0IDM4LjQwNyAzMy4wNDQgMzguNjIzIDMyLjE4QzM4LjkxMSAzMS4yNDQgMzkuMzQzIDMwLjQxNiAzOS45MTkgMjkuNjk2QzQwLjQ5NSAyOC45NzYgNDEuMjE1IDI4LjQgNDIuMDc5IDI3Ljk2OEM0My4wMTUgMjcuNTM2IDQ0LjEzMSAyNy4zMiA0NS40MjcgMjcuMzJIOTMuNzAzQzk0LjEzNSAyNy4zMiA5NC41MzEgMjcuNDI4IDk0Ljg5MSAyNy42NDRDOTUuMjUxIDI3Ljg2IDk1LjQzMSAyOC4yNTYgOTUuNDMxIDI4LjgzMkw5NC45OTkgMzUuMjA0Qzk0Ljg1NSAzNy4zNjQgOTQuMjQzIDM5LjEyOCA5My4xNjMgNDAuNDk2QzkyLjE1NSA0MS43OTIgOTAuMDMxIDQyLjQ0IDg2Ljc5MSA0Mi40NEg3NS4xMjdaIiBmaWxsPSIjRkZGRkZGIi8+PC9zdmc+Cg=="

export const alt = "Tovo Voice, a private AI sidekick with local transcription"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export function TovoVoiceImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#fbfbf9",
        color: "#14161a",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "54px 64px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -260,
          right: -160,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(43, 143, 230, 0.12), transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* biome-ignore lint/performance/noImgElement: ImageResponse requires a raw image element. */}
            <img
              alt="Tovo logo"
              src={logoSrc}
              style={{ width: 48, height: 48, borderRadius: 12 }}
            />
            <div
              style={{
                fontSize: 25,
                fontWeight: 700,
                marginLeft: 13,
                letterSpacing: "-0.02em",
              }}
            >
              Tovo Voice
            </div>
          </div>
          <div
            style={{
              color: "#6b6e76",
              fontSize: 14,
              letterSpacing: "0.14em",
            }}
          >
            PRIVATE BY DESIGN
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "53%",
              paddingRight: 46,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 1.02,
              }}
            >
              Your private
              <br />
              voice sidekick.
            </div>
            <div
              style={{
                color: "#6b6e76",
                fontSize: 23,
                lineHeight: 1.28,
                marginTop: 22,
              }}
            >
              Live transcription and local AI for conversations that stay on
              your device.
            </div>
            <div
              style={{
                width: 112,
                height: 3,
                background: "#2b8fe6",
                marginTop: 28,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 326,
                height: 296,
                padding: 22,
                background: "#ffffff",
                border: "1px solid #e8e8e5",
                borderRadius: 28,
                boxShadow:
                  "0 1px 3px rgba(20, 22, 26, 0.04), 0 12px 40px rgba(20, 22, 26, 0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#14161a",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <div>VOICE SIDEKICK</div>
                <div style={{ color: "#2f9e44", fontSize: 13 }}>READY</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "12px 14px",
                  background: "#fbfbf9",
                  border: "1px solid #e8e8e5",
                  borderRadius: 16,
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#2b8fe6",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                  }}
                >
                  <span>LISTENING</span>
                  <span style={{ color: "#6b6e76" }}>LIVE</span>
                </div>
                <div style={{ fontSize: 16, marginTop: 8 }}>
                  Session context
                </div>
                <div style={{ color: "#6b6e76", fontSize: 13, marginTop: 5 }}>
                  Transcript context is ready.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "12px 14px",
                  background: "#eaf3fd",
                  borderRadius: 16,
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#1f7fd4",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                  }}
                >
                  <span>ANALYSING</span>
                  <span>LOCAL MODEL</span>
                </div>
                <div style={{ fontSize: 16, marginTop: 8 }}>AI notes</div>
                <div style={{ color: "#1f7fd4", fontSize: 13, marginTop: 5 }}>
                  Keep the next step clear.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#6b6e76",
            fontSize: 14,
            letterSpacing: "0.08em",
          }}
        >
          <span>TRANSCRIPTION + LOCAL AI</span>
          <span>pwa.tovo.dev</span>
        </div>
      </div>
    </div>
  )
}

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  // Allow cross-origin requests from local network devices for development
  allowedDevOrigins: ["192.168.2.*", "192.168.2.*:3003"],
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          // Additional headers for mobile browser compatibility
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          // Ensure service worker can be loaded
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Apply headers specifically to WASM files
        source: "/wasm/(.*)",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
      {
        // Apply headers specifically to service worker
        source: "/coi-serviceworker.js",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Apply headers specifically to AudioWorklet scripts for offline caching
        source: "/audio-processor/(.*)",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Cache-Control",
            value:
              "public, max-age=31536000, immutable, stale-while-revalidate=31536000",
          },
          {
            key: "Expires",
            value: new Date(Date.now() + 31536000000).toUTCString(),
          },
        ],
      },
    ]
  },
}

initOpenNextCloudflareForDev()

export default nextConfig

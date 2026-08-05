import { ImageResponse } from "next/og"
import { alt, contentType, size, TovoVoiceImage } from "./og-image"

export { alt, contentType, size }

export default function Image() {
  return new ImageResponse(<TovoVoiceImage />, {
    ...size,
  })
}

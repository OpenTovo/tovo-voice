"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const screenshots = [
  {
    src: "/tovo-screenshots/tovo-mobile-new-session.png",
    alt: "Tovo Voice Mobile - New Session",
    title: "Start New Session",
    description:
      "Clean, intuitive interface to begin your AI-powered conversations",
  },
  {
    src: "/tovo-screenshots/tovo-mobile-with-transcriptions.png",
    alt: "Tovo Voice Mobile - In Session",
    title: "Live Transcription",
    description: "Real-time speech-to-text entirely on-device",
  },
  {
    src: "/tovo-screenshots/tovo-mobile-in-session2.png",
    alt: "Tovo Voice Mobile - Session View 2",
    title: "Smart Analysis",
    description: "AI extracts key insights and help automatically",
  },
  {
    src: "/tovo-screenshots/tovo-mobile-settings.png",
    alt: "Tovo Voice Mobile - Settings",
    title: "Customizable Settings",
    description:
      "Fine-tune your experience with powerful models and storage controls",
  },
]

export default function ScreenshotsSection() {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-[#0090EE]">
            Gallery
          </span>
          <h2 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
            See <span className="text-gradient-zima">Tovo Voice</span> in action
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            Seamless voice AI across all your devices with beautiful, intuitive
            interfaces.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={screenshot.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="glow-card glass group overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-[10.5/20] overflow-hidden">
                <Image
                  src={screenshot.src}
                  alt={screenshot.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="mb-1 text-sm font-semibold text-white drop-shadow">
                  {screenshot.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-300/90">
                  {screenshot.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <div className="glow-card glass-strong max-w-3xl overflow-hidden rounded-2xl">
            <div className="relative aspect-[18/14.6] overflow-hidden">
              <Image
                src="/tovo-screenshots/tovo-desktop-new-session.png"
                alt="Tovo Voice Desktop - New Session"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 1200px) 100vw, 75vw"
              />
            </div>
            <div className="p-8 text-center">
              <h3 className="mb-3 text-xl font-semibold text-white">
                Desktop Experience
              </h3>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-500">
                Full-featured desktop application with better AI models support,
                perfect for professional meetings and extended sessions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

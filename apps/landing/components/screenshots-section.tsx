"use client"

import { motion, useReducedMotion } from "framer-motion"
import Image from "next/image"

const screenshots = [
  {
    src: "/tovo-screenshots/tovo-mobile-new-session.png",
    alt: "Tovo Voice Mobile - New Session",
    title: "Start New Session",
    description: "Set the context, press start, speak.",
  },
  {
    src: "/tovo-screenshots/tovo-mobile-with-transcriptions.png",
    alt: "Tovo Voice Mobile - In Session",
    title: "Live Transcription",
    description: "Real-time speech-to-text, entirely on-device.",
  },
  {
    src: "/tovo-screenshots/tovo-mobile-in-session2.png",
    alt: "Tovo Voice Mobile - Session View 2",
    title: "Smart Analysis",
    description: "Key insights surface as the conversation flows.",
  },
  {
    src: "/tovo-screenshots/tovo-mobile-settings.png",
    alt: "Tovo Voice Mobile - Settings",
    title: "Customizable Settings",
    description: "Pick models, manage storage, make it yours.",
  },
]

export default function ScreenshotsSection() {
  const reduceMotion = useReducedMotion()
  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
    viewport: { once: true, amount: 0.3 },
  })

  return (
    <section className="px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-[1120px]">
        <motion.div {...reveal()} className="mb-14">
          <h2 className="text-ink mb-5 max-w-xl text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            See it in action
          </h2>
          <p className="text-ink-muted max-w-2xl text-lg leading-relaxed">
            Real screens from the app — on your phone and your desktop browser.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={screenshot.title}
              {...reveal(index * 0.06)}
              className="border-hairline bg-surface shadow-card overflow-hidden rounded-2xl border"
            >
              <div className="bg-canvas relative aspect-[10.5/20] overflow-hidden">
                <Image
                  src={screenshot.src}
                  alt={screenshot.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="border-hairline border-t p-4">
                <h3 className="text-ink mb-1 text-sm font-semibold tracking-tight">
                  {screenshot.title}
                </h3>
                <p className="text-ink-muted text-xs leading-relaxed">
                  {screenshot.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Screenshot */}
        <motion.div {...reveal(0.15)} className="mt-12 flex justify-center">
          <div className="border-hairline bg-surface shadow-card max-w-3xl overflow-hidden rounded-2xl border">
            <div className="bg-canvas relative aspect-[18/14.6] overflow-hidden">
              <Image
                src="/tovo-screenshots/tovo-desktop-new-session.png"
                alt="Tovo Voice Desktop - New Session"
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 75vw"
              />
            </div>
            <div className="border-hairline border-t p-8">
              <h3 className="text-ink mb-2 text-xl font-semibold tracking-tight">
                Roomier on desktop
              </h3>
              <p className="text-ink-muted max-w-xl text-sm leading-relaxed">
                The same app in your desktop browser — with space for larger AI
                models and longer sessions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

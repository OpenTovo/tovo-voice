"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { GithubIcon } from "./icons/brand-icons"

const badge = "Privacy-first, on-device voice AI"

const stats = [
  { value: "100%", label: "On-device" },
  { value: "0", label: "Cloud calls" },
  { value: "Free", label: "Forever" },
]

export default function HeroSection() {
  const reduceMotion = useReducedMotion()
  const rise = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 py-20 sm:px-8">
      {/* Ambient accent glow (TovoType signature) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-glow absolute left-1/2 top-[-180px] h-[520px] w-[60vw] -translate-x-1/2 rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Logo + badge */}
        <motion.div
          {...rise(0)}
          className="mb-8 flex flex-col items-center gap-4"
        >
          <Image
            src="/tovo-icon.png"
            alt="Tovo Voice"
            width={56}
            height={56}
          />
          <span className="bg-accent-soft text-accent-strong rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {badge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...rise(0.08)}
          className="text-ink mx-auto max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-7xl"
        >
          Your AI sidekick for{" "}
          <span className="font-display text-accent font-black">
            every conversation
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          {...rise(0.16)}
          className="text-ink-muted mx-auto mt-7 max-w-2xl text-lg leading-relaxed md:text-xl"
        >
          Meet Tovo Voice — a privacy-first voice app that transcribes speech
          into useful AI insights, entirely on your device.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...rise(0.24)}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="https://pwa.tovo.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-ink text-surface hover:bg-ink/85 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold transition-all active:scale-[0.98]"
          >
            Launch Tovo Voice
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>

          <a
            href="https://github.com/OpenTovo/tovo-voice"
            target="_blank"
            rel="noopener noreferrer"
            className="border-ink/25 text-ink hover:border-ink/40 hover:bg-ink/[0.04] inline-flex min-h-[46px] items-center gap-2 rounded-xl border px-6 text-base font-medium transition-all active:scale-[0.98]"
          >
            <GithubIcon className="h-5 w-5" />
            GitHub
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          {...rise(0.36)}
          className="divide-hairline mx-auto mt-12 flex max-w-md items-center justify-center divide-x"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-1 flex-col items-center px-4"
            >
              <span className="text-ink text-2xl font-semibold">{s.value}</span>
              <span className="text-ink-muted mt-1 text-xs uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Demo Video */}
        <motion.div {...rise(0.48)} className="mt-16 flex justify-center">
          <div className="border-hairline bg-surface shadow-card relative max-w-2xl overflow-hidden rounded-2xl border p-3">
            <video
              className="w-full rounded-xl"
              autoPlay
              muted
              loop
              playsInline
              poster="/tovo-screenshots/tovo-desktop-new-session.png"
            >
              <source src="/tovo-screenshots/tovo-short-desktop.mov" />
              Your browser does not support the video tag.
            </video>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

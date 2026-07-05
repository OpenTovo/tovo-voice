"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const badge = "Privacy-first, local AI sidekick"

const stats = [
  { value: "100%", label: "On-device" },
  { value: "0", label: "Cloud calls" },
  { value: "Free", label: "Forever" },
]

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24 pb-20">
      {/* Background: grid + zima glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#0090EE]/[0.10] blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full bg-[#0090EE]/[0.06] blur-[110px]" />
      </div>
      <div className="grid-bg absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Logo + badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center gap-4"
        >
          <Image
            src="/tovo-logo.svg"
            alt="Tovo"
            width={56}
            height={56}
            className="drop-shadow-[0_0_24px_rgba(0,144,238,0.35)]"
          />
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-neutral-300 backdrop-blur-sm">
            {badge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mx-auto max-w-4xl text-5xl font-bold leading-[1.04] tracking-tight text-white md:text-7xl lg:text-[5.5rem]"
        >
          Your AI sidekick for{" "}
          <span className="text-gradient-zima">every conversation</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-neutral-400 md:text-xl"
        >
          Meet <span className="text-white font-medium">Tovo</span> — a local
          voice AI that listens quietly and helps in real time. Perfect for{" "}
          <span className="text-white font-medium">meetings</span>,{" "}
          <span className="text-white font-medium">interviews</span>, and{" "}
          <span className="text-white font-medium">any session</span>.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="https://pwa.tovo.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-[#0090EE] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_30px_rgba(0,144,238,0.25)] transition-all duration-300 hover:bg-[#007acc] hover:shadow-[0_8px_44px_rgba(0,144,238,0.45)]"
          >
            Launch Tovo
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>

          <a
            href="https://github.com/OpenTovo/tovo-voice"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-4 text-base font-medium text-neutral-300 transition-all duration-300 hover:bg-white/[0.07] hover:text-white backdrop-blur-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-12 flex max-w-md items-center justify-center divide-x divide-white/10"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-1 flex-col items-center px-4"
            >
              <span className="text-2xl font-bold text-white">{s.value}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Demo Video */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-3 shadow-2xl backdrop-blur-xl">
            <video
              className="w-full rounded-xl"
              autoPlay
              muted
              loop
              playsInline
              poster="/tovo-screenshots/tovo-desktop-new-session.png"
            >
              <source
                src="/tovo-screenshots/tovo-short-desktop.mov"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-10 w-6 justify-center rounded-full border border-white/15">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-2 h-3 w-1 rounded-full bg-white/30"
          />
        </div>
      </motion.div>
    </section>
  )
}

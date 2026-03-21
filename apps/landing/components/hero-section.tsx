"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 mt-10">
      {/* Subtle ambient glow — only zima blue */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-pulse-subtle absolute left-1/3 top-1/4 h-[420px] w-[420px] rounded-full bg-[#0090EE]/[0.06] blur-[120px]" />
        <div
          className="animate-pulse-subtle absolute right-1/4 bottom-1/3 h-[320px] w-[320px] rounded-full bg-[#0090EE]/[0.04] blur-[100px]"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex justify-center"
        >
          <Image
            src="/tovo-logo.svg"
            alt="Tovo"
            width={64}
            height={64}
            className="drop-shadow-[0_0_24px_rgba(0,144,238,0.3)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="my-6 text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-7xl lg:text-8xl">
            Your <span className="text-zima">Privacy-First</span>
            <br />
            AI Sidekick
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-neutral-400 md:text-xl"
        >
          Meet <span className="text-zima font-medium">Tovo</span> — a local
          voice AI that listens quietly and helps in real time. Perfect for{" "}
          <span className="text-white font-medium">meetings</span>,{" "}
          <span className="text-white font-medium">interviews</span>, and{" "}
          <span className="text-white font-medium">all kinds of sessions</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-5 sm:flex-row"
        >
          <a
            href="https://pwa.tovo.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-full bg-[#0090EE] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-[#007acc] hover:shadow-[0_0_32px_rgba(0,144,238,0.35)]"
          >
            Launch Tovo
          </a>

          <motion.div
            whileHover={{ scale: 1.04 }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-neutral-400 backdrop-blur-sm"
          >
            Now 100% Free
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16"
        >
          <div className="flex flex-wrap justify-center gap-8 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#0090EE]" />
              <span>Works Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Private Conversations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Cross-Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Real-time Processing</span>
            </div>
          </div>
        </motion.div>

        {/* Demo Video */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
      >
        <div className="flex h-10 w-6 justify-center rounded-full border border-white/20">
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

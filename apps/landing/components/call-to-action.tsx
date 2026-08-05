"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function CallToAction() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-[1120px]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
          className="border-hairline bg-surface shadow-card relative overflow-hidden rounded-2xl border px-8 py-20 text-center md:px-16"
        >
          {/* Ambient accent glow */}
          <div className="ambient-glow pointer-events-none absolute left-1/2 top-[-120px] h-[300px] w-[520px] -translate-x-1/2 rounded-full" />

          <h2 className="text-ink relative mb-4 text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
            Your next conversation,
            <br />
            understood locally.
          </h2>
          <p className="text-ink-muted relative mx-auto mb-10 max-w-md text-lg leading-relaxed">
            Start transcribing with useful AI insights — 100% free and private.
          </p>
          <a
            href="https://pwa.tovo.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-ink text-surface hover:bg-ink/85 relative inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold transition-all active:scale-[0.98]"
          >
            Launch Tovo Voice
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

"use client"

import { motion } from "framer-motion"

export default function CallToAction() {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.02] px-8 py-20 text-center backdrop-blur-sm md:px-16"
        >
          {/* Zima glow behind CTA */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[520px] -translate-x-1/2 rounded-full bg-[#0090EE]/[0.12] blur-[120px]" />
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />

          <h2 className="relative mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Ready to experience <span className="text-gradient-zima">Tovo</span>
            ?
          </h2>
          <p className="relative mx-auto mb-10 max-w-md text-lg text-neutral-400">
            Start using your privacy-first AI sidekick today — 100% free, runs
            entirely on your device.
          </p>
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
        </motion.div>
      </div>
    </section>
  )
}

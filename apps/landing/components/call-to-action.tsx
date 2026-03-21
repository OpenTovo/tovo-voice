"use client"

import { motion } from "framer-motion"

export default function CallToAction() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-16 text-center backdrop-blur-sm"
        >
          {/* Subtle zima glow behind CTA */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[200px] w-[400px] rounded-full bg-[#0090EE]/[0.06] blur-[100px]" />

          <h2 className="relative mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Experience <span className="text-zima">Tovo</span>?
          </h2>
          <p className="relative mb-8 text-neutral-500">
            Start using your privacy-first AI sidekick today
          </p>
          <a
            href="https://pwa.tovo.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-block rounded-full bg-[#0090EE] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-[#007acc] hover:shadow-[0_0_32px_rgba(0,144,238,0.35)]"
          >
            Launch Tovo
          </a>
        </motion.div>
      </div>
    </section>
  )
}

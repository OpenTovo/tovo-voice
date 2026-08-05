"use client"

import { motion, useReducedMotion } from "framer-motion"
import {
  Headphones,
  MessageSquare,
  Mic,
  Shield,
  Users,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "100% Private",
    description:
      "All processing happens on your device. Your conversations never leave it.",
  },
  {
    icon: Zap,
    title: "Works Offline",
    description: "Runs without internet. Your conversations stay yours.",
  },
  {
    icon: Users,
    title: "Meeting Ready",
    description: "Perfect for meetings, interviews, and professional calls.",
  },
  {
    icon: Headphones,
    title: "Hands-Free Insights",
    description:
      "Auto extracts key points from your conversation in real time.",
  },
  {
    icon: MessageSquare,
    title: "Smart Transcription",
    description: "Real-time speech-to-text with AI understanding built in.",
  },
  {
    icon: Mic,
    title: "Always Ready",
    description: "Runs on Android and desktop browsers, no install required.",
  },
]

export default function FeaturesSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-[1120px]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
          className="mb-14"
        >
          <span className="text-accent-strong mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em]">
            Features
          </span>
          <h2 className="text-ink mb-5 max-w-xl text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            Everything stays on your device
          </h2>
          <p className="text-ink-muted max-w-2xl text-lg leading-relaxed">
            Transcription and AI analysis run locally in your browser — no
            cloud, no compromise.
          </p>
        </motion.div>

        {/* TovoType signature hairline-ruled grid */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.2 }}
          className="border-hairline bg-hairline grid grid-cols-1 gap-px overflow-hidden rounded-2xl border md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <div key={feature.title} className="bg-surface p-8">
              <div className="bg-accent-soft mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl">
                <feature.icon className="text-accent-strong h-5 w-5" />
              </div>
              <h3 className="text-ink mb-2 text-lg font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="text-ink-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

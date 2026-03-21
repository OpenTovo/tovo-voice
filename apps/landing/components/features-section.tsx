"use client"

import { motion } from "framer-motion"
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
      "All processing happens on your device. Private conversations.",
  },
  {
    icon: Zap,
    title: "Works Offline",
    description: "Works without internet. Your conversations stay yours.",
  },
  {
    icon: Users,
    title: "Meeting Ready",
    description: "Perfect for meetings, interviews, and professional calls.",
  },
  {
    icon: Headphones,
    title: "No type and send",
    description: "Auto extra key points from your conversation.",
  },
  {
    icon: MessageSquare,
    title: "Smart Transcription",
    description: "Real-time speech-to-text with AI understanding.",
  },
  {
    icon: Mic,
    title: "Always Listening",
    description: "Ready when you are, works across all your devices.",
  },
]

export default function FeaturesSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
            Why Choose <span className="text-zima">Tovo</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            Complete privacy and local AI capabilities—no cloud, no compromise.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="glow-card glass group rounded-2xl p-8"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#0090EE]/10 transition-colors duration-300 group-hover:bg-[#0090EE]/20">
                <feature.icon className="h-6 w-6 text-[#0090EE]" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

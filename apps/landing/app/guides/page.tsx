"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Home, Settings } from "lucide-react"
import Link from "next/link"

export default function GuidesPage() {
  const reduceMotion = useReducedMotion()

  const guides = [
    {
      title: "Add to Home Screen",
      description:
        "Install Tovo Voice as a PWA for offline access and a native app experience",
      icon: Home,
      href: "/guides/add-to-home",
    },
    {
      title: "WebGPU Setup",
      description: "Enable WebGPU in your browser for local AI processing",
      icon: Settings,
      href: "/guides/webgpu-setup",
    },
  ]

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mb-4 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            Guides
          </h1>

          <p className="text-ink-muted mb-12 text-lg leading-relaxed">
            Step-by-step guides to help you get the most out of Tovo Voice.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {guides.map((guide, index) => (
              <motion.div
                key={guide.href}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08 + index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link
                  href={guide.href}
                  className="border-hairline bg-surface shadow-card group block rounded-2xl border p-6 transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-accent-soft rounded-xl p-3">
                      <guide.icon className="text-accent-strong h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="group-hover:text-accent-strong mb-2 text-lg font-semibold tracking-tight transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-ink-muted text-sm leading-relaxed">
                        {guide.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

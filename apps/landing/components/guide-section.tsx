"use client"

import { motion, useReducedMotion } from "framer-motion"

export const guideStepBadge =
  "bg-ink text-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"

export const guideIconChip =
  "bg-canvas border-hairline flex items-center gap-2 rounded-md border p-3"

export function GuideSection({
  icon: Icon,
  title,
  delay,
  dimmed = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  delay: number
  dimmed?: boolean
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`border-hairline bg-surface shadow-card rounded-2xl border p-6 sm:p-8 ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-accent-soft rounded-xl p-2.5">
          <Icon className="text-accent-strong h-5 w-5" />
        </div>
        <h2 className="text-ink text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
      </div>
      {children}
    </motion.section>
  )
}

"use client"

import { ArrowUpRight, X } from "lucide-react"
import { useEffect, useState } from "react"

const BANNER_KEY = "tovo-landing-banner-dismissed"

export function TryBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(BANNER_KEY) !== "1") {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(BANNER_KEY, "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative bg-accent-soft">
      <a
        href="https://type.tovo.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-h-10 flex-wrap items-center justify-center gap-1.5 px-10 py-1.5 text-center text-sm text-accent-strong transition-colors hover:bg-ink/[0.03]"
      >
        <span className="font-semibold uppercase tracking-[0.12em] text-xs">
          New
        </span>
        <span className="font-medium">
          <span className="hidden sm:inline">For even better accuracy, </span>
          try our macOS app
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span className="font-semibold">
          TovoType
        </span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="text-accent-strong absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 transition-colors hover:bg-ink/[0.06]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

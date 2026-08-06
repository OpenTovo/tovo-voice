"use client"

import { ArrowUpRight, X } from "lucide-react"
import { useEffect, useState } from "react"

const BANNER_KEY = "tovo-app-banner-dismissed"

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
    <div className="relative shrink-0 border-b border-brand/15 bg-brand-soft dark:bg-brand-soft/50">
      <a
        href="https://type.tovo.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-h-9 flex-wrap items-center justify-center gap-1.5 px-10 py-1.5 text-center text-sm transition-colors hover:bg-brand/10"
      >
        <span className="font-semibold uppercase tracking-[0.12em] text-xs text-brand-strong">
          New
        </span>
        <span className="text-foreground/80">
          Try our new dictation app for macOS
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span className="font-semibold text-brand-strong">
          TovoType
        </span>
          <ArrowUpRight className="text-brand-strong h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="text-brand-strong absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 transition-colors hover:bg-brand/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

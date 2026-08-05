"use client"

import { motion, useReducedMotion } from "framer-motion"
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Lightbulb,
  Monitor,
  MoreVertical,
  Share,
  Smartphone,
} from "lucide-react"
import Link from "next/link"
import {
  GuideSection as Section,
  guideIconChip as iconChip,
  guideStepBadge as stepBadge,
} from "@/components/guide-section"

export default function AddToHomePage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/guides"
            className="text-ink-muted hover:text-ink mb-8 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guides
          </Link>

          <h1 className="mb-4 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            Add to Home Screen
          </h1>

          <p className="text-ink-muted mb-12 text-lg leading-relaxed">
            Install Tovo Voice as a PWA for offline access and a native app
            experience.
          </p>

          <div className="space-y-8">
            {/* Android Section */}
            <Section icon={Smartphone} title="Android (Chrome)" delay={0.1}>
              <ol className="text-ink-muted space-y-4">
                <li className="flex gap-4">
                  <span className={stepBadge}>1</span>
                  <span>
                    Open <strong className="text-ink">Chrome browser</strong>{" "}
                    and navigate to Tovo Voice (pwa.tovo.dev)
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className={stepBadge}>2</span>
                  <div className="space-y-2">
                    <span>
                      Tap the <strong className="text-ink">three-dot menu</strong>{" "}
                      in the top right corner
                    </span>
                    <div className={iconChip}>
                      <MoreVertical className="text-ink-muted h-5 w-5" />
                      <span className="text-ink-muted text-sm">
                        Three-dot menu
                      </span>
                    </div>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className={stepBadge}>3</span>
                  <span>
                    Tap <strong className="text-ink">"Add to Home screen"</strong>{" "}
                    or <strong className="text-ink">"Install app"</strong>
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className={stepBadge}>4</span>
                  <span>
                    Confirm by tapping <strong className="text-ink">"Add"</strong>{" "}
                    or <strong className="text-ink">"Install"</strong>
                  </span>
                </li>
              </ol>

              <div className="bg-accent-soft mt-6 rounded-lg p-4">
                <p className="text-accent-strong flex items-start gap-2 text-sm">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>Alternative:</strong> you might also see a banner at
                    the bottom of the screen asking to install the app.
                  </span>
                </p>
              </div>
            </Section>

            {/* Desktop Section */}
            <Section
              icon={Monitor}
              title="Desktop (Chrome, Edge, Safari)"
              delay={0.15}
            >
              <ol className="text-ink-muted space-y-4">
                <li className="flex gap-4">
                  <span className={stepBadge}>1</span>
                  <span>
                    Open your browser and navigate to Tovo Voice (pwa.tovo.dev)
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className={stepBadge}>2</span>
                  <div className="space-y-2">
                    <span>
                      Look for the{" "}
                      <strong className="text-ink">install icon</strong> in the
                      address bar, or use the browser menu
                    </span>
                    <div className={iconChip}>
                      <Download className="text-ink-muted h-5 w-5" />
                      <span className="text-ink-muted text-sm">
                        Install icon in address bar
                      </span>
                    </div>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className={stepBadge}>3</span>
                  <span>
                    Click <strong className="text-ink">"Install"</strong> or{" "}
                    <strong className="text-ink">"Add to Home Screen"</strong>
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className={stepBadge}>4</span>
                  <span>Confirm to add Tovo Voice to your desktop</span>
                </li>
              </ol>

              <div className="bg-accent-soft mt-6 rounded-lg p-4">
                <p className="text-accent-strong flex items-start gap-2 text-sm">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>Alternative:</strong> you can also drag the URL from
                    the address bar to your desktop to create a shortcut.
                  </span>
                </p>
              </div>
            </Section>

            {/* iOS Section */}
            <Section
              icon={Smartphone}
              title="iPhone & iPad (Not Supported)"
              delay={0.2}
              dimmed
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    iOS Not Currently Supported
                  </h3>
                  <p className="text-sm text-red-700">
                    Unfortunately, Tovo Voice doesn't work on iOS devices due to
                    Safari's memory limitations. The app requires at least 650MB
                    of memory to run the transcription and AI models, but iOS
                    Safari is limited to 200-400MB depending on the device.
                  </p>
                  <p className="mt-3 text-sm font-medium text-red-700">
                    Please use a desktop computer or Android device instead.
                  </p>
                </div>

                <div className="opacity-70">
                  <p className="text-ink-muted mb-4 text-sm">
                    Installation steps (if iOS support becomes available in the
                    future):
                  </p>
                  <ol className="text-ink-muted space-y-4">
                    <li className="flex gap-4">
                      <span className={stepBadge}>1</span>
                      <span>
                        Open <strong className="text-ink">Safari browser</strong>{" "}
                        and navigate to Tovo Voice (pwa.tovo.dev)
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className={stepBadge}>2</span>
                      <div className="space-y-2">
                        <span>
                          Tap the{" "}
                          <strong className="text-ink">Share button</strong> at
                          the bottom of the screen
                        </span>
                        <div className={iconChip}>
                          <Share className="text-ink-muted h-5 w-5" />
                          <span className="text-ink-muted text-sm">
                            Share icon
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className={stepBadge}>3</span>
                      <span>
                        Scroll down and tap{" "}
                        <strong className="text-ink">"Add to Home Screen"</strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className={stepBadge}>4</span>
                      <span>
                        Confirm by tapping{" "}
                        <strong className="text-ink">"Add"</strong> in the top
                        right
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </Section>

            {/* Benefits Section */}
            <Section icon={Download} title="Why Install as a PWA?" delay={0.25}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-accent-strong font-semibold">
                    Performance
                  </h3>
                  <ul className="text-ink-muted list-disc space-y-1.5 pl-5 text-sm">
                    <li>Faster loading and better performance</li>
                    <li>Works offline once cached</li>
                    <li>Native app-like experience</li>
                    <li>No app store download required</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-accent-strong font-semibold">
                    Experience
                  </h3>
                  <ul className="text-ink-muted list-disc space-y-1.5 pl-5 text-sm">
                    <li>Dedicated app icon on home screen</li>
                    <li>Full-screen experience without browser UI</li>
                    <li>Push notifications (when enabled)</li>
                    <li>Automatic updates in background</li>
                  </ul>
                </div>
              </div>
            </Section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

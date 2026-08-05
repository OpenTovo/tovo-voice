"use client"

import { motion, useReducedMotion } from "framer-motion"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Chrome,
  ExternalLink,
  FlaskConical,
  Globe,
  Lightbulb,
  Settings,
} from "lucide-react"
import Link from "next/link"
import {
  GuideSection,
  guideIconChip,
  guideStepBadge,
} from "@/components/guide-section"

const testRow =
  "bg-canvas border-hairline flex items-center gap-3 rounded-lg border p-4"

export default function WebGPUSetupPage() {
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
            WebGPU Setup
          </h1>

          <p className="text-ink-muted mb-12 text-lg leading-relaxed">
            Enable WebGPU in your browser for local AI processing with Tovo
            Voice.
          </p>

          <div className="bg-accent-soft mb-8 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-accent-strong mt-0.5 h-5 w-5" />
              <p className="text-accent-strong text-sm">
                <strong>Important:</strong> WebGPU is required for Tovo Voice's
                local AI processing. Without it, AI features will not work
                properly.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Chrome Desktop Section */}
            <GuideSection icon={Chrome} title="Chrome Desktop" delay={0.1}>
              <div className="space-y-4">
                <p className="text-ink-muted">
                  Chrome has WebGPU enabled by default in recent versions
                  (Chrome 113+). If you're having issues:
                </p>

                <ol className="text-ink-muted space-y-4">
                  <li className="flex gap-4">
                    <span className={guideStepBadge}>1</span>
                    <span>
                      Open Chrome and go to{" "}
                      <code className="bg-canvas border-hairline text-accent-strong rounded border px-2 py-1">
                        chrome://flags
                      </code>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className={guideStepBadge}>2</span>
                    <span>
                      Search for <strong className="text-ink">"WebGPU"</strong>{" "}
                      in the search box
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className={guideStepBadge}>3</span>
                    <span>
                      Set{" "}
                      <strong className="text-ink">"Unsafe WebGPU"</strong> to{" "}
                      <strong className="text-ink">"Enabled"</strong>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className={guideStepBadge}>4</span>
                    <span>
                      Click <strong className="text-ink">"Relaunch"</strong> to
                      restart Chrome
                    </span>
                  </li>
                </ol>

                <div className="bg-accent-soft mt-6 rounded-lg p-4">
                  <p className="text-accent-strong flex items-start gap-2 text-sm">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong>Note:</strong> the "Unsafe" label doesn't mean
                      it's actually unsafe — it's just Chrome's way of
                      indicating experimental features.
                    </span>
                  </p>
                </div>
              </div>
            </GuideSection>

            {/* Edge Section */}
            <GuideSection icon={Settings} title="Microsoft Edge" delay={0.15}>
              <div className="space-y-4">
                <p className="text-ink-muted">
                  Edge (version 113+) has similar WebGPU support to Chrome:
                </p>

                <ol className="text-ink-muted space-y-4">
                  <li className="flex gap-4">
                    <span className={guideStepBadge}>1</span>
                    <span>
                      Open Edge and go to{" "}
                      <code className="bg-canvas border-hairline text-accent-strong rounded border px-2 py-1">
                        edge://flags
                      </code>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className={guideStepBadge}>2</span>
                    <span>
                      Search for <strong className="text-ink">"WebGPU"</strong>{" "}
                      and enable the flag
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className={guideStepBadge}>3</span>
                    <span>Restart Edge when prompted</span>
                  </li>
                </ol>
              </div>
            </GuideSection>

            {/* Safari iOS Section */}
            <GuideSection
              icon={Settings}
              title="Safari on iOS (Not Supported)"
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
                    WebGPU setup for iOS (if support becomes available in the
                    future):
                  </p>

                  <ol className="text-ink-muted space-y-4">
                    <li className="flex gap-4">
                      <span className={guideStepBadge}>1</span>
                      <span>
                        Open <strong className="text-ink">Settings</strong> app
                        on your iPhone/iPad
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className={guideStepBadge}>2</span>
                      <span>
                        Scroll down and tap{" "}
                        <strong className="text-ink">Safari</strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className={guideStepBadge}>3</span>
                      <span>
                        Tap <strong className="text-ink">Advanced</strong> at
                        the bottom
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className={guideStepBadge}>4</span>
                      <span>
                        Tap <strong className="text-ink">Feature Flags</strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className={guideStepBadge}>5</span>
                      <span>
                        Find <strong className="text-ink">WebGPU</strong> and
                        toggle it <strong className="text-ink">ON</strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className={guideStepBadge}>6</span>
                      <span>Close Settings and restart Safari completely</span>
                    </li>
                  </ol>

                  <div className="bg-canvas border-hairline mt-6 rounded-lg border p-4">
                    <p className="text-ink-muted text-sm">
                      <strong>iOS Browser Limitation:</strong> only Safari
                      supports WebGPU on iOS. Chrome, Firefox, and other
                      browsers on iOS cannot access WebGPU due to Apple's
                      restrictions.
                    </p>
                  </div>
                </div>
              </div>
            </GuideSection>

            {/* Testing Section */}
            <GuideSection
              icon={CheckCircle}
              title="Test WebGPU Support"
              delay={0.25}
            >
              <div className="space-y-4">
                <p className="text-ink-muted">
                  After enabling WebGPU, you can test if it's working:
                </p>

                <div className="space-y-3">
                  <div className={testRow}>
                    <FlaskConical className="text-accent-strong h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-medium">Browser Console Test</p>
                      <p className="text-ink-muted text-sm">
                        Open browser console (F12) and type:{" "}
                        <code className="bg-surface border-hairline rounded border px-2 py-1">
                          navigator.gpu
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className={testRow}>
                    <Globe className="text-accent-strong h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-medium">Online WebGPU Test</p>
                      <a
                        href="https://webgpu.github.io/webgpu-samples/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-strong hover:text-accent flex items-center gap-2 text-sm"
                      >
                        Visit WebGPU Samples
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className={testRow}>
                    <CheckCircle className="text-accent-strong h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-medium">Tovo Voice Check</p>
                      <p className="text-ink-muted text-sm">
                        Visit Tovo Voice — the app will automatically detect
                        WebGPU support
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GuideSection>

            {/* Troubleshooting Section */}
            <GuideSection
              icon={AlertTriangle}
              title="Troubleshooting"
              delay={0.3}
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="font-medium text-red-700">
                      WebGPU not detected after enabling
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                      <li>Make sure you completely restarted your browser</li>
                      <li>Clear browser cache and cookies</li>
                      <li>Check if your graphics drivers are up to date</li>
                      <li>Try using an incognito/private browsing window</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="font-medium text-red-700">
                      WebGPU flag not available
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                      <li>Update your browser to the latest version</li>
                      <li>
                        Check if your device supports WebGPU (newer hardware
                        required)
                      </li>
                      <li>
                        Some older or low-end devices may not support WebGPU
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="font-medium text-red-700">
                      iOS Safari issues
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                      <li>Ensure you're running iOS 16.4 or later</li>
                      <li>
                        Only Safari works — Chrome/Firefox on iOS don't support
                        WebGPU
                      </li>
                      <li>
                        Force-close Safari completely and reopen after enabling
                        the flag
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-accent-strong mb-3 font-semibold">
                    Browser Compatibility
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-accent-soft rounded-lg p-4">
                      <p className="text-accent-strong font-medium">Supported</p>
                      <ul className="text-ink-muted mt-2 list-disc space-y-1 pl-5 text-sm">
                        <li>Chrome 113+ (Desktop/Android)</li>
                        <li>Edge 113+ (Desktop)</li>
                        <li>Safari 16.4+ (macOS only)</li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="font-medium text-red-700">Not Supported</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                        <li>Firefox (coming soon)</li>
                        <li>Safari on iOS (memory limitations)</li>
                        <li>Chrome/Firefox on iOS</li>
                        <li>Older browser versions</li>
                        <li>Some mobile browsers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </GuideSection>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

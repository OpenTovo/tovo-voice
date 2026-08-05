"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Lock } from "lucide-react"

const sectionClass =
  "border-hairline bg-surface shadow-card rounded-2xl border p-6 sm:p-8"
const h2Class = "text-ink mb-4 text-xl font-semibold tracking-tight"
const bodyClass = "text-ink-muted leading-relaxed"
const listClass = "text-ink-muted list-disc space-y-1.5 pl-5"

export default function PrivacyPage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mb-4 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-ink-muted mb-12 text-lg leading-relaxed">
            Your conversations and session data remain completely private.
          </p>

          <div className="space-y-8">
            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-accent-soft rounded-xl p-2.5">
                  <Lock className="text-accent-strong h-5 w-5" />
                </div>
                <h2 className="text-ink text-xl font-semibold tracking-tight">
                  Private Conversations
                </h2>
              </div>
              <p className={bodyClass}>
                At Tovo Voice, your privacy is our top priority. We operate on a
                simple principle:{" "}
                <strong className="text-ink">
                  we collect minimal data necessary for account functionality
                </strong>
                . Your conversations and session data remain completely private.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={h2Class}>What Data We DO Collect</h2>
              <ul className={listClass}>
                <li>Email address for account creation and authentication</li>
                <li>Basic account preferences and settings</li>
                <li>
                  Minimal analytics for app improvement (page visits, general
                  usage patterns)
                </li>
              </ul>
              <p className="text-ink-muted mt-4 text-sm">
                This is the only personal data we collect. Your conversations,
                transcriptions, and AI interactions remain private and local to
                your device.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={h2Class}>What Data We DON'T Collect</h2>
              <ul className={listClass}>
                <li>Voice recordings or transcriptions</li>
                <li>Conversation content or AI responses</li>
                <li>Session data or chat history</li>
                <li>Usage patterns or behavioral data beyond basic analytics</li>
                <li>Device information beyond basic compatibility checks</li>
                <li>Location data</li>
                <li>Personal information beyond email for authentication</li>
              </ul>
            </section>

            <section className={sectionClass}>
              <h2 className={h2Class}>How Your Data Stays Private</h2>
              <div className={`${bodyClass} space-y-4`}>
                <p>
                  <strong className="text-ink">Local Processing:</strong> all
                  voice processing, transcription, and AI interactions happen
                  entirely on your device. Nothing is sent to our servers.
                </p>
                <p>
                  <strong className="text-ink">Offline Capability:</strong> Tovo
                  Voice works offline, ensuring your conversations never leave
                  your device, even when connected to the internet.
                </p>
                <p>
                  <strong className="text-ink">Account-Based Access:</strong>{" "}
                  while Tovo Voice requires a simple account for access, we only
                  collect your email address for authentication. All your
                  conversations and AI interactions remain local to your device.
                </p>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className={h2Class}>Technical Implementation</h2>
              <div className={`${bodyClass} space-y-4`}>
                <p>
                  <strong className="text-ink">Browser Storage:</strong> only
                  basic app preferences and model files are stored locally in
                  your browser. You can clear this data anytime.
                </p>
                <p>
                  <strong className="text-ink">WebAssembly Processing:</strong>{" "}
                  all AI models run directly in your browser using WebAssembly,
                  ensuring complete isolation from external servers.
                </p>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className={h2Class}>Analytics & Monitoring</h2>
              <p className={bodyClass}>
                We use minimal, privacy-focused analytics (Google Analytics) to
                understand basic usage patterns like page visits and general
                geographic regions. This helps us improve the app but contains
                no personal or session-specific information.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={h2Class}>Contact & Support</h2>
              <p className={bodyClass}>
                If you contact us via email (support@tovo.dev), we'll only use
                your email address to respond to your inquiry. We don't share
                your contact information with third parties.
              </p>
            </section>

            <section className={`${sectionClass} border-accent/30`}>
              <h2 className={`${h2Class} text-accent-strong`}>
                Our Commitment
              </h2>
              <p className={bodyClass}>
                Tovo Voice is built on the principle that your conversations and
                data should remain completely private. We will never change this
                approach or start collecting user data. Your privacy is not a
                feature we can turn off — it's built into the very foundation of
                how Tovo Voice works.
              </p>
            </section>
          </div>

          <div className="mt-12 text-center">
            <p className="text-ink-muted">Last updated: July 15, 2025</p>
            <p className="text-ink-muted mt-2">
              Questions? Contact us at{" "}
              <a
                href="mailto:support@tovo.dev"
                className="text-accent-strong hover:text-accent"
              >
                support@tovo.dev
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

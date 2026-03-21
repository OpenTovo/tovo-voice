"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-4xl px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="mb-8 text-4xl font-bold md:text-5xl">
            Privacy <span className="text-zima">Policy</span>
          </h1>

          <div className="prose prose-slate prose-invert max-w-none">
            <div className="glass mb-8 rounded-xl p-8">
              <h2 className="mb-4 text-2xl font-semibold text-green-400">
                🔒 Private Conversations
              </h2>
              <p className="leading-relaxed text-slate-300">
                At Tovo, your privacy is our top priority. We operate on a
                simple principle:
                <strong className="text-white">
                  {" "}
                  we collect minimal data necessary for account functionality
                </strong>
                . Your conversations and session data remain completely private.
              </p>
            </div>

            <div className="space-y-8">
              <section className="glass rounded-xl p-8">
                <h2 className="mb-4 text-xl font-semibold">
                  What Data We DO Collect
                </h2>
                <ul className="space-y-2 text-slate-300">
                  <li>
                    • Email address for account creation and authentication
                  </li>
                  <li>• Basic account preferences and settings</li>
                  <li>
                    • Minimal analytics for app improvement (page visits,
                    general usage patterns)
                  </li>
                </ul>
                <p className="mt-4 text-sm text-slate-400">
                  This is the only personal data we collect. Your conversations,
                  transcriptions, and AI interactions remain private and local
                  to your device.
                </p>
              </section>

              <section className="glass rounded-xl p-8">
                <h2 className="mb-4 text-xl font-semibold">
                  What Data We DON'T Collect
                </h2>
                <ul className="space-y-2 text-slate-300">
                  <li>• Voice recordings or transcriptions</li>
                  <li>• Conversation content or AI responses</li>
                  <li>• Session data or chat history</li>
                  <li>
                    • Usage patterns or behavioral data beyond basic analytics
                  </li>
                  <li>
                    • Device information beyond basic compatibility checks
                  </li>
                  <li>• Location data</li>
                  <li>
                    • Personal information beyond email for authentication
                  </li>
                </ul>
              </section>

              <section className="glass rounded-xl p-8">
                <h2 className="mb-4 text-xl font-semibold">
                  How Your Data Stays Private
                </h2>
                <div className="space-y-4 text-slate-300">
                  <p>
                    <strong className="text-white">Local Processing:</strong>{" "}
                    All voice processing, transcription, and AI interactions
                    happen entirely on your device. Nothing is sent to our
                    servers.
                  </p>
                  <p>
                    <strong className="text-white">Offline Capability:</strong>{" "}
                    Tovo works offline, ensuring your conversations never leave
                    your device, even when connected to the internet.
                  </p>
                  <p>
                    <strong className="text-white">
                      Account-Based Access:
                    </strong>{" "}
                    While Tovo requires a simple account for access, we only
                    collect your email address for authentication. All your
                    conversations and AI interactions remain local to your
                    device.
                  </p>
                </div>
              </section>

              <section className="glass rounded-xl p-8">
                <h2 className="mb-4 text-xl font-semibold">
                  Technical Implementation
                </h2>
                <div className="space-y-4 text-slate-300">
                  <p>
                    <strong className="text-white">Browser Storage:</strong>{" "}
                    Only basic app preferences and model files are stored
                    locally in your browser. You can clear this data anytime.
                  </p>
                  <p>
                    <strong className="text-white">
                      WebAssembly Processing:
                    </strong>{" "}
                    All AI models run directly in your browser using
                    WebAssembly, ensuring complete isolation from external
                    servers.
                  </p>
                </div>
              </section>

              <section className="glass rounded-xl p-8">
                <h2 className="mb-4 text-xl font-semibold">
                  Analytics & Monitoring
                </h2>
                <p className="text-slate-300">
                  We use minimal, privacy-focused analytics (Google Analytics)
                  to understand basic usage patterns like page visits and
                  general geographic regions. This helps us improve the app but
                  contains no personal or session-specific information.
                </p>
              </section>

              <section className="glass rounded-xl p-8">
                <h2 className="mb-4 text-xl font-semibold">
                  Contact & Support
                </h2>
                <p className="text-slate-300">
                  If you contact us via email (support@tovo.dev), we'll only use
                  your email address to respond to your inquiry. We don't share
                  your contact information with third parties.
                </p>
              </section>

              <section className="glass rounded-xl border-green-500/20 p-8">
                <h2 className="mb-4 text-xl font-semibold text-green-400">
                  Our Commitment
                </h2>
                <p className="text-slate-300">
                  Tovo is built on the principle that your conversations and
                  data should remain completely private. We will never change
                  this approach or start collecting user data. Your privacy is
                  not a feature we can turn off—it's built into the very
                  foundation of how Tovo works.
                </p>
              </section>
            </div>

            <div className="mt-12 text-center">
              <p className="text-slate-400">Last updated: July 15, 2025</p>
              <p className="mt-2 text-slate-500">
                Questions? Contact us at{" "}
                <a
                  href="mailto:support@tovo.dev"
                  className="text-blue-400 hover:text-blue-300"
                >
                  support@tovo.dev
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

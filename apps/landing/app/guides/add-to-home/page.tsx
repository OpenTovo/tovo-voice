"use client"

import { motion } from "framer-motion"
import {
  ArrowLeft,
  Download,
  Monitor,
  MoreVertical,
  Share,
  Smartphone,
} from "lucide-react"
import Link from "next/link"

export default function AddToHomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-4xl px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link
            href="/guides"
            className="mb-8 inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guides
          </Link>

          <h1 className="mb-8 text-4xl font-bold md:text-5xl">
            <span className="text-zima">Add to Home Screen</span>
          </h1>

          <p className="mb-12 text-xl text-slate-400">
            Install Tovo as a PWA for offline access and a native app experience
          </p>

          <div className="space-y-12">
            {/* iOS Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass rounded-2xl p-8 opacity-60"
            >
              <div className="mb-6 flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-red-400" />
                <h2 className="text-2xl font-semibold text-red-400">
                  iPhone & iPad (Not Supported)
                </h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-6">
                  <h3 className="mb-3 font-semibold text-red-300">
                    ⚠️ iOS Not Currently Supported
                  </h3>
                  <p className="text-red-200">
                    Unfortunately, Tovo doesn't work on iOS devices due to
                    Safari's memory limitations. Our app requires at least 650MB
                    of memory to run the transcription and AI models, but iOS
                    Safari is limited to 200-400MB depending on the device.
                  </p>
                  <p className="mt-3 text-red-200">
                    <strong>
                      Please use a desktop computer or Android device instead.
                    </strong>
                  </p>
                </div>

                <div className="opacity-50">
                  <p className="mb-4 text-sm text-slate-400">
                    Installation steps (if iOS support becomes available in the
                    future):
                  </p>
                  <ol className="space-y-4 text-slate-400">
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        1
                      </span>
                      <span>
                        Open{" "}
                        <strong className="text-slate-300">
                          Safari browser
                        </strong>{" "}
                        and navigate to Tovo (pwa.tovo.dev)
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        2
                      </span>
                      <div className="space-y-2">
                        <span>
                          Tap the{" "}
                          <strong className="text-slate-300">
                            Share button
                          </strong>{" "}
                          at the bottom of the screen
                        </span>
                        <div className="flex items-center gap-2 rounded-md bg-slate-800 p-3">
                          <Share className="h-5 w-5 text-slate-500" />
                          <span className="text-sm text-slate-500">
                            Share icon
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        3
                      </span>
                      <span>
                        Scroll down and tap{" "}
                        <strong className="text-slate-300">
                          "Add to Home Screen"
                        </strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        4
                      </span>
                      <span>
                        Confirm by tapping{" "}
                        <strong className="text-slate-300">"Add"</strong> in the
                        top right
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </motion.section>

            {/* Android Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-2xl p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-green-400" />
                <h2 className="text-2xl font-semibold">Android (Chrome)</h2>
              </div>

              <div className="space-y-4">
                <ol className="space-y-4 text-slate-300">
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-medium text-white">
                      1
                    </span>
                    <span>
                      Open{" "}
                      <strong className="text-white">Chrome browser</strong> and
                      navigate to Tovo (pwa.tovo.dev)
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-medium text-white">
                      2
                    </span>
                    <div className="space-y-2">
                      <span>
                        Tap the{" "}
                        <strong className="text-white">three-dot menu</strong>{" "}
                        in the top right corner
                      </span>
                      <div className="flex items-center gap-2 rounded-md bg-slate-800 p-3">
                        <MoreVertical className="h-5 w-5 text-green-400" />
                        <span className="text-sm text-slate-400">
                          Three-dot menu
                        </span>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-medium text-white">
                      3
                    </span>
                    <span>
                      Tap{" "}
                      <strong className="text-white">
                        "Add to Home screen"
                      </strong>{" "}
                      or <strong className="text-white">"Install app"</strong>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-medium text-white">
                      4
                    </span>
                    <span>
                      Confirm by tapping{" "}
                      <strong className="text-white">"Add"</strong> or{" "}
                      <strong className="text-white">"Install"</strong>
                    </span>
                  </li>
                </ol>

                <div className="mt-6 rounded-lg border border-green-500/20 bg-green-950/30 p-4">
                  <p className="text-green-200">
                    💡 <strong>Alternative:</strong> You might also see a banner
                    at the bottom of the screen asking to install the app.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Desktop Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass rounded-2xl p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <Monitor className="h-6 w-6 text-purple-400" />
                <h2 className="text-2xl font-semibold">
                  Desktop (Chrome, Edge, Safari)
                </h2>
              </div>

              <div className="space-y-4">
                <ol className="space-y-4 text-slate-300">
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white">
                      1
                    </span>
                    <span>
                      Open your browser and navigate to Tovo (pwa.tovo.dev)
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white">
                      2
                    </span>
                    <div className="space-y-2">
                      <span>
                        Look for the{" "}
                        <strong className="text-white">install icon</strong> in
                        the address bar, or use the browser menu
                      </span>
                      <div className="flex items-center gap-2 rounded-md bg-slate-800 p-3">
                        <Download className="h-5 w-5 text-purple-400" />
                        <span className="text-sm text-slate-400">
                          Install icon in address bar
                        </span>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white">
                      3
                    </span>
                    <span>
                      Click <strong className="text-white">"Install"</strong> or{" "}
                      <strong className="text-white">
                        "Add to Home Screen"
                      </strong>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white">
                      4
                    </span>
                    <span>Confirm to add Tovo to your desktop</span>
                  </li>
                </ol>

                <div className="mt-6 rounded-lg border border-purple-500/20 bg-purple-950/30 p-4">
                  <p className="text-purple-200">
                    💡 <strong>Alternative:</strong> You can also drag the URL
                    from the address bar to your desktop to create a shortcut.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Benefits Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="mb-6 text-2xl font-semibold">
                Why Install as a PWA?
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-400">
                    Performance Benefits
                  </h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Faster loading and better performance</li>
                    <li>• Works offline once cached</li>
                    <li>• Native app-like experience</li>
                    <li>• No app store download required</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-400">
                    User Experience
                  </h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Dedicated app icon on home screen</li>
                    <li>• Full-screen experience without browser UI</li>
                    <li>• Push notifications (when enabled)</li>
                    <li>• Automatic updates in background</li>
                  </ul>
                </div>
              </div>
            </motion.section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

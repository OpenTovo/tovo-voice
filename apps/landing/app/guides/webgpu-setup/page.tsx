"use client"

import { motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Chrome,
  ExternalLink,
  Settings,
} from "lucide-react"
import Link from "next/link"

export default function WebGPUSetupPage() {
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
            <span className="text-zima">WebGPU Setup</span>
          </h1>

          <p className="mb-12 text-xl text-slate-400">
            Enable WebGPU in your browser for local AI processing with Tovo
          </p>

          <div className="mb-8 rounded-lg border border-amber-500/20 bg-amber-950/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
              <div>
                <p className="text-amber-200">
                  <strong>Important:</strong> WebGPU is required for Tovo's
                  local AI processing. Without it, AI features will not work
                  properly.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {/* Chrome Desktop Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass rounded-2xl p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <Chrome className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-semibold">Chrome Desktop</h2>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300">
                  Chrome has WebGPU enabled by default in recent versions
                  (Chrome 113+). If you're having issues:
                </p>

                <ol className="space-y-4 text-slate-300">
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      1
                    </span>
                    <span>
                      Open Chrome and go to{" "}
                      <code className="rounded bg-slate-800 px-2 py-1 text-blue-300">
                        chrome://flags
                      </code>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      2
                    </span>
                    <span>
                      Search for{" "}
                      <strong className="text-white">"WebGPU"</strong> in the
                      search box
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      3
                    </span>
                    <span>
                      Set{" "}
                      <strong className="text-white">"Unsafe WebGPU"</strong> to{" "}
                      <strong className="text-green-400">"Enabled"</strong>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      4
                    </span>
                    <span>
                      Click <strong className="text-white">"Relaunch"</strong>{" "}
                      to restart Chrome
                    </span>
                  </li>
                </ol>

                <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-950/30 p-4">
                  <p className="text-blue-200">
                    💡 <strong>Note:</strong> The "Unsafe" label doesn't mean
                    it's actually unsafe - it's just Chrome's way of indicating
                    experimental features.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Safari iOS Section - Now with warning */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-2xl p-8 opacity-60"
            >
              <div className="mb-6 flex items-center gap-3">
                <Settings className="h-6 w-6 text-red-400" />
                <h2 className="text-2xl font-semibold text-red-400">
                  Safari on iOS (Not Supported)
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
                  <p className="mb-4 text-slate-300">
                    WebGPU setup for iOS (if support becomes available in the
                    future):
                  </p>

                  <ol className="space-y-4 text-slate-400">
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        1
                      </span>
                      <span>
                        Open{" "}
                        <strong className="text-slate-300">Settings</strong> app
                        on your iPhone/iPad
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        2
                      </span>
                      <span>
                        Scroll down and tap{" "}
                        <strong className="text-slate-300">Safari</strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        3
                      </span>
                      <span>
                        Tap <strong className="text-slate-300">Advanced</strong>{" "}
                        at the bottom
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        4
                      </span>
                      <span>
                        Tap{" "}
                        <strong className="text-slate-300">
                          Feature Flags
                        </strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        5
                      </span>
                      <span>
                        Find <strong className="text-slate-300">WebGPU</strong>{" "}
                        and toggle it{" "}
                        <strong className="text-slate-300">ON</strong>
                      </span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-white">
                        6
                      </span>
                      <span>Close Settings and restart Safari completely</span>
                    </li>
                  </ol>

                  <div className="mt-6 rounded-lg border border-slate-500/20 bg-slate-950/30 p-4">
                    <p className="text-slate-400">
                      ⚠️ <strong>iOS Browser Limitation:</strong> Only Safari
                      supports WebGPU on iOS. Chrome, Firefox, and other
                      browsers on iOS cannot access WebGPU due to Apple's
                      restrictions.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Edge Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass rounded-2xl p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-semibold">Microsoft Edge</h2>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300">
                  Edge (version 113+) has similar WebGPU support to Chrome:
                </p>

                <ol className="space-y-4 text-slate-300">
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      1
                    </span>
                    <span>
                      Open Edge and go to{" "}
                      <code className="rounded bg-slate-800 px-2 py-1 text-blue-300">
                        edge://flags
                      </code>
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      2
                    </span>
                    <span>
                      Search for{" "}
                      <strong className="text-white">"WebGPU"</strong> and
                      enable the flag
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      3
                    </span>
                    <span>Restart Edge when prompted</span>
                  </li>
                </ol>
              </div>
            </motion.section>

            {/* Testing Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="glass rounded-2xl p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <h2 className="text-2xl font-semibold">Test WebGPU Support</h2>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300">
                  After enabling WebGPU, you can test if it's working:
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-800 p-4">
                    <span className="text-2xl">🧪</span>
                    <div>
                      <p className="font-medium">Browser Console Test</p>
                      <p className="text-sm text-slate-400">
                        Open browser console (F12) and type:{" "}
                        <code className="rounded bg-slate-700 px-2 py-1">
                          navigator.gpu
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-slate-800 p-4">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <p className="font-medium">Online WebGPU Test</p>
                      <a
                        href="https://webgpu.github.io/webgpu-samples/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                      >
                        Visit WebGPU Samples
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-slate-800 p-4">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium">Tovo Check</p>
                      <p className="text-sm text-slate-400">
                        Visit Tovo - the app will automatically detect WebGPU
                        support
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Troubleshooting Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="glass rounded-2xl p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
                <h2 className="text-2xl font-semibold">Troubleshooting</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold text-red-400">
                    Common Issues
                  </h3>
                  <div className="space-y-3 text-slate-300">
                    <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                      <p className="font-medium text-red-300">
                        WebGPU not detected after enabling
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>
                          • Make sure you completely restarted your browser
                        </li>
                        <li>• Clear browser cache and cookies</li>
                        <li>• Check if your graphics drivers are up to date</li>
                        <li>
                          • Try using an incognito/private browsing window
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                      <p className="font-medium text-red-300">
                        WebGPU flag not available
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Update your browser to the latest version</li>
                        <li>
                          • Check if your device supports WebGPU (newer hardware
                          required)
                        </li>
                        <li>
                          • Some older or low-end devices may not support WebGPU
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                      <p className="font-medium text-red-300">
                        iOS Safari issues
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Ensure you're running iOS 16.4 or later</li>
                        <li>
                          • Only Safari works - Chrome/Firefox on iOS don't
                          support WebGPU
                        </li>
                        <li>
                          • Force-close Safari completely and reopen after
                          enabling the flag
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-green-400">
                    Browser Compatibility
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                      <p className="font-medium text-green-300">✅ Supported</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-300">
                        <li>• Chrome 113+ (Desktop/Android)</li>
                        <li>• Edge 113+ (Desktop)</li>
                        <li>• Safari 16.4+ (macOS only)</li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                      <p className="font-medium text-red-300">
                        ❌ Not Supported
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-300">
                        <li>• Firefox (coming soon)</li>
                        <li>• Safari on iOS (memory limitations)</li>
                        <li>• Chrome/Firefox on iOS</li>
                        <li>• Older browser versions</li>
                        <li>• Some mobile browsers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

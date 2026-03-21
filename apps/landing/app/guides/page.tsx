"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Home, Monitor, Settings, Smartphone } from "lucide-react"
import Link from "next/link"

export default function GuidesPage() {
  const guides = [
    {
      title: "Add to Home Screen",
      description:
        "Install Tovo as a PWA for offline access and native app experience",
      icon: Home,
      href: "/guides/add-to-home",
      color: "from-blue-500 to-purple-600",
    },
    {
      title: "WebGPU Setup",
      description: "Enable WebGPU in your browser for local AI processing",
      icon: Settings,
      href: "/guides/webgpu-setup",
      color: "from-green-500 to-blue-600",
    },
  ]

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
            Tovo <span className="text-zima">Guides</span>
          </h1>

          <p className="mb-12 text-xl text-slate-400">
            Step-by-step guides to help you get the most out of Tovo
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide, index) => (
              <motion.div
                key={guide.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={guide.href}
                  className="glass glow-card group block rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-full bg-gradient-to-br ${guide.color} p-3`}
                    >
                      <guide.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-semibold group-hover:text-blue-400">
                        {guide.title}
                      </h3>
                      <p className="text-slate-400">{guide.description}</p>
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

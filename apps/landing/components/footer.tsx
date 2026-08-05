"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Github, Mail } from "lucide-react"
import Link from "next/link"

const socialLinks = [
  {
    href: "mailto:support@tovo.dev",
    label: "Email",
    external: false,
    icon: <Mail className="h-5 w-5" />,
  },
  {
    href: "https://x.com/qiweiy",
    label: "X",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
      </svg>
    ),
  },
  {
    href: "https://discord.gg/X5EK8m2ksN",
    label: "Discord",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    href: "https://github.com/OpenTovo/tovo-voice",
    label: "GitHub",
    external: true,
    icon: <Github className="h-5 w-5" />,
  },
]

const navLinks = [
  { href: "/guides", label: "Help & Guides" },
  { href: "/privacy", label: "Privacy Policy" },
]

export default function Footer() {
  const reduceMotion = useReducedMotion()

  return (
    <footer className="border-hairline border-t px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-[1120px]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between"
        >
          {/* Social icons */}
          <div className="flex items-center justify-center gap-1">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={link.label}
                className="text-ink-muted hover:text-ink hover:bg-ink/[0.05] inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              >
                {link.icon}
              </a>
            ))}
          </div>

          {/* Nav + copyright */}
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <div className="flex items-center gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-ink-muted hover:text-ink text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <span className="text-ink-muted text-sm">
              © 2026 Tovo Voice. All rights reserved.
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

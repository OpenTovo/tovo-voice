"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Mail } from "lucide-react"
import Link from "next/link"
import { DiscordIcon, GithubIcon, XIcon } from "./icons/brand-icons"

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
    icon: <XIcon className="h-4 w-4" />,
  },
  {
    href: "https://discord.gg/X5EK8m2ksN",
    label: "Discord",
    external: true,
    icon: <DiscordIcon className="h-5 w-5" />,
  },
  {
    href: "https://github.com/OpenTovo/tovo-voice",
    label: "GitHub",
    external: true,
    icon: <GithubIcon className="h-5 w-5" />,
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

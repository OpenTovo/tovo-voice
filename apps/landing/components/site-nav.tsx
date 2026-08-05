import Image from "next/image"
import Link from "next/link"

export function SiteNav() {
  return (
    <header className="bg-canvas/72 sticky top-0 z-50 border-b border-hairline backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/tovo-icon.png"
            alt="Tovo Voice logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-[15px] font-semibold tracking-tight">
            Tovo Voice
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/guides"
            className="text-ink-muted hover:text-ink rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            Guides
          </Link>
          <a
            href="https://github.com/OpenTovo/tovo-voice"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-ink hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:block"
          >
            GitHub
          </a>
          <a
            href="https://pwa.tovo.dev"
            className="bg-ink text-surface hover:bg-ink/85 ml-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98]"
          >
            Launch App
          </a>
        </div>
      </nav>
    </header>
  )
}

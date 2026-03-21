"use client"

import { useAuth } from "./providers/auth"
import { PWAPrompt } from "./pwa-prompt"

export function GlobalComponents() {
  const { user } = useAuth()

  return (
    <>
      <PWAPrompt isLoggedIn={!!user} />
    </>
  )
}

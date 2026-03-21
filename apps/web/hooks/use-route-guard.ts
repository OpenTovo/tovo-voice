"use client"

import { useAtomValue } from "jotai"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/providers/auth"
import { cachedAuthStateAtom } from "@/lib/auth/client-cache"

/**
 * Client-side route guard hook for faster navigation
 * Reduces dependency on middleware for immediate auth checks
 */
export function useRouteGuard(
  options: {
    requireAuth?: boolean
    redirectTo?: string
    enabled?: boolean
  } = {}
) {
  const { requireAuth = true, redirectTo = "/login", enabled = true } = options

  const { user, loading } = useAuth()
  const router = useRouter()

  // Get cached auth state for faster initial checks
  const cachedUserId = useAtomValue(cachedAuthStateAtom)
  const hasAuthIndication = !!user || !!cachedUserId

  useEffect(() => {
    if (!enabled) return

    // If we're loading and have no cached indication of auth, wait
    if (loading && !cachedUserId) return

    // If auth is required but user is not authenticated (and no cache suggests they are)
    if (requireAuth && !user && !cachedUserId) {
      router.push(redirectTo)
      return
    }

    // If user is authenticated but on auth pages, redirect to main app immediately
    if (
      !requireAuth &&
      user &&
      (window.location.pathname === "/login" ||
        window.location.pathname === "/auth/callback")
    ) {
      router.replace("/new") // Use replace to avoid back button issues
      return
    }
  }, [user, loading, requireAuth, redirectTo, enabled, router, cachedUserId])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isReady: !loading || hasAuthIndication,
  }
}

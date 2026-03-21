/**
 * Client-side auth state cache using Jotai atoms for better state management
 * Stores auth state in memory with automatic expiration
 */

import { atom } from "jotai"

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface AuthCache {
  userId: string | null
  timestamp: number
  expiresAt: number
}

// Private atom for storing the auth cache
const authCacheAtom = atom<AuthCache | null>(null)

// Read-only atom that returns cached userId if valid, null if expired
export const cachedAuthStateAtom = atom<string | null>((get) => {
  const cache = get(authCacheAtom)
  if (!cache) return null

  const now = Date.now()
  if (now > cache.expiresAt) {
    return null // Cache expired
  }

  return cache.userId
})

// Write-only atom for setting auth cache
export const setCachedAuthStateAtom = atom(
  null,
  (get, set, userId: string | null) => {
    const now = Date.now()
    const authCache: AuthCache = {
      userId,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    }
    set(authCacheAtom, authCache)
  }
)

// Write-only atom for clearing auth cache
export const clearCachedAuthStateAtom = atom(null, (get, set) => {
  set(authCacheAtom, null)
})

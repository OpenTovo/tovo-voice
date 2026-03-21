"use client"

import type { Session, User } from "@supabase/supabase-js"
import { useSetAtom } from "jotai"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  clearCachedAuthStateAtom,
  setCachedAuthStateAtom,
} from "@/lib/auth/client-cache"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<ReturnType<
    typeof createClient
  > | null>(null)

  // Atom setters for auth cache
  const setCachedAuthState = useSetAtom(setCachedAuthStateAtom)
  const clearCachedAuthState = useSetAtom(clearCachedAuthStateAtom)

  useEffect(() => {
    const client = createClient()
    setSupabase(client)

    // Get initial session (this is the source of truth)
    client.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", { user: session?.user?.id })
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Update cache with real auth state
      setCachedAuthState(session?.user?.id ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", { event, user: session?.user?.id })

      // Clear cache on auth state changes to ensure fresh state
      if (
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "SIGNED_IN"
      ) {
        clearCachedAuthState()
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Update cache with new auth state
      setCachedAuthState(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setCachedAuthState, clearCachedAuthState])

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error("Supabase client is not ready")
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      throw error
    }
  }

  const signInWithEmail = async (email: string) => {
    if (!supabase) {
      throw new Error("Supabase client is not ready")
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })
    if (error) {
      throw error
    }
  }

  const verifyOtp = async (email: string, token: string) => {
    if (!supabase) {
      throw new Error("Supabase client is not ready")
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })
    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    if (!supabase) {
      throw new Error("Supabase client is not ready")
    }

    const { error } = await supabase.auth.signOut()
    // Clear the auth cache to ensure clean state
    clearCachedAuthState()
    if (error) {
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    verifyOtp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

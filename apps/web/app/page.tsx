"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/providers/auth"
import { useRouteGuard } from "@/hooks/use-route-guard"

export default function Page() {
  const { user } = useAuth()
  const { isReady } = useRouteGuard({ requireAuth: false }) // Don't require auth for root page
  const router = useRouter()

  useEffect(() => {
    if (!isReady) return

    if (user) {
      console.log("Redirecting authenticated user to /new")
      router.replace("/new")
    } else {
      console.log("Redirecting unauthenticated user to /login")
      router.replace("/login")
    }
  }, [user, isReady, router])

  // Show loading while checking auth and redirecting
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full space-y-4 text-center">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto h-4 w-24" />
      </div>
    </div>
  )
}

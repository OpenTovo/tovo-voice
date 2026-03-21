"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { toast } from "@workspace/ui/components/sonner"
import { AlertTriangle, Copy, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Log error to console for debugging
    console.error("Error boundary caught:", error)
  }, [error])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Error details copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleContactSupport = async () => {
    const supportEmail = "support@tovo.app"
    const errorDetails = `
Error: ${error.message}
Digest: ${error.digest || "N/A"}
Stack: ${error.stack || "N/A"}
URL: ${typeof window !== "undefined" ? window.location.href : "N/A"}
User Agent: ${typeof window !== "undefined" ? navigator.userAgent : "N/A"}
Timestamp: ${new Date().toISOString()}
    `.trim()

    await copyToClipboard(errorDetails)
    toast.success(`Support email copied: ${supportEmail}`)
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Something went wrong
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-muted-foreground text-center">
            <p className="mb-2">We encountered an unexpected error.</p>
            <p className="text-sm">Don't worry, we're here to help!</p>
          </div>

          {/* Error details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="mb-2 text-sm font-medium">Error Details:</p>
            <code className="text-muted-foreground break-all text-xs">
              {error.message || "Unknown error occurred"}
            </code>
            {error.digest && (
              <p className="text-muted-foreground mt-2 text-xs">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button onClick={reset} className="w-full" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={handleContactSupport}
              variant="outline"
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Contact Support"}
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>

          <div className="text-muted-foreground text-center text-xs">
            <p>If the problem persists, please contact our support team.</p>
            <p className="mt-1">support@tovo.app</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

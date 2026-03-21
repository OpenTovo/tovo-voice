"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useEffect } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Global error boundary caught:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-fit rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-semibold">
                Application Error
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-muted-foreground text-center">
                <p className="mb-2">
                  The application encountered a critical error.
                </p>
                <p className="text-sm">Please try refreshing the page.</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="mb-2 text-sm font-medium">Error:</p>
                <code className="text-muted-foreground break-all text-xs">
                  {error.message || "Unknown application error"}
                </code>
              </div>

              <Button onClick={reset} className="w-full" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart Application
              </Button>

              <div className="text-muted-foreground text-center text-xs">
                <p>If the problem persists, please contact support@tovo.app</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}

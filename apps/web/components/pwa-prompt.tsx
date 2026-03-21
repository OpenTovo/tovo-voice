"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { useAtom } from "jotai"
import { AlertTriangle, Home, Settings, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  getDeviceType,
  isPWAInstalled,
  pwaPromptDismissedAtom,
  shouldShowInstallPrompt,
} from "@/lib/utils/pwa"

interface PWAPromptProps {
  isLoggedIn: boolean
}

export function PWAPrompt({ isLoggedIn }: PWAPromptProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [dismissed, setDismissed] = useAtom(pwaPromptDismissedAtom)
  const router = useRouter()

  useEffect(() => {
    // Only show after login and if conditions are met
    if (isLoggedIn && !dismissed) {
      const checkAndShow = () => {
        const isInstalled = isPWAInstalled()
        const shouldShow = shouldShowInstallPrompt()
        const deviceType = getDeviceType()

        // Show dialog if not installed and should show prompt, or if iOS (to show warning)
        if ((!isInstalled && shouldShow) || deviceType === "ios") {
          // Small delay to ensure login process is complete
          setTimeout(() => {
            setShowDialog(true)
          }, 1000)
        }
      }

      checkAndShow()
    }
  }, [isLoggedIn, dismissed])

  const handleDismiss = () => {
    setShowDialog(false)
    setDismissed(true)
  }

  const handleGoToSettings = () => {
    setShowDialog(false)
    router.push("/settings")
  }

  const deviceType = getDeviceType()
  const isIOS = deviceType === "ios"

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIOS ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                iOS Not Supported
              </>
            ) : (
              <>
                <Home className="h-5 w-5" />
                Add to Home Screen
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isIOS
              ? "Tovo doesn't work on iOS devices due to memory limitations"
              : "Get the best experience with offline access"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isIOS ? (
            <>
              <div className="rounded-lg border border-red-500/30 bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm text-red-600 dark:text-red-200">
                  Unfortunately, Tovo requires at least 650MB of memory to run
                  the transcription and AI models, but iOS Safari is limited to
                  200-400MB depending on the device.
                </p>
                <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-200">
                  Please use a desktop computer or Android device instead.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDismiss} className="flex-1">
                  Understood
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">Add Tovo to your home screen to:</p>

              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Use Tovo like a native app</li>
                <li>Offline access</li>
                <li>Get faster performance</li>
              </ul>

              <div className="flex gap-2">
                <Button onClick={handleGoToSettings} className="flex-1">
                  <Settings className="mr-2 h-4 w-4" />
                  Learn How in Settings
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDismiss}
                  title="Not now"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-muted-foreground text-center text-xs">
                You can always add to home screen later from Settings
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

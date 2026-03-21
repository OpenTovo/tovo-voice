"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { ChevronRight, Info, RefreshCw } from "lucide-react"
import { useUpdateDetection } from "@/hooks/use-update-detection"

export function VersionManagement() {
  const {
    updateInfo,
    isChecking,
    currentVersion,
    handleCheckNow,
    handleAcceptUpdate,
  } = useUpdateDetection()

  const hasUpdate = updateInfo?.hasUpdate && !isChecking

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Info className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Version</div>
              <div className="text-muted-foreground text-sm">
                App version and updates
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUpdate && (
              <Badge variant="destructive" className="text-xs">
                Update
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-md px-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Version Information</DialogTitle>
          <DialogDescription>
            Manage app version and check for updates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Version:</span>
              <span className="font-mono">{currentVersion}</span>
            </div>
            {updateInfo && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest Version:</span>
                <span className="font-mono">
                  {updateInfo.latestVersion}
                  {hasUpdate && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      New
                    </Badge>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCheckNow}
              disabled={isChecking}
              className="flex-1"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`}
              />
              {isChecking ? "Checking..." : "Check Now"}
            </Button>

            {hasUpdate && (
              <Button onClick={handleAcceptUpdate} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Update
              </Button>
            )}
          </div>

          {!hasUpdate && updateInfo && !isChecking && (
            <p className="text-muted-foreground text-center text-sm">
              You're using the latest version
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

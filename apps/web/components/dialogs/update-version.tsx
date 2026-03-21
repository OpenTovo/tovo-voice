"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { RefreshCw, X } from "lucide-react"
import { useUpdateDetection } from "@/hooks/use-update-detection"

export function UpdateVersion() {
  const {
    shouldShowUpdate,
    updateInfo,
    handleAcceptUpdate,
    handleDismissUpdate,
  } = useUpdateDetection()

  if (!shouldShowUpdate || !updateInfo) {
    return null
  }

  return (
    <Dialog open={shouldShowUpdate} onOpenChange={() => {}}>
      <DialogContent className="w-[90vw] max-w-md px-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Update Available
          </DialogTitle>
          <DialogDescription>
            A new version of Tovo is available. Reload to get the latest
            features and improvements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current:</span>
            <span className="font-mono">{updateInfo.currentVersion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available:</span>
            <span className="text-primary font-mono font-medium">
              {updateInfo.latestVersion}
            </span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDismissUpdate}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Not Now
          </Button>
          <Button onClick={handleAcceptUpdate} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

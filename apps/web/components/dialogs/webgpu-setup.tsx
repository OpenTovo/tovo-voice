"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { ExternalLink, Settings } from "lucide-react"
import { getWebGPUGuidance } from "@/lib/llm"
import { smartReload } from "@/lib/utils/pwa"

interface WebGPUSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WebGPUSetupDialog({
  open,
  onOpenChange,
}: WebGPUSetupDialogProps) {
  const guidance = getWebGPUGuidance()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md px-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enable WebGPU
          </DialogTitle>
          <DialogDescription>
            WebGPU is required for local AI processing. Follow these steps to
            enable it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {guidance.setupInstructions && (
            <div>
              <h4 className="mb-2 font-medium">Setup Instructions:</h4>
              <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
                {guidance.setupInstructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => smartReload()} className="w-full">
              Check Again
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                window.open(
                  "https://voice.tovo.dev/guides/webgpu-setup",
                  "_blank"
                )
              }}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Detailed Guide
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
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
import { useAtom } from "jotai"
import { AlertCircle, Bot, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { WebGPUSetupDialog } from "@/components/dialogs/webgpu-setup"
import { WebLLMModelsDownload } from "@/components/llm/webllm-models-download"
import { webllmDownloadProgressAtom } from "@/lib/atoms/settings"
import { detectWebGPU } from "@/lib/llm"
import type { WebLLMModelName } from "@/lib/llm/models"

interface WebLLMModelsManagementProps {
  onModelChange?: () => void
  canDeleteModel?: (modelName: string) => boolean
  onDeleteModel?: (modelName: WebLLMModelName) => Promise<void>
}

export function WebLLMModelsManagement({
  onModelChange,
  canDeleteModel,
  onDeleteModel,
}: WebLLMModelsManagementProps) {
  const [webgpuInfo, setWebgpuInfo] = useState<any>(null)
  const [showWebGPUDialog, setShowWebGPUDialog] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [globalDownloadProgress] = useAtom(webllmDownloadProgressAtom)

  useEffect(() => {
    const checkAvailability = async () => {
      const webgpuResult = await detectWebGPU()
      setWebgpuInfo(webgpuResult)
    }

    checkAvailability()
  }, [])

  const getStatusBadge = () => {
    if (!webgpuInfo?.isEnabled) {
      return (
        <Badge variant="secondary" className="text-xs">
          Setup Required
        </Badge>
      )
    }

    if (globalDownloadProgress.isDownloading) {
      return (
        <Badge variant="secondary" className="text-xs">
          Downloading...
        </Badge>
      )
    }

    return null
  }

  const handleModelReady = () => {
    if (onModelChange) {
      onModelChange()
    }
  }

  const getDescription = () => {
    if (!webgpuInfo?.isEnabled) {
      return "WebGPU setup required"
    }

    if (globalDownloadProgress.isDownloading) {
      return `Downloading... ${globalDownloadProgress.progress}%`
    }

    return "Manage local LLMs"
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-auto w-full items-center justify-between p-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Bot className="h-5 w-5" />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-medium">
                    Large Language Models
                    <span className="text-red-500">*</span>
                  </span>
                  {getStatusBadge()}
                </div>
                <div className="text-muted-foreground text-sm">
                  {getDescription()}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="my-4 w-[90dvw] px-4"
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Large Language Models</DialogTitle>
            <DialogDescription>
              Download and manage local LLMs for AI analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!webgpuInfo?.isEnabled && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  WebGPU is required for local AI processing.
                  <Button
                    variant="link"
                    className="h-auto p-0 font-normal underline"
                    onClick={() => setShowWebGPUDialog(true)}
                  >
                    Enable WebGPU
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {webgpuInfo?.isEnabled && (
              <div className="max-h-96 overflow-y-auto py-4">
                <WebLLMModelsDownload
                  onModelReady={handleModelReady}
                  canDeleteModel={canDeleteModel}
                  onDeleteModel={onDeleteModel}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <WebGPUSetupDialog
        open={showWebGPUDialog}
        onOpenChange={setShowWebGPUDialog}
      />
    </>
  )
}

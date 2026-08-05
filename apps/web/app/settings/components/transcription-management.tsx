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
import { ChevronRight, Mic } from "lucide-react"
import { useAtom } from "jotai"
import { TranscriptionModelDownload } from "@/components/transcription/transcription-model-download"
import { transcriptionDownloadProgressAtom } from "@/lib/atoms/settings"

interface TranscriptionManagementProps {
  onClose?: () => void
  onModelReady?: () => Promise<void> | void
}

export function TranscriptionManagement({
  onModelReady,
}: TranscriptionManagementProps) {
  const [asrDownload] = useAtom(transcriptionDownloadProgressAtom)

  const getStatusBadge = () => {
    if (asrDownload.isDownloading) {
      return (
        <Badge variant="secondary" className="text-xs">
          Downloading...
        </Badge>
      )
    }
    return null
  }

  const getDescription = () => {
    if (asrDownload.isDownloading) {
      return `Downloading... ${asrDownload.progress}%`
    }
    return "Manage transcription models"
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Mic className="h-5 w-5" />
            <div className="text-left">
              <div className="flex items-center gap-2 font-medium">
                Transcription Models
                <span className="text-destructive">*</span>
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

      <DialogContent className="my-8 w-[90vw] max-w-2xl px-4">
        <DialogHeader>
          <DialogTitle>Transcription Models</DialogTitle>
          <DialogDescription>
            Download and manage speech recognition models for real-time
            transcription
          </DialogDescription>
        </DialogHeader>

        <div className="h-[300px] w-full py-4">
          <TranscriptionModelDownload onModelReady={onModelReady} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
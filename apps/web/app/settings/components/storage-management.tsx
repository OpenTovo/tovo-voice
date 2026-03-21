"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useSetAtom } from "jotai"
import { ChevronRight, HardDrive, Trash2 } from "lucide-react"
import { showConfirmDialogAtom } from "@/lib/atoms/dialog"
import {
  formatFileSize,
  formatFileSizeFromBytes,
  formatStorageQuota,
} from "@/lib/utils"

interface StorageInfo {
  quota?: number
  whisperModels: Array<{ url: string; size: number; timestamp: number }>
  webllmModels: Array<{
    id: string
    name: string
    size: number
    modelId: string
  }>
  sherpaModels: Array<{ url: string; size: number; timestamp: number }>
  sessionHistorySize: number
}

interface StorageManagementProps {
  storageInfo: StorageInfo
  isLoading?: boolean
  onClearAllCache: () => void
  onClearSherpaCache?: () => void
}

export function StorageManagement({
  storageInfo,
  isLoading = false,
  onClearAllCache,
}: StorageManagementProps) {
  const showConfirmDialog = useSetAtom(showConfirmDialogAtom)

  const handleClearAllData = async () => {
    const confirmed = await showConfirmDialog({
      title: "Clear All Data",
      message: `Are you sure you want to clear all data?

This will permanently delete:
• All downloaded transcription models
• All downloaded WebLLM models
• All session history and transcription data

This action cannot be undone.`,
      confirmText: "Clear All Data",
      cancelText: "Cancel",
    })

    if (confirmed) {
      onClearAllCache()
    }
  }
  // Calculate total storage including Whisper models, WebLLM models, Sherpa models, and session history
  const whisperModelsSize = storageInfo.whisperModels.reduce(
    (total, model) => total + model.size,
    0
  )
  const webllmModelsSize = storageInfo.webllmModels.reduce(
    (total, model) => total + model.size * 1024 * 1024, // Convert MB to bytes
    0
  )

  // Calculate Sherpa models size more accurately:
  // - Only count the shared .data file once
  // - Count individual JS/WASM files for each model
  const sherpaDataFile = storageInfo.sherpaModels.find(
    (model) =>
      model.url.includes("sherpa-onnx-shared") && model.url.includes(".data")
  )
  const sherpaOtherFiles = storageInfo.sherpaModels.filter(
    (model) =>
      !(model.url.includes("sherpa-onnx-shared") && model.url.includes(".data"))
  )

  const sherpaDataSize = sherpaDataFile ? sherpaDataFile.size : 0
  const sherpaOtherFilesSize = sherpaOtherFiles.reduce(
    (total, model) => total + model.size,
    0
  )
  const sherpaModelsSize = sherpaDataSize + sherpaOtherFilesSize

  // Combine whisper and sherpa models for display
  const totalTranscriptionModelsSize = whisperModelsSize + sherpaModelsSize
  const transcriptionModelsCount =
    storageInfo.whisperModels.length + storageInfo.sherpaModels.length

  const totalModelsSize =
    whisperModelsSize +
    webllmModelsSize +
    sherpaModelsSize +
    storageInfo.sessionHistorySize
  const totalUsage = totalModelsSize

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <HardDrive className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Storage</div>
              <div className="text-muted-foreground text-sm">Storage usage</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="my-8 w-[90vw] max-w-2xl px-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Storage</DialogTitle>
          <DialogDescription>Manage storage usage</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Storage Used</p>
                  <Skeleton className="mt-1 h-5 w-16" />
                </div>
                <div>
                  <p className="text-muted-foreground">Storage Available</p>
                  <Skeleton className="mt-1 h-5 w-20" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>

              <Skeleton className="mt-2 h-8 w-32" />
            </>
          ) : (
            // Actual content
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Storage Used</p>
                  <p className="font-medium">
                    {formatFileSizeFromBytes(totalUsage)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Storage Available</p>
                  <p className="font-medium">
                    {formatStorageQuota(storageInfo.quota)}
                  </p>
                </div>
              </div>

              {transcriptionModelsCount > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Transcription Models:</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Models for speech recognition
                    </span>
                    <span className="text-muted-foreground">
                      {formatFileSizeFromBytes(totalTranscriptionModelsSize)}
                    </span>
                  </div>
                </div>
              )}

              {storageInfo.webllmModels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Large Language Models:</p>
                  {storageInfo.webllmModels.map((model) => (
                    <div
                      key={model.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate">
                        {model.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatFileSize(model.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {storageInfo.sessionHistorySize > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Session History:</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Transcriptions & AI responses
                    </span>
                    <span className="text-muted-foreground">
                      {formatFileSizeFromBytes(storageInfo.sessionHistorySize)}
                    </span>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllData}
                className="mt-2"
                disabled={isLoading}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Clear All Data
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

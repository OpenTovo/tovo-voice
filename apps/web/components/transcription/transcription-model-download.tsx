"use client"

import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useAtom, useSetAtom } from "jotai"
import { CheckCircle, Download, Trash2, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "@workspace/ui/components/sonner"
import { useUnifiedTranscription } from "@/hooks/use-unified-transcription"
import { defaultTranscriptionModelAtom } from "@/lib/atoms"
import { transcriptionDownloadProgressAtom } from "@/lib/atoms/settings"
import { showConfirmDialogAtom } from "@/lib/atoms/dialog"
import { storageQuotaManager } from "@/lib/storage/storage-quota-manager"
import { TranscriptionEngine } from "@/lib/transcription/constants"
import {
  deleteModelFiles,
  downloadModelFiles,
  hasSherpaModelFiles,
} from "@/lib/transcription/sherpa/sherpa-cache"
import {
  getModelsForEngine,
  type UnifiedModelConfig,
} from "@/lib/transcription/unified-models"

interface TranscriptionModelDownloadProps {
  onModelReady?: () => Promise<void> | void
}

export function TranscriptionModelDownload({
  onModelReady,
}: TranscriptionModelDownloadProps = {}) {
  const [availableModels, setAvailableModels] = useState<UnifiedModelConfig[]>(
    []
  )
  const [asrDownload, setAsrDownload] = useAtom(transcriptionDownloadProgressAtom)
  const [downloadedModels, setDownloadedModels] = useState<Set<string>>(
    new Set()
  )
  const [deletingModels, setDeletingModels] = useState<Set<string>>(new Set())
  const [isInitializing, setIsInitializing] = useState(true)

  const { isLoading } = useUnifiedTranscription()
  const [defaultTranscriptionModel, setDefaultTranscriptionModel] = useAtom(
    defaultTranscriptionModelAtom
  )
  const showConfirmDialog = useSetAtom(showConfirmDialogAtom)

  // Function to check if models are available
  const checkAvailableModels = useCallback(
    async (models: UnifiedModelConfig[]) => {
      const available = new Set<string>()

      for (const model of models) {
        try {
          if (await hasSherpaModelFiles(model.id)) {
            available.add(model.id)
          }
        } catch {
          // Model not available
        }
      }

      setDownloadedModels(available)
    },
    []
  )

  useEffect(() => {
    const initializeModels = async () => {
      setIsInitializing(true)

      const recommendedModels = getModelsForEngine(TranscriptionEngine.SHERPA)

      setAvailableModels(recommendedModels)

      await checkAvailableModels(recommendedModels)

      setIsInitializing(false)
    }

    initializeModels()
  }, [checkAvailableModels])

  const downloadModel = async (model: UnifiedModelConfig) => {
    // Don't download if already downloaded
    if (downloadedModels.has(model.id)) {
      return
    }

    // Prevent multiple simultaneous downloads
    if (asrDownload.isDownloading) {
      return
    }

    // Check storage quota beforehand and show simple warning if needed
    const browserInfo = storageQuotaManager.getIndexedDBStorageLimit()
    const quotaInfo = await storageQuotaManager.getQuotaInfo()

    // Estimate the complete model package size for this model.
    const estimatedSize = model.size * 1024 * 1024

    // Check if we have enough space
    const hasSpace = await storageQuotaManager.hasSpaceForFile(estimatedSize)
    if (!hasSpace) {
      const sizeInMB = Math.round(estimatedSize / 1024 / 1024)
      const confirmed = await showConfirmDialog({
        title: "Not Enough Storage Space",
        message: `Your device doesn't have enough storage space for this download.

Required: ~${sizeInMB}MB
Available: ~${Math.round(quotaInfo.available / 1024 / 1024)}MB

Try downloading a smaller model or free up some space on your device.`,
        confirmText: "Try Anyway",
        cancelText: "Cancel",
      })

      if (!confirmed) return
    }

    // Simple confirmation dialog
    const sizeInMB = Math.round(estimatedSize / 1024 / 1024)
    let confirmMessage = `Download "${model.name}"?

Size: ~${sizeInMB}MB
Languages: ${model.languages.join(", ").toUpperCase()}

This will be stored on your device for offline use.`

    // Only show storage notice for Safari if there might be issues
    if (browserInfo.browser === "Safari" && estimatedSize > 50 * 1024 * 1024) {
      confirmMessage += `\n\nNote: Large downloads may take longer on Safari.`
    }

    // Show confirmation dialog
    const confirmed = await showConfirmDialog({
      title: "Download Model",
      message: confirmMessage,
      confirmText: "Download",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    // Request persistent storage before starting download
    if (!quotaInfo.isPersistent && quotaInfo.canRequestPersistent) {
      await storageQuotaManager.requestPersistentStorage()
    }

    setAsrDownload({
      modelName: model.id,
      progress: 0,
      isDownloading: true,
    })

    try {
      await downloadModelFiles(model.id, (progress) => {
        setAsrDownload({
          modelName: model.id,
          progress,
          isDownloading: true,
        })
      })

      // Set as default model if this is the first downloaded model
      if (!defaultTranscriptionModel) {
        setDefaultTranscriptionModel(model.id)
      }

      // Re-check availability after successful download
      await checkAvailableModels(availableModels)

      // Call the callback if provided
      if (onModelReady) {
        await onModelReady()
      }
    } catch (error) {
      console.error(`Failed to download ${model.id}:`, error)
      toast.error(`Failed to download "${model.name}". Please try again.`)
    } finally {
      setAsrDownload({
        modelName: null,
        progress: 0,
        isDownloading: false,
      })
    }
  }

  const deleteModel = async (model: UnifiedModelConfig) => {
    // Don't delete if currently downloading
    if (asrDownload.isDownloading || deletingModels.has(model.id)) {
      return
    }

    // Show confirmation dialog
    const confirmed = await showConfirmDialog({
      title: "Delete Transcription Model",
      message: `Are you sure you want to delete "${model.name}"?

This will permanently remove the model from your device. You can download it again later if needed.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    // If this is the default model, clear it
    if (defaultTranscriptionModel === model.id) {
      setDefaultTranscriptionModel(null)
    }

    setDeletingModels((prev) => new Set([...prev, model.id]))

    try {
      await deleteModelFiles(model.id)

      // Update downloaded models state
      setDownloadedModels((prev) => {
        const newSet = new Set(prev)
        newSet.delete(model.id)
        return newSet
      })

      // Re-check availability after deletion
      await checkAvailableModels(availableModels)

      // Call the callback if provided to refresh parent state
      if (onModelReady) {
        await onModelReady()
      }
    } catch (error) {
      console.error(`Failed to delete ${model.id}:`, error)
      toast.error(`Failed to delete "${model.name}". Please try again.`)
    } finally {
      setDeletingModels((prev) => {
        const newSet = new Set(prev)
        newSet.delete(model.id)
        return newSet
      })
    }
  }

  const ModelCard = ({ model }: { model: UnifiedModelConfig }) => {
    const isDownloading = asrDownload.isDownloading && asrDownload.modelName === model.id
    const isDownloaded = downloadedModels.has(model.id)
    const isDeleting = deletingModels.has(model.id)
    const progress = asrDownload.isDownloading && asrDownload.modelName === model.id
      ? asrDownload.progress
      : 0

    const displayName = model.name.replace(/^Sherpa[\s-]*/, "")

    return (
      <div className="flex items-center justify-between rounded-lg border p-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-brand" />
              <span className="text-sm font-medium">{displayName}</span>
            </div>
            {isDownloaded && !isDeleting && (
              <CheckCircle className="h-4 w-4 text-status-success" />
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            {model.size}MB • {model.languages.join(", ").toUpperCase()}
          </div>
          {isDownloading && (
            <div className="mt-1 space-y-1">
              <Progress value={progress} className="h-1 w-[95%]" />
              <div className="text-muted-foreground text-xs">
                Downloading... {progress}%
              </div>
            </div>
          )}
          {isDeleting && (
            <div className="text-muted-foreground mt-1 text-xs">
              Deleting...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDownloaded ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteModel(model)}
              disabled={isLoading || isDownloading || isDeleting}
              title="Delete model"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => downloadModel(model)}
              disabled={isLoading || isDownloading || isDeleting}
              title="Download model"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {isInitializing
          ? // Loading skeleton
            ["bilingual"].map((modelId) => (
              <div
                key={modelId}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))
          : availableModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
      </div>
    </div>
  )
}

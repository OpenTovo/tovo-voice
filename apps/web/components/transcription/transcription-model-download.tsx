"use client"

import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useAtom, useSetAtom } from "jotai"
import { CheckCircle, Download, Trash2, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useUnifiedTranscription } from "@/hooks/use-unified-transcription"
import { defaultTranscriptionModelAtom } from "@/lib/atoms"
import { showConfirmDialogAtom } from "@/lib/atoms/dialog"
import { storageQuotaManager } from "@/lib/storage/storage-quota-manager"
import { tovoDB } from "@/lib/tovo-idb"
import { TranscriptionEngine } from "@/lib/transcription/constants"
import {
  deleteModelFiles,
  downloadModelFiles,
  hasCachedFile,
  hasSharedSherpaDataFile,
} from "@/lib/transcription/sherpa/sherpa-cache"
import { getModelShortName } from "@/lib/transcription/sherpa/sherpa-model"
import {
  getModelsForEngine,
  type UnifiedModelConfig,
} from "@/lib/transcription/unified-models"
import { loadRemoteModel } from "@/lib/transcription/whisper/wasm-helpers"
import { getDeviceInfo } from "@/lib/utils/browser-utils"

interface TranscriptionModelDownloadProps {
  onModelReady?: () => Promise<void> | void
}

export function TranscriptionModelDownload({
  onModelReady,
}: TranscriptionModelDownloadProps = {}) {
  const [availableModels, setAvailableModels] = useState<UnifiedModelConfig[]>(
    []
  )
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(
    new Set()
  )
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({})
  const [downloadedModels, setDownloadedModels] = useState<Set<string>>(
    new Set()
  )
  const [deletingModels, setDeletingModels] = useState<Set<string>>(new Set())
  const [hasLocalSharedDataFile, setHasLocalSharedDataFile] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const { isLoading } = useUnifiedTranscription()
  const [defaultTranscriptionModel, setDefaultTranscriptionModel] = useAtom(
    defaultTranscriptionModelAtom
  )
  const showConfirmDialog = useSetAtom(showConfirmDialogAtom)

  // Check if shared data file is available
  useEffect(() => {
    const checkSharedData = async () => {
      const hasData = await hasSharedSherpaDataFile()
      setHasLocalSharedDataFile(hasData)
    }
    checkSharedData()
  }, [downloadedModels]) // Re-check when models change

  // Function to check if models are available
  const checkAvailableModels = useCallback(
    async (models: UnifiedModelConfig[], forceRefreshSharedData = false) => {
      const available = new Set<string>()

      // Check if shared Sherpa data file is cached in IndexedDB
      let currentHasLocalSharedDataFile = hasLocalSharedDataFile
      if (forceRefreshSharedData) {
        currentHasLocalSharedDataFile = await hasSharedSherpaDataFile()
        setHasLocalSharedDataFile(currentHasLocalSharedDataFile)
      }

      for (const model of models) {
        if (model.engine === TranscriptionEngine.SHERPA) {
          try {
            const shortName = getModelShortName(model.id)

            // For proper cache detection, we should only check IndexedDB, not public files
            // Check if model-specific files are cached in IndexedDB

            const baseUrl =
              process.env.NEXT_PUBLIC_R2_BASE_URL || "https://r2.tovo.dev"
            const wasmCached = await hasCachedFile(
              `${baseUrl}/sherpa-onnx-${shortName}/sherpa-onnx-wasm-main-asr.wasm`
            )
            const jsApiCached = await hasCachedFile(
              `${baseUrl}/sherpa-onnx-${shortName}/sherpa-onnx-asr.js`
            )
            const jsLoaderCached = await hasCachedFile(
              `${baseUrl}/sherpa-onnx-${shortName}/sherpa-onnx-wasm-main-asr.js`
            )

            // Model is available if:
            // 1. WASM file, both JS files are cached in IndexedDB
            // 2. Shared data file is cached in IndexedDB
            if (
              wasmCached &&
              jsApiCached &&
              jsLoaderCached &&
              currentHasLocalSharedDataFile
            ) {
              available.add(model.id)
            }
          } catch {
            // Model not available
          }
        } else if (model.engine === TranscriptionEngine.WHISPER) {
          try {
            // Check if Whisper model is cached
            if (model.whisperConfig?.url) {
              const isCached = await tovoDB.hasModel(model.whisperConfig.url)
              if (isCached) {
                available.add(model.id)
              }
            }
          } catch {
            // Model not available
          }
        }
      }

      setDownloadedModels(available)
    },
    [hasLocalSharedDataFile]
  )

  // Re-check all models when shared data changes
  useEffect(() => {
    if (hasLocalSharedDataFile && availableModels.length > 0) {
      checkAvailableModels(availableModels)
    }
  }, [hasLocalSharedDataFile, availableModels, checkAvailableModels])

  useEffect(() => {
    const initializeModels = async () => {
      setIsInitializing(true)

      const deviceInfo = getDeviceInfo()
      const isIOS = deviceInfo.isIOS

      let recommendedModels: UnifiedModelConfig[] = []

      if (isIOS) {
        // NOTE: maybe in future, for iOS devices, show whisper models only, since sherpa load fail
        // NOTE: but now whisper models also fail to load on iOS... I am so tired of debuging this shit
        // const whisperModels = getModelsForEngine(TranscriptionEngine.WHISPER)
        const sherpaModels = getModelsForEngine(TranscriptionEngine.SHERPA)
        recommendedModels = [...sherpaModels]
      } else {
        const sherpaModels = getModelsForEngine(TranscriptionEngine.SHERPA)
        recommendedModels = [...sherpaModels]
      }

      setAvailableModels(recommendedModels)

      // Check which models are already available - force refresh shared data on init
      await checkAvailableModels(recommendedModels, true) // Always force refresh on initialization

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
    if (
      downloadingModels.has(model.id) ||
      isLoading ||
      downloadingModels.size > 0
    ) {
      return
    }

    // Check storage quota beforehand and show simple warning if needed
    const browserInfo = storageQuotaManager.getIndexedDBStorageLimit()
    const quotaInfo = await storageQuotaManager.getQuotaInfo()

    // Estimate file size for Sherpa model
    const estimatedSize = hasLocalSharedDataFile
      ? 12 * 1024 * 1024
      : 350 * 1024 * 1024 // Sherpa: 12MB if shared data exists locally, 350MB otherwise

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

    setDownloadingModels((prev) => new Set([...prev, model.id]))
    setDownloadProgress((prev) => ({ ...prev, [model.id]: 0 }))

    try {
      if (model.engine === TranscriptionEngine.SHERPA) {
        // Download Sherpa model files
        await downloadModelFiles(model.id, (progress) => {
          setDownloadProgress((prev) => ({ ...prev, [model.id]: progress }))
        })

        // Force refresh of shared data state
        const hasSharedDataAfterDownload = await hasSharedSherpaDataFile()
        setHasLocalSharedDataFile(hasSharedDataAfterDownload)
      } else if (model.engine === TranscriptionEngine.WHISPER) {
        // Download Whisper model
        if (!model.whisperConfig) {
          throw new Error("Missing Whisper model configuration")
        }

        await loadRemoteModel(
          model.whisperConfig.url,
          `whisper-${model.id}.bin`,
          model.size,
          (progress) => {
            // Convert progress to percentage
            const percentage = Math.round(progress * 100)
            setDownloadProgress((prev) => ({ ...prev, [model.id]: percentage }))
          },
          () => {
            // onReady - model loaded successfully
            console.log(`Whisper model ${model.id} loaded successfully`)
          },
          () => {
            // onCancel
            throw new Error("Download cancelled")
          },
          (message) => {
            // onPrint
            console.log(`Whisper download: ${message}`)
          }
        )
      } else {
        throw new Error(`Unsupported engine: ${model.engine}`)
      }

      // Set as default model if this is the first downloaded model
      if (!defaultTranscriptionModel) {
        setDefaultTranscriptionModel(model.id)
      }

      // Re-check availability after successful download
      await checkAvailableModels(availableModels, true) // Force refresh shared data

      // Call the callback if provided
      if (onModelReady) {
        await onModelReady()
      }
    } catch (error) {
      console.error(`Failed to download ${model.id}:`, error)
      // Show error state - could add toast notification here
    } finally {
      setDownloadingModels((prev) => {
        const newSet = new Set(prev)
        newSet.delete(model.id)
        return newSet
      })
      setDownloadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[model.id]
        return newProgress
      })
    }
  }

  const deleteModel = async (model: UnifiedModelConfig) => {
    // Don't delete if currently downloading
    if (downloadingModels.has(model.id) || deletingModels.has(model.id)) {
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
      if (model.engine === TranscriptionEngine.SHERPA && model.sherpaConfig) {
        // Delete all files for this Sherpa model using modelId
        await deleteModelFiles(model.id)

        // Force refresh of shared data state
        const hasSharedDataAfterDelete = await hasSharedSherpaDataFile()
        setHasLocalSharedDataFile(hasSharedDataAfterDelete)
      } else if (
        model.engine === TranscriptionEngine.WHISPER &&
        model.whisperConfig
      ) {
        // Delete Whisper model from cache
        await tovoDB.deleteModel(model.whisperConfig.url)
      }

      // Update downloaded models state
      setDownloadedModels((prev) => {
        const newSet = new Set(prev)
        newSet.delete(model.id)
        return newSet
      })

      // Re-check availability after deletion
      await checkAvailableModels(availableModels, true) // Force refresh shared data

      // Call the callback if provided to refresh parent state
      if (onModelReady) {
        await onModelReady()
      }
    } catch (error) {
      console.error(`Failed to delete ${model.id}:`, error)
      // Show error state - could add toast notification here
    } finally {
      setDeletingModels((prev) => {
        const newSet = new Set(prev)
        newSet.delete(model.id)
        return newSet
      })
    }
  }

  const ModelCard = ({ model }: { model: UnifiedModelConfig }) => {
    const isDownloading = downloadingModels.has(model.id)
    const isDownloaded = downloadedModels.has(model.id)
    const isDeleting = deletingModels.has(model.id)
    const progress = downloadProgress[model.id] || 0

    // Sherpa models should work on all platforms now that Whisper is disabled
    const isDisabled = false

    // Remove "Sherpa" from display name
    const displayName = model.name.replace(/^Sherpa[\s-]*/, "")

    // Calculate consistent download size (excluding the shared .data file)
    const getEffectiveSize = () => {
      if (model.engine === TranscriptionEngine.SHERPA) {
        // Show 12MB if shared data exists locally, 350MB otherwise
        return hasLocalSharedDataFile ? "12" : "350"
      }
      return model.size.toString()
    }

    return (
      <div
        className={`flex items-center justify-between rounded-lg border p-2 ${isDisabled ? "opacity-60" : ""}`}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-medium">{displayName}</span>
            </div>
            {isDownloaded && !isDeleting && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>
          <div
            className={`text-xs ${isDisabled ? "text-red-500" : "text-muted-foreground"}`}
          >
            {getEffectiveSize()}MB • {model.languages.join(", ").toUpperCase()}
            {isDisabled && (
              <span className="ml-2 font-medium">• Not available on iOS</span>
            )}
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
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteModel(model)}
                disabled={
                  isLoading || isDownloading || isDeleting || isDisabled
                }
                title={isDisabled ? "Not available on iOS" : "Delete model"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => downloadModel(model)}
              disabled={isLoading || isDownloading || isDeleting || isDisabled}
              title={isDisabled ? "Not available on iOS" : "Download model"}
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
        {isInitializing ? (
          // Loading skeleton
          <>
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
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
            ))}
          </>
        ) : (
          availableModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))
        )}
      </div>
    </div>
  )
}

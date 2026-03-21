"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useAtom, useSetAtom } from "jotai"
import {
  AlertCircle,
  CheckCircle,
  Download,
  Info,
  Settings,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { WebGPUSetupDialog } from "@/components/dialogs/webgpu-setup"
import {
  defaultAnalysisModelAtom,
  SessionStatus,
  sessionStatusAtom,
} from "@/lib/atoms"
import { showConfirmDialogAtom } from "@/lib/atoms/dialog"
import { webllmDownloadProgressAtom } from "@/lib/atoms/settings"
import {
  detectWebGPU,
  downloadWebLLMModel,
  getAvailableWebLLMModels,
  getCachedWebLLMModels,
  type WebLLMModelInfo,
} from "@/lib/llm"
import type { WebLLMModelName } from "@/lib/llm/models"
import { storageQuotaManager } from "@/lib/storage/storage-quota-manager"
import { formatFileSize, TovoHaptics } from "@/lib/utils"

interface WebLLMModelsDownloadProps {
  onModelReady?: (modelName: WebLLMModelName) => void
  canDeleteModel?: (modelName: string) => boolean
  onDeleteModel?: (modelName: WebLLMModelName) => Promise<void>
}

export function WebLLMModelsDownload({
  onModelReady,
  canDeleteModel,
  onDeleteModel,
}: WebLLMModelsDownloadProps) {
  const [defaultAnalysisModel, setDefaultAnalysisModel] = useAtom(
    defaultAnalysisModelAtom
  )
  const [sessionStatus] = useAtom(sessionStatusAtom)
  const [globalDownloadProgress, setGlobalDownloadProgress] = useAtom(
    webllmDownloadProgressAtom
  )
  const showConfirmDialog = useSetAtom(showConfirmDialogAtom)
  const [webgpuInfo, setWebgpuInfo] = useState<any>(null)
  const [showWebGPUDialog, setShowWebGPUDialog] = useState(false)
  const [availableModels, setAvailableModels] = useState<WebLLMModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use global download progress for persistence across dialog open/close
  const downloadProgress = globalDownloadProgress.progress
  const isDownloading = globalDownloadProgress.isDownloading
  const loadingStatus = globalDownloadProgress.status

  // Check WebGPU availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoading(true)
      try {
        const webgpuResult = await detectWebGPU()
        setWebgpuInfo(webgpuResult)

        // Load cached models
        await loadCachedModels()
      } catch (error) {
        console.error("Error checking WebGPU or loading models:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAvailability()
  }, [])

  const loadCachedModels = async () => {
    try {
      const models = await getAvailableWebLLMModels()
      setAvailableModels(models)
    } catch {
      setAvailableModels([])
    }
  }

  const handleDownloadModel = async (modelName: WebLLMModelName) => {
    if (!webgpuInfo?.isEnabled) {
      TovoHaptics.error() // Error haptic for WebGPU not available
      setShowWebGPUDialog(true)
      return
    }

    // Find the model info and check storage limits
    const model = availableModels.find((m) => m.id === modelName)
    if (!model) return

    // Check device capability (both storage and memory limits)
    const deviceCheck = storageQuotaManager.canStorageAccommodateModel(
      model.vramRequired * 1024 * 1024
    ) // Convert MB to bytes

    if (!deviceCheck.canStore) {
      // Show device capability error dialog
      TovoHaptics.error()
      await showConfirmDialog({
        title: "Model Not Compatible",
        message:
          deviceCheck.reason ||
          `This model (${formatFileSize(model.vramRequired)}) is not compatible with your device.

Please choose a smaller model that fits within your device's capabilities.`,
        confirmText: "OK",
        cancelText: "", // Empty string to hide cancel button
      })
      return
    }

    // Button press haptic feedback
    TovoHaptics.light()

    // Build confirmation message with device warnings if needed
    let confirmationMessage = `You are about to download "${model.name}".

Size: ${formatFileSize(model.vramRequired)}
Description: ${model.description}

This model will be cached locally for offline use. Download may take several minutes depending on your connection.`

    // Add any warnings from the device check
    if (deviceCheck.reason) {
      confirmationMessage += `\n\n⚠️ ${deviceCheck.reason}`
    }

    const confirmed = await showConfirmDialog({
      title: "Download AI Model",
      message: confirmationMessage,
      confirmText: "Start Download",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    // Start download haptic feedback
    TovoHaptics.medium()
    await handleConfirmDownload(model)
  }

  const handleConfirmDownload = async (model: WebLLMModelInfo) => {
    const modelName = model.id as WebLLMModelName
    setGlobalDownloadProgress({
      modelName,
      progress: 0,
      isDownloading: true,
      status: "Initializing download...",
    })

    try {
      // Check if this is the first model download in session
      const cachedModels = await getCachedWebLLMModels()
      const isFirstModel = cachedModels.length === 0

      await downloadWebLLMModel(
        modelName,
        (progress) => {
          setGlobalDownloadProgress({
            modelName,
            progress: progress.progress,
            isDownloading: true,
            status: progress.text,
          })
        },
        async () => {
          setGlobalDownloadProgress({
            modelName,
            progress: 100,
            isDownloading: true,
            status: "Download complete!",
          })

          // If this is the first model downloaded, set it as default
          if (isFirstModel || !defaultAnalysisModel) {
            setDefaultAnalysisModel(modelName)
          }

          // Reload available models to update cache status
          await loadCachedModels()
        },
        (error) => {
          setGlobalDownloadProgress({
            modelName,
            progress: 0,
            isDownloading: true,
            status: `Download failed: ${error.message}`,
          })
        }
      )

      // Success haptic feedback when download completes
      TovoHaptics.success() // Reuse success pattern

      if (onModelReady) {
        onModelReady(modelName)
      }
    } catch {
      setGlobalDownloadProgress({
        modelName,
        progress: 0,
        isDownloading: true,
        status: "Download failed",
      })

      // Error haptic feedback
      TovoHaptics.error()
    } finally {
      // Clear download state after a delay
      setTimeout(() => {
        setGlobalDownloadProgress({
          modelName: null,
          progress: 0,
          isDownloading: false,
          status: "",
        })
      }, 3000)
    }
  }

  const handleDeleteModel = async (modelName: WebLLMModelName) => {
    // Check if deletion is allowed
    const canDelete = canDeleteModel ? canDeleteModel(modelName) : true
    if (!canDelete) {
      TovoHaptics.error() // Error haptic for not allowed
      return // Don't attempt deletion if not allowed
    }

    // Button press haptic feedback
    TovoHaptics.light()

    // Find the model info and show confirmation dialog
    const model = availableModels.find((m) => m.id === modelName)
    if (!model) return

    const confirmed = await showConfirmDialog({
      title: "Delete AI Model",
      message: `Are you sure you want to delete "${model.name}"?

This will permanently remove the model from your device. You can download it again later if needed.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    // Delete action haptic feedback
    TovoHaptics.error() // Reuse destructive action pattern

    try {
      if (onDeleteModel) {
        // Use parent's delete handler
        await onDeleteModel(modelName)
      } else {
        return
      }

      // Add a small delay to ensure operations complete
      await new Promise((resolve) => setTimeout(resolve, 100))
      // Reload available models to update cache status
      await loadCachedModels()

      // Notify parent component about the change
      if (onModelReady) {
        onModelReady(modelName)
      }
    } catch {
      // Silently handle error, user will notice model still exists
    }
  }

  // Show loading skeleton while checking WebGPU and loading models
  if (isLoading) {
    return (
      <div className="flex h-full flex-col space-y-4">
        <div className="flex-1 space-y-2 overflow-y-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-2"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show WebGPU not available message
  if (webgpuInfo && !webgpuInfo.isEnabled) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WebGPU is required for local AI processing but is not available in
            your browser.
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => setShowWebGPUDialog(true)}
          className="w-full"
          variant="outline"
        >
          <Settings className="mr-2 h-4 w-4" />
          How to Enable WebGPU
        </Button>

        <WebGPUSetupDialog
          open={showWebGPUDialog}
          onOpenChange={setShowWebGPUDialog}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {isDownloading && (
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{loadingStatus}</span>
            <span>{downloadProgress}%</span>
          </div>
          <Progress value={downloadProgress} className="h-2" />
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {availableModels.map((model) => {
          const isDownloaded = model.isDownloaded || false
          const isDefault = defaultAnalysisModel === model.id
          const canDelete = canDeleteModel ? canDeleteModel(model.id) : true

          // Check device capability for this model
          const modelSizeBytes = model.vramRequired * 1024 * 1024 // Convert MB to bytes
          const deviceCheck =
            storageQuotaManager.canStorageAccommodateModel(modelSizeBytes)
          const canHandleModel = deviceCheck.canStore
          const deviceWarning = deviceCheck.reason

          const handleDeviceInfoClick = async () => {
            if (!canHandleModel) {
              await showConfirmDialog({
                title: "Device Compatibility",
                message:
                  deviceWarning ||
                  `This model is not compatible with your device.

Model size: ${formatFileSize(model.vramRequired)}

Please choose a smaller model that fits within your device's capabilities.`,
                confirmText: "OK",
                cancelText: "",
              })
            } else if (deviceWarning) {
              await showConfirmDialog({
                title: "Device Information",
                message: deviceWarning,
                confirmText: "OK",
                cancelText: "",
              })
            }
          }

          return (
            <div
              key={model.id}
              className="flex items-center justify-between rounded-lg border p-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{model.name}</span>
                  {isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                  {isDownloaded && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {/* Device compatibility warning/info icon - only show for non-downloaded models */}
                  {!isDownloaded && (deviceWarning || !canHandleModel) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={handleDeviceInfoClick}
                      title={
                        !canHandleModel
                          ? "This model is not compatible with your device"
                          : "Device compatibility information"
                      }
                    >
                      <Info
                        className={`h-3 w-3 ${
                          !canHandleModel ? "text-red-500" : "text-yellow-500"
                        }`}
                      />
                    </Button>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatFileSize(model.vramRequired)} • {model.description}
                  {!isDownloaded && !canHandleModel && (
                    <span className="ml-1 text-red-500">
                      • {deviceWarning || "Insufficient storage or memory"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isDownloaded ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDeleteModel(model.id as WebLLMModelName)
                    }
                    disabled={
                      !canDelete ||
                      (isDefault && sessionStatus !== SessionStatus.Idle)
                    }
                    title={
                      !canDelete
                        ? "Cannot delete default model when other models are available"
                        : isDefault && sessionStatus !== SessionStatus.Idle
                          ? "Cannot delete active model during session"
                          : "Delete model"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleDownloadModel(model.id as WebLLMModelName)
                    }
                    disabled={
                      isDownloading || !canHandleModel // Disable if downloading or device can't handle model
                    }
                    title={
                      !canHandleModel
                        ? "Model not compatible with this device"
                        : isDownloading
                          ? "Download in progress"
                          : "Download model"
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <WebGPUSetupDialog
        open={showWebGPUDialog}
        onOpenChange={setShowWebGPUDialog}
      />
    </div>
  )
}

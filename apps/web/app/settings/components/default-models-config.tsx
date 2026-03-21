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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ChevronRight, Settings } from "lucide-react"
import { WEBLLM_MODELS, type WebLLMModelName } from "@/lib/llm"
import { TranscriptionEngine } from "@/lib/transcription/constants"
import { getModelsForEngine } from "@/lib/transcription/unified-models"
import { formatFileSize } from "@/lib/utils"

interface DefaultModelsConfigProps {
  defaultTranscriptionModel: string | null
  defaultAnalysisModel: WebLLMModelName | null
  cachedWhisperModels: string[]
  cachedSherpaModels: string[]
  cachedWebLLMModels: string[]
  onSetDefaultTranscriptionModel: (modelId: string) => void
  onSetDefaultAnalysisModel: (modelName: string) => void
}

export function DefaultModelsConfig({
  defaultTranscriptionModel,
  defaultAnalysisModel,
  cachedWhisperModels,
  cachedSherpaModels,
  cachedWebLLMModels,
  onSetDefaultTranscriptionModel,
  onSetDefaultAnalysisModel,
}: DefaultModelsConfigProps) {
  const totalCachedTranscriptionModels =
    cachedWhisperModels.length + cachedSherpaModels.length
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Settings className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Default Models</div>
              <div className="text-muted-foreground text-sm">
                Configure default models
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="my-8 w-[90vw] max-w-2xl px-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Default Models</DialogTitle>
          <DialogDescription>Configure default models</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Default Transcription Model
            </label>
            <Select
              value={defaultTranscriptionModel || undefined}
              onValueChange={onSetDefaultTranscriptionModel}
              disabled={totalCachedTranscriptionModels === 0}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    totalCachedTranscriptionModels === 0
                      ? "No models downloaded"
                      : "Select a model"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {/* Whisper models */}
                {getModelsForEngine(TranscriptionEngine.WHISPER)
                  .filter((model) => cachedWhisperModels.includes(model.id))
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName} ({formatFileSize(model.size)})
                    </SelectItem>
                  ))}

                {/* Sherpa models */}
                {getModelsForEngine(TranscriptionEngine.SHERPA)
                  .filter((model) => cachedSherpaModels.includes(model.id))
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName} ({formatFileSize(model.size)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Default Large Language Model
            </label>
            <Select
              value={defaultAnalysisModel || undefined}
              onValueChange={onSetDefaultAnalysisModel}
              disabled={cachedWebLLMModels.length === 0}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    cachedWebLLMModels.length === 0
                      ? "No models downloaded"
                      : "Select a model"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WEBLLM_MODELS)
                  .filter(([key]) => cachedWebLLMModels.includes(key))
                  .map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.name} (
                      {formatFileSize(config.config?.vram_required_MB || 0)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              {cachedWebLLMModels.length === 0
                ? "Download models to set defaults."
                : "Only downloaded models will appear here."}{" "}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

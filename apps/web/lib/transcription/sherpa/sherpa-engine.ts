/**
 * Sherpa-ONNX Transcription Engine Implementation
 *
 * Implements the unified transcription interface for Sherpa-ONNX WASM.
 *
 * Architecture: the WASM recognizer runs in a dedicated Web Worker
 * (sherpa-worker.ts) so the heavy ONNX inference never blocks the main
 * thread. This engine owns mic capture (AudioWorklet) on the main thread
 * and streams Float32Array audio chunks to the worker; results flow back
 * as partial/final events.
 */

import { AUDIO_CONFIG, TranscriptionEngine } from "../constants"
import {
  BaseTranscriptionEngine,
  type ITranscriptionEngine,
  type TranscriptionCallbacks,
  type TranscriptionResult,
  TranscriptionStatus,
} from "../transcription-interface"
import {
  getModelById,
  type ModelLoadCallbacks,
  type UnifiedModelId,
} from "../unified-models"
import { hasCachedFile, getCachedFile } from "./sherpa-cache"
import { getSherpaModelAssetUrls } from "./sherpa-assets"
import { SHERPA_MODELS } from "./sherpa-model"

/**
 * Sherpa-ONNX transcription engine
 */
export class SherpaTranscriptionEngine
  extends BaseTranscriptionEngine
  implements ITranscriptionEngine
{
  readonly engineType = TranscriptionEngine.SHERPA
  readonly supportsRealTime = true

  private worker: Worker | null = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private processor: AudioWorkletNode | null = null
  private source: MediaStreamAudioSourceNode | null = null

  // State tracking for real-time transcription
  private currentUtteranceId = 0
  private partialStartTime: number | null = null

  async loadModel(
    modelId: UnifiedModelId,
    callbacks: ModelLoadCallbacks
  ): Promise<void> {
    try {
      this.setStatus(TranscriptionStatus.LOADING_MODEL)
      const modelConfig = getModelById(modelId)

      if (modelConfig.engine !== TranscriptionEngine.SHERPA) {
        throw new Error(
          `Model ${modelId} is not compatible with Sherpa-ONNX engine`
        )
      }

      if (!modelConfig.sherpaConfig) {
        throw new Error(`Model ${modelId} missing Sherpa configuration`)
      }

      const sherpaConfig = modelConfig.sherpaConfig
      const modelFolder = SHERPA_MODELS[sherpaConfig.modelName].folder
      const assets = getSherpaModelAssetUrls(modelFolder)

      // Verify all required files are cached before spawning the worker.
      callbacks.onProgress(5)
      const [dataCached, wasmCached, apiCached, loaderCached] =
        await Promise.all([
          hasCachedFile(assets.data),
          hasCachedFile(assets.wasm),
          hasCachedFile(assets.api),
          hasCachedFile(assets.wasmLoader),
        ])

      if (!dataCached || !wasmCached || !apiCached || !loaderCached) {
        throw new Error(
          "Required model files are not cached. Please download the model first."
        )
      }

      callbacks.onProgress(10)

      // Read all cached files (transferred to the worker).
      const [data, wasm, api, loader] = await Promise.all([
        getCachedFile(assets.data),
        getCachedFile(assets.wasm),
        getCachedFile(assets.api),
        getCachedFile(assets.wasmLoader),
      ])

      if (!data || !wasm || !api || !loader) {
        throw new Error("Failed to read one or more cached model files")
      }

      callbacks.onProgress(20)

      // Spawn the worker and transfer the file buffers.
      this.worker = new Worker(
        new URL("./sherpa-worker.ts", import.meta.url),
        { type: "module" }
      )

      await new Promise<void>((resolve, reject) => {
        const worker = this.worker
        if (!worker) {
          reject(new Error("Worker not initialized"))
          return
        }
        const cleanup = () => {
          worker.removeEventListener("message", onMessage)
          worker.removeEventListener("error", onError)
        }
        const onMessage = (event: MessageEvent) => {
          const msg = event.data
          if (msg?.type === "progress") {
            // Map worker progress (10-100) to (20-100) range
            callbacks.onProgress(
              Math.round(20 + ((msg.progress - 10) / 90) * 80)
            )
          } else if (msg?.type === "ready") {
            cleanup()
            resolve()
          } else if (msg?.type === "error") {
            cleanup()
            reject(new Error(msg.message))
          }
        }
        const onError = (e: ErrorEvent) => {
          cleanup()
          reject(new Error(e.message || "Worker failed to load"))
        }
        worker.addEventListener("message", onMessage)
        worker.addEventListener("error", onError)

        worker.postMessage(
          {
            type: "load",
            data: data,
            wasm: wasm,
            api: api,
            loader: loader,
          },
          [data, wasm, api, loader]
        )
      })

      callbacks.onProgress(100)

      this._currentModel = modelConfig
      this._isInitialized = true
      this.currentUtteranceId = 0
      this.setStatus(TranscriptionStatus.READY)

      callbacks.onComplete()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error("Failed to load Sherpa-ONNX model", {
        error: errorMessage,
        modelId,
      })
      this.setStatus(TranscriptionStatus.ERROR)
      callbacks.onError(errorMessage)
      throw error
    }
  }

  async unloadModel(): Promise<void> {
    try {
      if (this.worker) {
        this.worker.postMessage({ type: "unload" })
        this.worker.terminate()
        this.worker = null
      }

      this._currentModel = null
      this._isInitialized = false
      this.setStatus(TranscriptionStatus.IDLE)

      this.currentUtteranceId = 0
      this.partialStartTime = null

      console.log("Sherpa-ONNX model unloaded")
    } catch (error) {
      console.error("Error unloading Sherpa-ONNX model", { error })
    }
  }

  async startRecording(callbacks: TranscriptionCallbacks): Promise<void> {
    if (!this._isInitialized || !this.worker) {
      throw new Error("Model not loaded")
    }

    if (this._status === TranscriptionStatus.RECORDING) {
      throw new Error("Already recording")
    }

    try {
      this.setStatus(TranscriptionStatus.INITIALIZING)
      this._callbacks = callbacks
      this._recordingStartTime = Date.now()

      this.currentUtteranceId = 0
      this.partialStartTime = null

      // Wire worker results to transcription callbacks / streaming events.
      this.worker.onmessage = (event: MessageEvent) => {
        this.handleWorkerMessage(event.data)
      }

      // Tell the worker to reset its recognizer stream.
      this.worker.postMessage({ type: "start" })

      // Clear any lingering UI state
      this.dispatchStreamingEvent({
        text: "",
        isFinal: true,
        isPartial: false,
        metadata: { utteranceId: this.currentUtteranceId, clear: true },
      })

      // Setup audio context
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      })

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: AUDIO_CONFIG.CHANNELS,
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Create audio source
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream)

      // Try to use AudioWorklet for better performance
      try {
        await this.audioContext.audioWorklet.addModule(
          "/audio-processor/sherpa-audio-processor.js"
        )
        this.processor = new AudioWorkletNode(
          this.audioContext,
          "sherpa-audio-processor"
        )

        // Handle audio data from worklet -> forward to the worker
        this.processor.port.onmessage = (event) => {
          if (
            event.data.type === "audioData" &&
            this._status === TranscriptionStatus.RECORDING &&
            this.worker
          ) {
            const samples = event.data.data as Float32Array
            // Transfer the underlying buffer to avoid a copy.
            const transfer = [samples.buffer]
            this.worker.postMessage(
              {
                type: "audioData",
                samples,
                sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
              },
              transfer
            )
          }
        }

        // Connect audio nodes (no output to speakers)
        this.source.connect(this.processor)
      } catch (workletError) {
        console.warn("AudioWorklet failed, falling back to ScriptProcessor", {
          error: workletError,
        })

        // Fallback to ScriptProcessorNode
        const scriptProcessor = this.audioContext.createScriptProcessor(
          AUDIO_CONFIG.BUFFER_SIZE,
          1,
          1
        )

        scriptProcessor.onaudioprocess = (event) => {
          if (
            this._status !== TranscriptionStatus.RECORDING ||
            !this.worker
          ) {
            return
          }
          const inputData = event.inputBuffer.getChannelData(0)
          const samples = new Float32Array(inputData)
          this.worker.postMessage(
            {
              type: "audioData",
              samples,
              sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
            },
            [samples.buffer]
          )
        }

        this.source.connect(scriptProcessor)
        this.processor = scriptProcessor as any
      }

      this.setStatus(TranscriptionStatus.RECORDING)
      console.log("Sherpa-ONNX recording started")
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error("Failed to start Sherpa-ONNX recording", {
        error: errorMessage,
      })
      this.setStatus(TranscriptionStatus.ERROR)
      this._callbacks?.onError(errorMessage)
      await this.stopRecording()
      throw error
    }
  }

  async stopRecording(): Promise<void> {
    try {
      // Clean up audio processing
      if (this.processor) {
        this.processor.disconnect()
        this.processor = null
      }

      if (this.source) {
        this.source.disconnect()
        this.source = null
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => {
          track.stop()
        })
        this.mediaStream = null
      }

      if (this.audioContext) {
        await this.audioContext.close()
        this.audioContext = null
      }

      // Ask the worker to flush a final result.
      if (this.worker) {
        this.worker.postMessage({ type: "stop" })
      }

      this._recordingStartTime = null
      this._callbacks = null
      this.setStatus(TranscriptionStatus.READY)

      console.log("recording stopped")
    } catch (error) {
      console.error("Error stopping Sherpa-ONNX recording", { error })
      this.setStatus(TranscriptionStatus.ERROR)
    }
  }

  async cleanup(): Promise<void> {
    if (this._status === TranscriptionStatus.RECORDING) {
      await this.stopRecording()
    }
    await this.unloadModel()
    this.resetStats()
  }

  /**
   * Handle results posted from the ASR worker.
   */
  private handleWorkerMessage(msg: any): void {
    if (!msg) return

    switch (msg.type) {
      case "partial":
        if (!this.partialStartTime) this.partialStartTime = Date.now()
        this.sendTranscriptionResult(msg.text, false)
        break

      case "final":
        this.sendTranscriptionResult(msg.text, true, msg.processingTime)
        if (msg.processingTime) this.recordProcessingTime(msg.processingTime)
        break

      case "clear":
        this.partialStartTime = null
        if (typeof msg.utteranceId === "number") {
          this.currentUtteranceId = msg.utteranceId
        }
        this.dispatchStreamingEvent({
          text: "",
          isFinal: true,
          isPartial: false,
          metadata: { utteranceId: this.currentUtteranceId, clear: true },
        })
        this.recordUtterance()
        break

      case "error":
        console.error("Sherpa worker error", msg.message)
        this._callbacks?.onError(msg.message)
        break
    }
  }

  private sendTranscriptionResult(
    text: string,
    isFinal: boolean,
    processingTime?: number
  ): void {
    const result: TranscriptionResult = {
      text,
      timestamp: Date.now(),
      isFinal,
      isPartial: !isFinal,
      metadata: {
        utteranceId: this.currentUtteranceId,
        processingTime,
      },
    }

    if (isFinal) {
      this.recordFinalResult()
    } else {
      this.dispatchStreamingEvent(result)
    }

    this._callbacks?.onTranscription(result)
  }

  private dispatchStreamingEvent(detail: any): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sherpa-streaming-transcription", { detail })
      )
    }
  }
}
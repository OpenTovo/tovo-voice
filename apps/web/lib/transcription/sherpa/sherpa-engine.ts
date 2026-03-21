/**
 * Sherpa-ONNX Transcription Engine Implementation
 *
 * Implements the unified transcription interface for Sherpa-ONNX WASM
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
import { loadSherpaWasm, type SherpaWasmModule } from "./sherpa-loader"
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

  private wasmModule: SherpaWasmModule | null = null
  private recognizer: any = null
  private recognizerStream: any = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private processor: AudioWorkletNode | null = null
  private source: MediaStreamAudioSourceNode | null = null

  // State tracking for real-time transcription
  private lastPartialResult = ""
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

      // Pass progress callback to WASM loader (0-80% for WASM loading)
      const model = getModelById(modelId)
      const sherpaConfig = model.sherpaConfig!
      const modelFolder = SHERPA_MODELS[sherpaConfig.modelName].folder

      this.wasmModule = await loadSherpaWasm(modelFolder, (progress) => {
        // Map WASM loading progress to 0-80% range
        callbacks.onProgress(Math.round(progress * 0.8))
      })

      callbacks.onProgress(80)

      // Verify WASM module is loaded
      if (!this.wasmModule) {
        throw new Error("WASM module is null or undefined")
      }

      callbacks.onProgress(90)

      // Create recognizer using the high-level API (embedded models)
      try {
        this.recognizer =
          this.wasmModule.createOnlineRecognizer?.(this.wasmModule) ||
          (window as any).createOnlineRecognizer?.(this.wasmModule)

        if (!this.recognizer) {
          throw new Error(
            "Failed to create recognizer - both APIs returned null"
          )
        }
      } catch (error) {
        throw new Error(`Recognizer creation failed: ${error}`)
      }

      if (!this.recognizer) {
        throw new Error("Failed to create Sherpa-ONNX recognizer")
      }

      // Create stream
      this.recognizerStream = this.recognizer.createStream()
      if (!this.recognizerStream) {
        throw new Error(
          "Failed to create Sherpa-ONNX stream - returned null/undefined"
        )
      }

      callbacks.onProgress(100)

      this._currentModel = modelConfig
      this._isInitialized = true
      this.currentUtteranceId = 0 // Reset utterance ID when model loads
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
      // Clean up in reverse order of creation
      if (this.recognizerStream) {
        this.recognizerStream = null
      }

      if (this.recognizer) {
        this.recognizer = null
      }

      this.wasmModule = null
      this._currentModel = null
      this._isInitialized = false
      this.setStatus(TranscriptionStatus.IDLE)

      // Reset state
      this.lastPartialResult = ""
      this.currentUtteranceId = 0
      this.partialStartTime = null

      console.log("Sherpa-ONNX model unloaded")
    } catch (error) {
      console.error("Error unloading Sherpa-ONNX model", { error })
    }
  }

  async startRecording(callbacks: TranscriptionCallbacks): Promise<void> {
    if (!this._isInitialized || !this.recognizer || !this.recognizerStream) {
      throw new Error("Model not loaded")
    }

    if (this._status === TranscriptionStatus.RECORDING) {
      throw new Error("Already recording")
    }

    try {
      this.setStatus(TranscriptionStatus.INITIALIZING)
      this._callbacks = callbacks
      this._recordingStartTime = Date.now()

      // Reset recognizer stream and state
      this.recognizer.reset(this.recognizerStream)
      this.currentUtteranceId = 0
      this.lastPartialResult = ""
      this.partialStartTime = null

      // Clear any lingering UI state
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sherpa-streaming-transcription", {
            detail: {
              text: "",
              isFinal: true,
              isPartial: false,
              metadata: { utteranceId: this.currentUtteranceId, clear: true },
            },
          })
        )
      }

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

        // Handle audio data from worklet
        this.processor.port.onmessage = (event) => {
          if (event.data.type === "audioData") {
            this.processAudioData(event.data)
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
          const inputData = event.inputBuffer.getChannelData(0)
          this.processAudioData({
            data: new Float32Array(inputData),
            sampleRate: this.audioContext!.sampleRate,
            timestamp: Date.now(),
            duration: inputData.length / this.audioContext!.sampleRate,
            chunkSize: inputData.length,
          })
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

      // Get final result if available
      if (this.recognizer && this.recognizerStream) {
        try {
          const finalResult = this.recognizer.getResult(this.recognizerStream)
          if (finalResult?.text?.trim()) {
            this.sendTranscriptionResult(finalResult.text.trim(), true)
          }
        } catch (error) {
          console.warn("Error getting final result", { error })
        }
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

  private processAudioData(audioData: any): void {
    if (
      !this.recognizerStream ||
      this._status !== TranscriptionStatus.RECORDING
    ) {
      return
    }

    try {
      // Feed audio to recognizer
      this.recognizerStream.acceptWaveform(
        AUDIO_CONFIG.SAMPLE_RATE,
        audioData.data
      )

      // Process ready frames
      while (this.recognizer.isReady(this.recognizerStream)) {
        this.recognizer.decode(this.recognizerStream)
      }

      // Get partial results
      const result = this.recognizer.getResult(this.recognizerStream)
      const resultText = result?.text?.trim()

      if (resultText && resultText !== this.lastPartialResult) {
        if (!this.partialStartTime) {
          this.partialStartTime = Date.now()
        }
        this.sendTranscriptionResult(resultText, false)
        this.lastPartialResult = resultText
      }

      // Check for endpoint (end of utterance)
      if (this.recognizer.isEndpoint(this.recognizerStream)) {
        const finalResult = this.recognizer.getResult(this.recognizerStream)
        const finalText = finalResult?.text?.trim()

        if (finalText) {
          const processingTime = this.partialStartTime
            ? Date.now() - this.partialStartTime
            : 0
          this.sendTranscriptionResult(finalText, true, processingTime)
          this.recordProcessingTime(processingTime)
        }

        // Reset for next utterance
        this.recognizer.reset(this.recognizerStream)
        this.resetRealTimeState()

        // Clear streaming UI state
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sherpa-streaming-transcription", {
              detail: {
                text: "",
                isFinal: true,
                isPartial: false,
                metadata: { utteranceId: this.currentUtteranceId, clear: true },
              },
            })
          )
        }

        this.recordUtterance()
      }
    } catch (error) {
      console.error("Error processing audio data", { error })
      this._callbacks?.onError(`Audio processing error: ${error}`)
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
    } else if (typeof window !== "undefined") {
      // Emit streaming event for partial results only
      window.dispatchEvent(
        new CustomEvent("sherpa-streaming-transcription", { detail: result })
      )
    }

    this._callbacks?.onTranscription(result)
  }

  private resetRealTimeState(): void {
    this.lastPartialResult = ""
    this.partialStartTime = null
    this.currentUtteranceId++
  }
}

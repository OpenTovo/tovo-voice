/**
 * Whisper.cpp Transcription Engine Implementation
 *
 * Implements the unified transcription interface for Whisper.cpp WASM
 */

import { modelLogger } from "@/lib/logger"
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
import { loadWasmModule, type WasmModule } from "./wasm-loader"
import { loadWhisperModel } from "./whisper-model"

/**
 * Whisper.cpp transcription engine
 */
export class WhisperTranscriptionEngine
  extends BaseTranscriptionEngine
  implements ITranscriptionEngine
{
  readonly engineType = TranscriptionEngine.WHISPER
  readonly supportsRealTime = false // Whisper processes in chunks, not truly real-time

  private wasmModule: WasmModule | null = null
  private instance: any = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private processor: AudioWorkletNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private transcriptionInterval: NodeJS.Timeout | null = null

  // Audio buffering for chunk-based processing
  private audioBuffer: Float32Array[] = []
  private lastAudioDataTime = Date.now()

  async loadModel(
    modelId: UnifiedModelId,
    callbacks: ModelLoadCallbacks
  ): Promise<void> {
    try {
      this.setStatus(TranscriptionStatus.LOADING_MODEL)
      const modelConfig = getModelById(modelId)

      if (modelConfig.engine !== TranscriptionEngine.WHISPER) {
        throw new Error(
          `Model ${modelId} is not compatible with Whisper.cpp engine`
        )
      }

      if (!modelConfig.whisperConfig) {
        throw new Error(`Model ${modelId} missing Whisper configuration`)
      }

      modelLogger.info("Loading Whisper.cpp model", { modelId, modelConfig })

      // Load WASM module
      callbacks.onProgress(10)
      this.wasmModule = await loadWasmModule()

      callbacks.onProgress(30)

      // Load Whisper model
      await loadWhisperModel(
        modelConfig.whisperConfig.modelName,
        this.wasmModule,
        {
          onProgress: (progress) => callbacks.onProgress(30 + progress * 0.6), // 30-90%
          onComplete: () => {
            callbacks.onProgress(95)
          },
          onError: callbacks.onError,
        }
      )

      // Initialize Whisper instance
      this.instance = this.wasmModule.init("whisper.bin")
      if (!this.instance) {
        throw new Error("Failed to initialize Whisper instance")
      }

      callbacks.onProgress(100)

      this._currentModel = modelConfig
      this._isInitialized = true
      this.setStatus(TranscriptionStatus.READY)

      modelLogger.info("Whisper.cpp model loaded successfully", { modelId })
      callbacks.onComplete()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      modelLogger.error("Failed to load Whisper.cpp model", {
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
      if (this.instance && this.wasmModule) {
        this.wasmModule.free(this.instance)
        this.instance = null
      }

      this.wasmModule = null
      this._currentModel = null
      this._isInitialized = false
      this.setStatus(TranscriptionStatus.IDLE)

      // Clear audio buffer
      this.audioBuffer = []

      modelLogger.info("Whisper.cpp model unloaded")
    } catch (error) {
      modelLogger.error("Error unloading Whisper.cpp model", { error })
    }
  }

  async startRecording(callbacks: TranscriptionCallbacks): Promise<void> {
    if (!this._isInitialized || !this.wasmModule || !this.instance) {
      throw new Error("Model not loaded")
    }

    if (this._status === TranscriptionStatus.RECORDING) {
      throw new Error("Already recording")
    }

    try {
      this.setStatus(TranscriptionStatus.INITIALIZING)
      this._callbacks = callbacks
      this._recordingStartTime = Date.now()
      this.audioBuffer = []
      this.lastAudioDataTime = Date.now()

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
          "/audio-processor/whisper-audio-processor.js"
        )
        this.processor = new AudioWorkletNode(
          this.audioContext,
          "whisper-audio-processor"
        )

        // Handle audio data from worklet
        this.processor.port.onmessage = (event) => {
          if (event.data.type === "audioData") {
            this.bufferAudioData(event.data.audioData)
          }
        }

        // Connect audio nodes (no output to speakers)
        this.source.connect(this.processor)
      } catch (workletError) {
        modelLogger.warn(
          "AudioWorklet failed, falling back to ScriptProcessor",
          { error: workletError }
        )

        // Fallback to ScriptProcessorNode
        const scriptProcessor = this.audioContext.createScriptProcessor(
          AUDIO_CONFIG.BUFFER_SIZE,
          1,
          1
        )

        scriptProcessor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0)
          this.bufferAudioData(new Float32Array(inputData))
        }

        this.source.connect(scriptProcessor)
        this.processor = scriptProcessor as any
      }

      // Start periodic transcription
      this.startPeriodicTranscription()

      this.setStatus(TranscriptionStatus.RECORDING)
      modelLogger.info("Whisper.cpp recording started with streaming approach")
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      modelLogger.error("Failed to start Whisper.cpp recording", {
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
      // Stop periodic transcription
      if (this.transcriptionInterval) {
        clearInterval(this.transcriptionInterval)
        this.transcriptionInterval = null
      }

      // Process any remaining audio
      if (this.audioBuffer.length > 0) {
        await this.processAudioBuffer(true) // Final transcription
      }

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

      this.audioBuffer = []
      this._recordingStartTime = null
      this._callbacks = null
      this.setStatus(TranscriptionStatus.READY)

      modelLogger.info("Whisper.cpp recording stopped")
    } catch (error) {
      modelLogger.error("Error stopping Whisper.cpp recording", { error })
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

  private bufferAudioData(audioData: Float32Array): void {
    // Validate audio data first
    if (!audioData || !audioData.length) {
      modelLogger.warn("Received invalid audio data", { audioData })
      return
    }

    this.audioBuffer.push(new Float32Array(audioData))
    this.lastAudioDataTime = Date.now()

    // Manage buffer size to prevent memory issues (keep ~10 seconds of audio max)
    const maxBufferSize = 160 // ~10 seconds at 16kHz with 4096 samples per chunk
    if (this.audioBuffer.length > maxBufferSize) {
      // Remove oldest chunks to maintain reasonable memory usage
      this.audioBuffer = this.audioBuffer.slice(-maxBufferSize)
    }

    // Log occasionally to confirm audio is being received
    if (this.audioBuffer.length % 50 === 0) {
      modelLogger.debug("Audio buffer status", {
        bufferCount: this.audioBuffer.length,
        audioDataLength: audioData.length,
      })
    }

    // Stream accumulated audio to Whisper (following reference implementation pattern)
    if (this.wasmModule && this.instance) {
      try {
        // Accumulate all audio data like the reference implementation
        const totalLength = this.audioBuffer.reduce(
          (sum, chunk) => sum + chunk.length,
          0
        )
        const audioAll = new Float32Array(totalLength)

        let offset = 0
        for (const chunk of this.audioBuffer) {
          audioAll.set(chunk, offset)
          offset += chunk.length
        }

        // Send accumulated audio to Whisper
        const result = this.wasmModule.set_audio(this.instance, audioAll)
        if (result !== 0) {
          modelLogger.warn("Audio streaming warning", { result })
        }
      } catch (error) {
        modelLogger.error("Error streaming audio to Whisper", { error })
      }
    }
  }

  private startPeriodicTranscription(): void {
    // Check for transcription results every 100ms to match reference implementation
    this.transcriptionInterval = setInterval(() => {
      this.checkForTranscription()
    }, 100) // Match the reference implementation frequency
  }

  private checkForTranscription(): void {
    if (!this.wasmModule || !this.instance) {
      return
    }

    try {
      // Check for new transcription results
      const transcription = this.wasmModule.get_transcribed()

      // The reference implementation checks: transcribed != null && transcribed.length > 1
      if (transcription != null && transcription.length > 1) {
        modelLogger.info("Received transcription", {
          text: transcription.trim(),
        })

        const result: TranscriptionResult = {
          text: transcription.trim(),
          timestamp: Date.now(),
          isFinal: false,
          isPartial: true,
          metadata: {
            processingTime: 0, // Real-time streaming doesn't have discrete processing time
            utteranceId: this._stats.utteranceCount,
          },
        }

        this._callbacks?.onTranscription(result)
      }
    } catch (error) {
      modelLogger.error("Error checking for transcription", { error })
    }
  }

  private async processAudioBuffer(isFinal: boolean): Promise<void> {
    if (!this.wasmModule || !this.instance) {
      return
    }

    try {
      // For final processing, check one more time for any remaining transcription
      if (isFinal) {
        modelLogger.info("Processing final audio buffer")

        // Give the WASM a moment to process any remaining audio
        await new Promise((resolve) => setTimeout(resolve, 100))

        const transcription = this.wasmModule.get_transcribed()

        if (transcription && transcription.trim()) {
          modelLogger.info("Final transcription result", {
            text: transcription.trim(),
          })

          const result: TranscriptionResult = {
            text: transcription.trim(),
            timestamp: Date.now(),
            isFinal: true,
            isPartial: false,
            metadata: {
              processingTime: 0,
              utteranceId: this._stats.utteranceCount,
            },
          }

          this.recordFinalResult()
          this.recordUtterance()
          this._callbacks?.onTranscription(result)
        }
      }

      // Clear processed audio buffer
      this.audioBuffer = []
      this.setStatus(TranscriptionStatus.RECORDING)
    } catch (error) {
      modelLogger.error("Error processing audio buffer", { error })
      this._callbacks?.onError(`Audio processing error: ${error}`)
      this.setStatus(TranscriptionStatus.RECORDING)
    }
  }
}

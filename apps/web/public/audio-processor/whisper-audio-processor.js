/**
 * Whisper Audio Worklet Processor
 * Processes audio in a separate thread for better performance
 * Replaces the deprecated ScriptProcessorNode
 *
 * Strategy: Accumulate 5 seconds of audio before sending to WASM
 * (matching whisper.cpp example strategy)
 */
class WhisperAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()

    // Target 5 seconds of audio at 16kHz = 80,000 samples
    // This matches the whisper.cpp example strategy
    this.targetSamples = 5 * 16000 // 5 seconds * 16kHz
    this.audioBuffer = new Float32Array(this.targetSamples * 2) // Extra space for safety
    this.bufferIndex = 0
    this.lastSendTime = 0

    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.command === "reset") {
        this.bufferIndex = 0
        this.audioBuffer.fill(0)
        this.lastSendTime = 0
      }
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]

    // If no input, return true to keep the processor alive
    if (!input || input.length === 0) {
      return true
    }

    const inputChannel = input[0] // First channel (mono)
    if (!inputChannel) {
      return true
    }

    // Accumulate audio samples
    for (let i = 0; i < inputChannel.length; i++) {
      if (this.bufferIndex < this.audioBuffer.length) {
        this.audioBuffer[this.bufferIndex] = inputChannel[i]
        this.bufferIndex++
      }
    }

    // Send audio every 5 seconds OR when buffer is full
    const timeSinceLastSend = Date.now() / 1000 - this.lastSendTime
    const shouldSend =
      timeSinceLastSend >= 5.0 || this.bufferIndex >= this.targetSamples

    if (shouldSend && this.bufferIndex > 0) {
      // Send the accumulated audio data
      const audioData = new Float32Array(this.bufferIndex)
      audioData.set(this.audioBuffer.subarray(0, this.bufferIndex))

      this.port.postMessage({
        type: "audioData",
        data: audioData,
        sampleRate: 16000, // We know it's 16kHz
        timestamp: Date.now(),
        duration: this.bufferIndex / 16000,
      })

      // Reset for next accumulation
      this.bufferIndex = 0
      this.audioBuffer.fill(0)
      this.lastSendTime = Date.now() / 1000
    }

    // Pass audio through (optional, for monitoring)
    if (outputs && outputs[0] && outputs[0][0]) {
      outputs[0][0].set(inputChannel)
    }

    return true // Keep the processor alive
  }

  static get parameterDescriptors() {
    return []
  }
}

// Register the processor
registerProcessor("whisper-audio-processor", WhisperAudioProcessor)

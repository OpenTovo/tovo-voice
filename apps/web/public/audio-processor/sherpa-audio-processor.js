/**
 * Sherpa-ONNX Audio Worklet Processor
 * Processes audio in real-time for Sherpa-ONNX recognition
 *
 * Unlike Whisper which uses 5-second batches, Sherpa-ONNX processes
 * audio in smaller chunks for real-time streaming transcription
 */
class SherpaAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()

    // Sherpa-ONNX works well with smaller chunks (0.1-0.5 seconds)
    this.chunkSamples = Math.floor(0.2 * 16000) // 0.2 seconds at 16kHz = 3200 samples
    this.audioBuffer = new Float32Array(this.chunkSamples * 2) // Extra space
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

    // Send audio when we have enough samples (0.2 seconds)
    const timeSinceLastSend = Date.now() / 1000 - this.lastSendTime
    const shouldSend =
      this.bufferIndex >= this.chunkSamples ||
      (timeSinceLastSend >= 0.2 && this.bufferIndex > 0)

    if (shouldSend && this.bufferIndex > 0) {
      // Send the accumulated audio data
      const audioData = new Float32Array(this.bufferIndex)
      audioData.set(this.audioBuffer.subarray(0, this.bufferIndex))

      this.port.postMessage({
        type: "audioData",
        data: audioData,
        sampleRate: 16000,
        timestamp: Date.now(),
        duration: this.bufferIndex / 16000,
        chunkSize: this.bufferIndex,
      })

      // Reset for next chunk
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
registerProcessor("sherpa-audio-processor", SherpaAudioProcessor)

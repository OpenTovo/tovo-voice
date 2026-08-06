/// <reference lib="webworker" />
/**
 * Sherpa-ONNX ASR Worker
 *
 * Runs the sherpa-onnx WASM recognizer off the main thread. The main thread
 * transfers the cached model files (data/wasm/api/loader) once at load time,
 * then streams Float32Array audio chunks here for decoding. Results are
 * posted back as partial/final events.
 *
 * This is a module worker. The sherpa scripts are classic scripts that
 * assign to globals, so we execute them via indirect eval (which runs in the
 * worker's global scope) instead of importScripts (classic-worker-only).
 */

// Explicit ESM marker — ensures Next.js bundles this as an ES module.
export {}

const SHERPA_CPP_LOG_LINE = /\.(cc|h):[^:]*:\d+/

/**
 * Execute a classic script in the worker's global scope via indirect eval.
 * The sherpa scripts assign to globals (Module, createOnlineRecognizer), so
 * they must run in global scope — not as ES modules.
 */
async function evalScript(blobUrl: string): Promise<void> {
  const response = await fetch(blobUrl)
  const code = await response.text()
  // Indirect eval (0, eval) runs in global scope, so top-level `var`/function
  // declarations become globals on `self`.
  // biome-ignore lint/complexity/noCommaOperator: required for indirect eval.
  // biome-ignore lint/security/noGlobalEval: Sherpa's generated classic scripts must run in the worker global scope.
  ;(0, eval)(code)
}

interface LoadPayload {
  type: "load"
  data: ArrayBuffer // .data file (model weights packed)
  wasm: ArrayBuffer // .wasm binary
  api: ArrayBuffer // sherpa-onnx-asr.js source
  loader: ArrayBuffer // sherpa-onnx-wasm-main-asr.js source
}

interface AudioPayload {
  type: "audioData"
  samples: Float32Array
  sampleRate: number
}

type InMessage =
  | LoadPayload
  | AudioPayload
  | { type: "start" }
  | { type: "stop" }
  | { type: "unload" }

const SAMPLE_RATE = 16000

let recognizer: any = null
let stream: any = null
let lastPartial = ""
let partialStartTime: number | null = null
let currentUtteranceId = 0

function post(msg: any) {
  ;(self as any).postMessage(msg)
}

function withTimeout<T>(ms: number, msg: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(msg)), ms)
  )
}

async function loadModel(payload: LoadPayload) {
  try {
    post({ type: "progress", progress: 10 })

    const apiUrl = URL.createObjectURL(
      new Blob([payload.api], { type: "text/javascript" })
    )
    const loaderUrl = URL.createObjectURL(
      new Blob([payload.loader], { type: "text/javascript" })
    )

    let readyResolve: () => void
    const ready = new Promise<void>((resolve) => {
      readyResolve = resolve
    })

    const g: any = self as any
    g.Module = {
      // The generated Emscripten loader accepts these buffers directly. This
      // avoids fetching the transferred model package from a Blob URL again.
      getPreloadedPackage: () => payload.data,
      wasmBinary: payload.wasm,
      mainScriptUrlOrBlob: loaderUrl,
      onRuntimeInitialized: () => {
        post({ type: "progress", progress: 90 })
        readyResolve()
      },
      print: () => {},
      printErr: (text: string) => {
        if (typeof text === "string" && SHERPA_CPP_LOG_LINE.test(text)) return
        console.warn("sherpa wasm:", text)
      },
    }

    // Suppress the C++ config dump that sherpa prints to console.error during
    // recognizer construction (it bypasses Module.printErr).
    const origError = console.error
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && SHERPA_CPP_LOG_LINE.test(args[0]))
        return
      origError(...(args as any[]))
    }

    try {
      // Load the high-level API first (defines createOnlineRecognizer), then
      // the emscripten loader which instantiates the Module.
      await evalScript(apiUrl)
      post({ type: "progress", progress: 30 })
      await evalScript(loaderUrl)

      await Promise.race([
        ready,
        withTimeout(60000, "Timeout waiting for Sherpa WASM to initialize"),
      ])

      // The runtime has copied the packaged files into its filesystem by the
      // time onRuntimeInitialized fires. Drop the transferred buffers so the
      // browser can reclaim them before the recognizer is constructed.
      payload.data = new ArrayBuffer(0)
      payload.wasm = new ArrayBuffer(0)

      if (!g.Module?.calledRun) {
        throw new Error("WASM module failed to initialize")
      }

      const module: any = g.Module
      const createRecognizer =
        module.createOnlineRecognizer || g.createOnlineRecognizer
      if (typeof createRecognizer !== "function") {
        throw new Error("createOnlineRecognizer not found after WASM init")
      }
      recognizer = createRecognizer(module)
      stream = recognizer.createStream()
      if (!stream) throw new Error("Failed to create recognizer stream")

      // Warm up the recognizer with a dummy decode so the first real
      // utterance's partials show up promptly (ONNX graph optimization
      // and memory allocation happen on the first decode call).
      const dummy = new Float32Array(SAMPLE_RATE * 0.5) // 0.5s of silence
      stream.acceptWaveform(SAMPLE_RATE, dummy)
      while (recognizer.isReady(stream)) {
        recognizer.decode(stream)
      }
      recognizer.getResult(stream)
      recognizer.reset(stream)
    } finally {
      console.error = origError
      URL.revokeObjectURL(apiUrl)
      URL.revokeObjectURL(loaderUrl)
    }

    post({ type: "progress", progress: 100 })
    post({ type: "ready" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Sherpa worker load failed", message)
    post({ type: "error", message })
  }
}

function startStream() {
  if (!recognizer || !stream) return
  recognizer.reset(stream)
  lastPartial = ""
  partialStartTime = null
}

function processAudio(payload: AudioPayload) {
  if (!recognizer || !stream) return

  try {
    stream.acceptWaveform(SAMPLE_RATE, payload.samples)

    while (recognizer.isReady(stream)) {
      recognizer.decode(stream)
    }

    const result = recognizer.getResult(stream)
    const text = result?.text?.trim()

    if (text && text !== lastPartial) {
      if (!partialStartTime) partialStartTime = Date.now()
      post({ type: "partial", text })
      lastPartial = text
    }

    if (recognizer.isEndpoint(stream)) {
      const finalResult = recognizer.getResult(stream)
      const finalText = finalResult?.text?.trim()
      if (finalText) {
        const processingTime = partialStartTime
          ? Date.now() - partialStartTime
          : 0
        post({
          type: "final",
          text: finalText,
          processingTime,
          utteranceId: currentUtteranceId,
        })
      }
      recognizer.reset(stream)
      lastPartial = ""
      partialStartTime = null
      currentUtteranceId++
      post({ type: "clear", utteranceId: currentUtteranceId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Sherpa worker audio error", message)
    post({ type: "error", message })
  }
}

function stopStream() {
  if (!recognizer || !stream) return
  try {
    const finalResult = recognizer.getResult(stream)
    const text = finalResult?.text?.trim()
    if (text) {
      post({
        type: "final",
        text,
        processingTime: 0,
        utteranceId: currentUtteranceId,
      })
    }
  } catch {
    // ignore
  }
}

function unload() {
  stream = null
  recognizer = null
  lastPartial = ""
  partialStartTime = null
  currentUtteranceId = 0
}

self.onmessage = (event: MessageEvent<InMessage>) => {
  const msg = event.data
  switch (msg.type) {
    case "load":
      loadModel(msg)
      break
    case "start":
      startStream()
      break
    case "audioData":
      processAudio(msg)
      break
    case "stop":
      stopStream()
      break
    case "unload":
      unload()
      break
  }
}

/**
 * WebLLM Web Worker
 * Handles WebLLM computation in a separate thread for better performance
 */

import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm"

const handler = new WebWorkerMLCEngineHandler()

self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg)
}

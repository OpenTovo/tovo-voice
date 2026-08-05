// WebLLM models configuration
// Model IDs must match exactly with WebLLM's official model list
// See: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
//
// To add more models:
// 1. Find the model_id from webllm.prebuiltAppConfig.model_list
// 2. Add it to this configuration with the exact same webllmId

import { prebuiltAppConfig } from "@mlc-ai/web-llm"

export const WEBLLM_MODELS = {
  // this one is not good but it's the only one ios safari can handle
  "SmolLM2-135M-Instruct-q0f16-MLC": {
    name: "SmolLM2 135M",
    description: "Tiny SmolLM-135M instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "SmolLM2-135M-Instruct-q0f16-MLC"
    ),
  },
  "gemma3-1b-it-q4f16_1-MLC": {
    name: "Gemma 3 1B",
    description: "Google's compact Gemma 3 instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "gemma3-1b-it-q4f16_1-MLC"
    ),
  },
  "Llama-3.2-1B-Instruct-q4f16_1-MLC": {
    name: "Llama3.2 1B",
    description: "Llama 3.2 1B instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Llama-3.2-1B-Instruct-q4f16_1-MLC"
    ),
  },
  "Qwen3.5-0.8B-q4f16_1-MLC": {
    name: "Qwen3.5 0.8B",
    description: "Experimental compact Qwen3.5 general-purpose model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Qwen3.5-0.8B-q4f16_1-MLC"
    ),
  },
  "Qwen3-1.7B-q4f16_1-MLC": {
    name: "Qwen3 1.7B",
    description: "Alibaba's compact Qwen3 general-purpose model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Qwen3-1.7B-q4f16_1-MLC"
    ),
  },
  "Qwen3.5-2B-q4f16_1-MLC": {
    name: "Qwen3.5 2B",
    description:
      "Newer Qwen3.5 with hybrid RNN architecture for efficient long context.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Qwen3.5-2B-q4f16_1-MLC"
    ),
  },
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC": {
    name: "SmolLM2 1.7B",
    description: "Larger SmolLM2 instruct model with better instruction following.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "SmolLM2-1.7B-Instruct-q4f16_1-MLC"
    ),
  },
  "Qwen3-4B-q4f16_1-MLC": {
    name: "Qwen3 4B",
    description: "Alibaba's Qwen3 general-purpose model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Qwen3-4B-q4f16_1-MLC"
    ),
  },
} as const

export type WebLLMModelName = keyof typeof WEBLLM_MODELS

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
  "SmolLM2-360M-Instruct-q4f32_1-MLC": {
    name: "SmolLM2 360M",
    description: "Tiny SmolLM-360M instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "SmolLM2-360M-Instruct-q4f32_1-MLC"
    ),
  },
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC": {
    name: "SmolLM2 1.7B",
    description: "Tiny SmolLM2 instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "SmolLM2-1.7B-Instruct-q4f16_1-MLC"
    ),
  },
  "gemma-2-2b-it-q4f16_1-MLC": {
    name: "Gemma 2 2B",
    description: "Google's Gemma-2 2B instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "gemma-2-2b-it-q4f16_1-MLC"
    ),
  },
  // "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC": {
  //   name: "TinyLlama 1.1B",
  //   description: "TinyLlama 1.1B chat model.",
  //   config: prebuiltAppConfig.model_list.find(
  //     (m) => m.model_id === "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC"
  //   ),
  // },
  "Llama-3.2-1B-Instruct-q4f16_1-MLC": {
    name: "Llama3.2 1B",
    description: "Llama 3.2 1B instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Llama-3.2-1B-Instruct-q4f16_1-MLC"
    ),
  },
  "Llama-3.2-3B-Instruct-q4f16_1-MLC": {
    name: "Llama3.2 3B",
    description: "Llama-3.2 instruct model from Meta.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Llama-3.2-3B-Instruct-q4f16_1-MLC"
    ),
  },
  "Hermes-3-Llama-3.2-3B-q4f16_1-MLC": {
    name: "Hermes3 Llama3.2 3B",
    description: "Hermes-3 Llama-3.2 3B model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Hermes-3-Llama-3.2-3B-q4f16_1-MLC"
    ),
  },
  // Qwen 0.5B is not good
  // "Qwen2.5-0.5B-Instruct-q4f16_1-MLC": {
  //   name: "Qwen2.5 0.5B",
  //   description: "Qwen 2.5 0.5B instruct model.",
  //   config: prebuiltAppConfig.model_list.find(
  //     (m) => m.model_id === "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"
  //   ),
  // },
  // "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC": {
  //   name: "Qwen2.5 Coder 0.5B",
  //   description: "Qwen 2.5 Coder 0.5B instruct model.",
  //   config: prebuiltAppConfig.model_list.find(
  //     (m) => m.model_id === "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC"
  //   ),
  // },
  "Qwen3-4B-q4f16_1-MLC": {
    name: "Qwen3 4B",
    description: "Alibaba's Qwen3 general-purpose model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Qwen3-4B-q4f16_1-MLC"
    ),
  },
  // "Qwen3-0.6B-q4f16_1-MLC": {
  //   name: "Qwen3 0.6B",
  //   description: "Alibaba's Qwen3 general-purpose model.",
  //   config: prebuiltAppConfig.model_list.find(
  //     (m) => m.model_id === "Qwen3-0.6B-q4f16_1-MLC"
  //   ),
  // },
  // "Mistral-7B-Instruct-v0.3-q4f16_1-MLC": {
  //   name: "Mistral 7B",
  //   description: "Strong open LLM, instruct tuned.",
  //   config: prebuiltAppConfig.model_list.find(
  //     (m) => m.model_id === "Mistral-7B-Instruct-v0.3-q4f16_1-MLC"
  //   ),
  // },
  "Phi-3.5-mini-instruct-q4f16_1-MLC": {
    name: "Phi-3.5 Mini",
    description: "Microsoft Phi-3.5-mini instruct model.",
    config: prebuiltAppConfig.model_list.find(
      (m) => m.model_id === "Phi-3.5-mini-instruct-q4f16_1-MLC"
    ),
  },
} as const

export type WebLLMModelName = keyof typeof WEBLLM_MODELS

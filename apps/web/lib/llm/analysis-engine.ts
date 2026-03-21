/**
 * LLM Analysis Engine for Real-time Transcription Analysis
 *
 * This engine provides intelligent analysis of transcribed speech using local LLMs.
 * It includes session management, conversation history tracking, and smart summarization.
 *
 * CRITICAL: LLM MESSAGE STRUCTURE (NATURAL CHAT FLOW):
 * 1. SYSTEM role: Session prompts and instructions (at beginning)
 * 2. SYSTEM role: Conversation summary (when needed, replaces old messages)
 * 3. USER role: Transcription chunks (multiple messages as conversation flows)
 * 4. ASSISTANT role: AI responses (when there's something helpful to provide)
 *
 * DATA FLOW (NATURAL CHAT STRUCTURE):
 * ```
 * request.transcription: TranscriptionResult[]
 *   ↓
 * buildChatMessages() → [system, summary?, ...user/assistant pairs]
 *   ↓
 * sendLLMRequest() → LLM Response
 *   ↓
 * processLLMResponse() → Final Result + Update Chat History
 * ```
 *
 * Key Features:
 * - Natural chat flow with multiple user/assistant message pairs
 * - AI responds only when there's something helpful to provide
 * - Automatic conversation summarization to handle long chats
 * - Context-aware message management with summary injection
 * - Single source of truth: transcription array + chat history
 * - Intelligent response filtering (returns empty when nothing to help with)
 * - Configurable session types with different analysis styles
 *
 * Architecture:
 * - Main analyze() method orchestrates the entire process
 * - Chat history maintained as natural conversation flow
 * - Summary system replaces old messages when context gets too long
 * - Clear separation between public API and private implementation
 * - Streamlined for natural LLM conversation patterns
 */

import type { WebLLMModelName } from "./models"
import {
  type MessageTransformName,
  SESSION_ANALYSIS_CONFIG,
  SESSION_TYPE_CONFIG,
  type SessionType,
} from "./session-types"
import {
  createWebLLMEngine,
  getWebLLMEngineState,
  initializeWebLLMModel,
} from "./webllm-engine"

// Constants
const MAX_CHAT_MESSAGES = 20 // Maximum messages before summarization
const MIN_TRANSCRIPTION_LENGTH = 6
const SUMMARY_REPLACEMENT_THRESHOLD = 15 // Replace old messages with summary after this many messages

// Types
export interface AnalysisRequest {
  transcription: TranscriptionResult[] // Always an array
  sessionType: SessionType
  modelName: WebLLMModelName
  transform?: MessageTransformName
  previousResponses?: AnalysisResponse[]
  userProvidedContext?: string // Optional user-provided context
  onStreamChunk?: (chunk: string) => void
}

// TranscriptionResult type (matches whisper atoms)
export interface TranscriptionResult {
  text: string
  timestamp?: number
  speaker?: string
}

export interface AnalysisResponse {
  content: string
  timestamp: number
  sessionType: SessionType
  error?: string
}

export interface AnalysisProgress {
  stage: "initializing" | "analyzing" | "complete" | "error"
  message: string
  progress?: number
}

export interface SessionSummary {
  conversationSummary: string // Combined summary of user transcriptions and AI responses
  lastUpdated: number
  messageCount: number
}

// Chat message interface for natural conversation flow
interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
  timestamp: number
  isTranscription?: boolean // Mark transcription messages for processing
}

interface ConversationMessage {
  role: string
  content: string
}

export class LLMAnalysisEngine {
  // Core engine state
  private engine: any = null
  private currentModel: WebLLMModelName | null = null
  private isInitializing = false
  private isProcessing = false // Track if engine is currently processing a request

  // Chat history for natural conversation flow
  private chatHistory: ChatMessage[] = []

  // Session summary state
  private sessionSummary: SessionSummary = {
    conversationSummary: "",
    lastUpdated: 0,
    messageCount: 0,
  }

  // ========================================
  // MARK: PUBLIC API
  // ========================================

  /**
   * Initialize the LLM engine with a specific model
   */
  async initialize(
    modelName: WebLLMModelName,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<void> {
    if (this.isInitializing) {
      throw new Error("Engine is already initializing")
    }

    if (this.currentModel === modelName && this.engine) {
      return // Already initialized with this model
    }

    // First try to reconnect to existing engine if available
    if (await this.tryReconnectToExistingEngine(modelName)) {
      return
    }

    this.isInitializing = true

    try {
      onProgress?.({
        stage: "initializing",
        message: "Loading AI model...",
        progress: 0,
      })

      this.engine = await initializeWebLLMModel(
        modelName,
        (progressText) => {
          onProgress?.({
            stage: "initializing",
            message: progressText,
            progress: 50,
          })
        },
        () => {
          onProgress?.({
            stage: "complete",
            message: "Model ready for analysis",
            progress: 100,
          })
        },
        (error) => {
          onProgress?.({
            stage: "error",
            message: `Failed to initialize model: ${error.message}`,
          })
          throw error
        }
      )

      this.currentModel = modelName
    } catch (error) {
      this.engine = null
      this.currentModel = null
      onProgress?.({
        stage: "error",
        message: `Initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      })
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  /**
   * Try to reconnect to existing WebLLM engine if available
   */
  private async tryReconnectToExistingEngine(
    modelName: WebLLMModelName
  ): Promise<boolean> {
    const webllmState = getWebLLMEngineState()

    if (!webllmState.hasGlobalEngine) {
      return false
    }

    try {
      // Try to get the existing engine
      const existingEngine = await createWebLLMEngine()

      // Set up the engine and assume the model is correct
      // Model validation will happen during actual analysis
      this.engine = existingEngine
      this.currentModel = modelName

      return true
    } catch {
      return false
    }
  }

  // ========================================
  // MESSAGE TRANSFORM METHODS
  // ========================================

  /**
   * Apply message transform to optimize transcription for analysis
   */
  /**
   * Process simple text response from LLM
   */
  private processTextResponse(content: string): string {
    const cleaned = content.trim()

    // Check if LLM responded with "none" (case insensitive)
    if (this.shouldIgnoreResponse(cleaned)) {
      return ""
    }

    // Return the cleaned text content
    return cleaned
  }

  // ========================================
  // MARK: CHAT HISTORY MANAGEMENT
  // ========================================

  /**
   * Add transcription to chat history as user message
   */
  private addTranscriptionToChat(transcriptionText: string): void {
    if (
      !transcriptionText.trim() ||
      transcriptionText.length < MIN_TRANSCRIPTION_LENGTH
    ) {
      return
    }

    // Add as user message
    this.chatHistory.push({
      role: "user",
      content: transcriptionText.trim(),
      timestamp: Date.now(),
      isTranscription: true,
    })

    // Check if we need to summarize due to length
    this.checkAndSummarizeIfNeeded()
  }

  /**
   * Add AI response to chat history as assistant message
   */
  private addResponseToChat(responseContent: string): void {
    if (!responseContent.trim()) {
      return // Don't add empty responses to chat history
    }

    this.chatHistory.push({
      role: "assistant",
      content: responseContent.trim(),
      timestamp: Date.now(),
    })

    // Check if we need to summarize due to length
    this.checkAndSummarizeIfNeeded()
  }

  /**
   * Check if chat history is too long and summarize if needed
   */
  private async checkAndSummarizeIfNeeded(): Promise<void> {
    if (this.chatHistory.length <= MAX_CHAT_MESSAGES) {
      return
    }

    await this.summarizeAndReplaceOldMessages()
  }

  /**
   * Summarize old messages and replace them with a summary
   */
  private async summarizeAndReplaceOldMessages(): Promise<void> {
    if (
      !this.engine ||
      this.chatHistory.length < SUMMARY_REPLACEMENT_THRESHOLD
    ) {
      return
    }

    try {
      // Separate system messages from conversation messages
      const conversationMessages = this.chatHistory.filter(
        (msg) => msg.role !== "system"
      )

      // Take messages to summarize (all but the most recent few)
      const messagesToSummarize = conversationMessages.slice(0, -5) // Keep last 5 messages
      const messagesToKeep = conversationMessages.slice(-5)

      if (messagesToSummarize.length === 0) {
        return
      }

      // Build conversation text for summarization
      const conversationText = messagesToSummarize
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n")

      const summaryPrompt = this.sessionSummary.conversationSummary
        ? `Previous key points: ${this.sessionSummary.conversationSummary}\n\n` +
          `Additional conversation:\n${conversationText}\n\n` +
          `Extract the most important key points, topics, and concepts discussed. Format as a concise bullet list.`
        : `Conversation:\n${conversationText}\n\n` +
          `Extract the most important key points, topics, and concepts discussed. Format as a concise bullet list.`

      const summaryResponse = await this.engine.chat.completions.create({
        messages: [{ role: "user", content: summaryPrompt }],
        temperature: 0.3,
        max_tokens: 200,
        stream: false,
      })

      const newSummary =
        summaryResponse.choices?.[0]?.message?.content?.trim() || ""

      if (newSummary) {
        // Update session summary - this will be added to system message in buildChatMessages
        this.sessionSummary.conversationSummary = newSummary
        this.sessionSummary.lastUpdated = Date.now()
        this.sessionSummary.messageCount = this.chatHistory.length

        // Replace chat history with only recent user/assistant messages
        // Summary is now handled in the system message, not in chat history
        this.chatHistory = [...messagesToKeep]
      }
    } catch (error) {
      console.warn("Failed to summarize conversation:", error)
    }
  }

  // ========================================
  // MARK: ANALYSIS
  // ========================================

  /**
   * Analyze transcription with the current model using natural chat flow
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    if (!this.engine || this.currentModel !== request.modelName) {
      throw new Error(`Engine not initialized with model ${request.modelName}`)
    }

    // Prevent concurrent requests to avoid overwhelming WebLLM
    if (this.isProcessing) {
      console.log("WebLLM engine is busy, skipping this analysis request")
      return this.createEmptyResponse(request.sessionType)
    }

    this.isProcessing = true

    try {
      const sessionConfig = SESSION_ANALYSIS_CONFIG[request.sessionType]

      // Check if we have any transcription to process
      if (!request.transcription?.length) {
        return this.createEmptyResponse(request.sessionType)
      }

      // Extract new transcription text (only process latest chunk to avoid duplication)
      let newTranscriptionText = ""
      if (request.transcription && request.transcription.length > 0) {
        // Get the latest transcription chunk - this ensures we only process new content
        // since the AI response section already filters by timestamp
        const latestTranscription =
          request.transcription[request.transcription.length - 1]
        newTranscriptionText = latestTranscription?.text?.trim() || ""
      }

      if (
        !newTranscriptionText ||
        newTranscriptionText.length < MIN_TRANSCRIPTION_LENGTH
      ) {
        return this.createEmptyResponse(request.sessionType)
      }

      // Add transcription to chat history
      this.addTranscriptionToChat(newTranscriptionText)

      // Build chat messages for LLM
      const chatMessages = this.buildChatMessages(
        request.sessionType,
        request.userProvidedContext
      )

      // Send request to LLM
      const llmResponse = await this.sendLLMRequest(
        chatMessages,
        sessionConfig,
        request
      )

      // Process and return response
      const finalResponse = this.processLLMResponse(
        llmResponse,
        request.sessionType
      )

      return finalResponse
    } catch (error) {
      console.error("LLM analysis error:", error)
      return this.createErrorResponse(request.sessionType, error)
    } finally {
      // Always reset processing flag to allow future requests
      this.isProcessing = false
    }
  }

  // ========================================
  // MARK: PUBLIC UTIL
  // ========================================

  /**
   * Clear conversation history and session summaries (useful when starting a new session)
   */
  clearConversationHistory(): void {
    this.chatHistory = []
    this.sessionSummary = {
      conversationSummary: "",
      lastUpdated: 0,
      messageCount: 0,
    }
    // Reset processing flag when clearing history (new session)
    this.isProcessing = false
  }

  /**
   * Get current session summary for debugging/monitoring
   */
  getSessionSummary(): SessionSummary {
    return { ...this.sessionSummary }
  }

  /**
   * Check if engine is currently processing a request
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing
  }

  /**
   * Check if engine is ready for analysis with a specific model
   */
  isReadyForModel(modelName: WebLLMModelName): boolean {
    return this.isReady() && this.currentModel === modelName
  }

  /**
   * Check if engine is ready for analysis
   */
  isReady(): boolean {
    return this.engine !== null && !this.isInitializing
  }

  /**
   * Get current model name
   */
  getCurrentModel(): WebLLMModelName | null {
    return this.currentModel
  }

  /**
   * Cleanup and unload the model
   */
  async cleanup(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload()
      } catch (error) {
        console.warn("Error during engine cleanup:", error)
      }
      this.engine = null
      this.currentModel = null
    }

    // Clear conversation history
    this.clearConversationHistory()
  }

  // ========================================
  // MARK: WEBLLM
  // ========================================

  /**
   * Build chat messages for LLM from chat history and session config
   */
  private buildChatMessages(
    sessionType: SessionType,
    userProvidedContext?: string
  ): ConversationMessage[] {
    const promptConfig = SESSION_TYPE_CONFIG[sessionType]
    const sessionConfig = SESSION_ANALYSIS_CONFIG[sessionType]

    const messages: ConversationMessage[] = []

    // 1. Single system message with all system-level information
    let systemContent = `${promptConfig.systemPrompt}\nResponse style: Be ${sessionConfig.responseStyle} in your assistance.`

    // Add conversation summary if we have one
    if (this.sessionSummary.conversationSummary) {
      systemContent += `\n\nCONVERSATION SUMMARY: ${this.sessionSummary.conversationSummary}`
    }

    // Add user-provided context if available
    if (userProvidedContext?.trim()) {
      systemContent += `\n\nUSER-PROVIDED CONTEXT: ${userProvidedContext.trim()}`
    }

    messages.push({
      role: "system",
      content: systemContent,
    })

    // 2. Add only user/assistant messages from chat history (no system messages)
    for (const chatMessage of this.chatHistory) {
      if (chatMessage.role !== "system") {
        messages.push({
          role: chatMessage.role,
          content: chatMessage.content,
        })
      }
    }

    return messages
  }

  /**
   * Send LLM request and handle streaming
   */
  private async sendLLMRequest(
    chatMessages: ConversationMessage[],
    sessionConfig: any,
    request: AnalysisRequest
  ): Promise<string> {
    console.log("🔍 WebLLM Request:", {
      model: this.currentModel,
      sessionType: request.sessionType,
      messageCount: chatMessages.length,
      temperature: sessionConfig.temperature,
      maxTokens: sessionConfig.maxTokens,
      messages: chatMessages.map((msg, idx) => ({
        index: idx,
        role: msg.role,
        contentLength: msg.content.length,
        content:
          process.env.NODE_ENV === "development" ? msg.content : "[HIDDEN]",
      })),
    })

    const response = await this.engine.chat.completions.create({
      messages: chatMessages,
      temperature: sessionConfig.temperature,
      repetition_penalty: 1.1,
      max_tokens: sessionConfig.maxTokens,
      stream: true,
    })

    return this.handleStreamingResponse(response, request.onStreamChunk)
  }

  /**
   * Handle streaming response from LLM
   */
  private async handleStreamingResponse(
    response: any,
    onStreamChunk?: (chunk: string) => void
  ): Promise<string> {
    let content = ""
    let chunkCount = 0

    for await (const chunk of response) {
      chunkCount++
      const delta = chunk.choices?.[0]?.delta?.content || ""
      if (delta) {
        content += delta
        onStreamChunk?.(content)
      }
    }

    console.log("💬 WebLLM Response:", {
      model: this.currentModel,
      chunksReceived: chunkCount,
      contentLength: content.length,
      content: process.env.NODE_ENV === "development" ? content : "[HIDDEN]",
    })

    return content
  }

  /**
   * Process LLM response and update chat history
   */
  private processLLMResponse(
    content: string,
    sessionType: SessionType
  ): AnalysisResponse {
    const processedContent = this.processTextResponse(content)

    // Add this response to chat history if it's meaningful
    if (processedContent && !this.shouldIgnoreResponse(processedContent)) {
      this.addResponseToChat(processedContent)
    }

    return {
      content: processedContent,
      timestamp: Date.now(),
      sessionType,
    }
  }

  // ========================================
  // MARK: RESPONSE HP
  // ========================================

  /**
   * Create empty response
   */
  private createEmptyResponse(sessionType: SessionType): AnalysisResponse {
    return {
      content: "",
      timestamp: Date.now(),
      sessionType,
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    sessionType: SessionType,
    error: any
  ): AnalysisResponse {
    return {
      content: "",
      timestamp: Date.now(),
      sessionType,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  /**
   * Utility to check if response should be ignored
   */
  private shouldIgnoreResponse(content: string): boolean {
    const cleanContent = content
      .trim()
      .toLowerCase()
      // remove any markdown * and # and new lines at begining and ending
      .replace(/^[*#\s]+|[*#\s]+$/g, "")

    // Standard ignore cases
    if (
      ["none", "nothing", "empty"].includes(cleanContent) ||
      cleanContent.length === 0 ||
      cleanContent.startsWith("none")
    ) {
      return true
    }

    // Ignore responses that are just about audio quality or artifacts
    const ignorePatterns = [
      /^(inaudible|pause|silent|silence|unclear)\.?$/,
      /^(background noise|audio quality|can't hear)\.?$/,
      /^(keyboard|clicking|typing)\.?$/,
    ]

    for (const pattern of ignorePatterns) {
      if (pattern.test(cleanContent)) {
        return true
      }
    }

    return false
  }
}

// Global instance for reuse across components
export const llmAnalysisEngine = new LLMAnalysisEngine()

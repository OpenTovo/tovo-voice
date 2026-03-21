import { type AIResponseItem, tovoDB } from "../tovo-idb"
import type { SessionType } from "./session-types"

/**
 * AI Response Manager for handling AI response storage and retrieval
 * Manages AI responses generated during transcription sessions
 */
export class AIResponseManager {
  private sessionId: string
  private pendingResponses: AIResponseItem[] = []

  constructor(sessionId: string) {
    this.sessionId = sessionId
    this.pendingResponses = []
  }

  /**
   * Add an AI response to be saved
   */
  async addAIResponse(
    content: string,
    timestamp: number,
    sessionType: SessionType
  ): Promise<void> {
    if (!content.trim()) return // Don't save empty responses

    const aiResponse: AIResponseItem = {
      id: `ai-${this.sessionId}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      content: content.trim(),
      timestamp,
      sessionType: sessionType.toString(),
    }

    try {
      await tovoDB.saveAIResponse(aiResponse)
    } catch (error) {
      console.error("Error saving AI response:", error)
      // Add to pending if save fails
      this.pendingResponses.push(aiResponse)
    }
  }

  /**
   * Save any pending responses (for retry logic)
   */
  async savePendingResponses(): Promise<void> {
    const responses = [...this.pendingResponses]
    this.pendingResponses = []

    for (const response of responses) {
      try {
        await tovoDB.saveAIResponse(response)
      } catch (error) {
        console.error("Error saving pending AI response:", error)
        // Re-add to pending if it still fails
        this.pendingResponses.push(response)
      }
    }
  }

  /**
   * Get all AI responses for the current session
   */
  async getSessionAIResponses(): Promise<AIResponseItem[]> {
    try {
      return await tovoDB.getAIResponsesBySession(this.sessionId)
    } catch (error) {
      console.error("Error getting AI responses:", error)
      return []
    }
  }

  /**
   * Clear all pending responses (when ending session)
   */
  async endSession(): Promise<void> {
    try {
      // Save any remaining pending responses
      await this.savePendingResponses()
    } catch (error) {
      console.error("Error ending AI response session:", error)
    } finally {
      this.pendingResponses = []
    }
  }

  /**
   * Clear session data
   */
  async clearSession(): Promise<void> {
    this.pendingResponses = []
  }
}

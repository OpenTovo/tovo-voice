import { type TranscriptionChunk, tovoDB } from "../tovo-idb"

/**
 * Transcription session history management with sliding window
 * Keeps recent items in memory for display, archives older ones to IndexedDB
 *
 * This is separate from UnifiedTranscriptionManager which handles actual transcription engines.
 * This class focuses on storage, history, and UI display management.
 */

export interface TranscriptionItem {
  id: string
  text: string
  timestamp: number
  speaker?: string
}

export interface SessionHistory {
  id: string
  title?: string
  startTime: number
  endTime?: number
  totalItems: number
  currentChunk: number
}

export class TranscriptionHistoryManager {
  private readonly MAX_ITEMS_IN_DISPLAY = 20
  private readonly AUTO_SAVE_INTERVAL = 10 // Save every 10 items

  private currentSession: SessionHistory | null = null
  private recentItems: TranscriptionItem[] = [] // Items shown in display
  private pendingSaveItems: TranscriptionItem[] = [] // Items waiting to be saved
  private itemsSinceLastSave = 0

  constructor(private sessionId: string) {
    // Ensure completely clean state for each new instance
    this.currentSession = null
    this.recentItems = []
    this.pendingSaveItems = []
    this.itemsSinceLastSave = 0
    // Don't initialize session until first transcription item is added
  }

  /**
   * Initialize session in IndexedDB (lazy initialization)
   */
  private async ensureSessionInitialized(): Promise<void> {
    if (this.currentSession) return

    this.currentSession = {
      id: this.sessionId,
      startTime: Date.now(),
      totalItems: 0,
      currentChunk: 0,
    }
    await tovoDB.saveSession(this.currentSession)
  }

  /**
   * Add new transcription item
   * Manages sliding window and auto-save
   */
  async addTranscriptionItem(item: TranscriptionItem): Promise<void> {
    // Initialize session on first transcription item
    await this.ensureSessionInitialized()

    this.recentItems.push(item)
    this.itemsSinceLastSave++

    // Slide window if too many items for display (moves oldest items to pending save)
    if (this.recentItems.length > this.MAX_ITEMS_IN_DISPLAY) {
      await this.slideWindow()
    }

    // Auto-save periodically (saves all accumulated items)
    if (this.itemsSinceLastSave >= this.AUTO_SAVE_INTERVAL) {
      await this.updateSessionMetadata()
      this.itemsSinceLastSave = 0
    }
  }

  /**
   * Get current items for display
   */
  getCurrentItems(): TranscriptionItem[] {
    return this.recentItems
  } /**
   * Get total items count for current session (for display purposes)
   */
  async getTotalItemsCount(): Promise<number> {
    if (!this.currentSession) return 0

    // Calculate from saved chunks + pending items + current display items
    const allChunks = await tovoDB.getTranscriptionChunks(this.sessionId)
    const totalFromChunks = allChunks.reduce(
      (sum, chunk) => sum + chunk.items.length,
      0
    )
    return (
      totalFromChunks + this.pendingSaveItems.length + this.recentItems.length
    )
  }

  /**
   * Move oldest item from display to pending save queue (sliding window)
   */
  private async slideWindow(): Promise<void> {
    // Remove only the oldest item to maintain sliding window behavior
    const oldestItem = this.recentItems.shift()

    if (oldestItem) {
      // Add to pending save queue instead of saving immediately
      this.pendingSaveItems.push(oldestItem)
    }
  }

  /**
   * Save pending items and update session metadata
   */
  private async updateSessionMetadata(): Promise<void> {
    if (!this.currentSession) return

    // Store local reference to avoid race conditions
    const session = this.currentSession

    // Save any pending items first
    if (this.pendingSaveItems.length > 0) {
      await this.saveChunkToIndexedDB([...this.pendingSaveItems])
      this.pendingSaveItems = [] // Clear pending items after saving
    }

    // Only update if session still exists and matches our reference
    if (!this.currentSession || this.currentSession !== session) return

    // Calculate total from all chunks + current items in display
    const allChunks = await tovoDB.getTranscriptionChunks(this.sessionId)
    const totalFromChunks = allChunks.reduce(
      (sum, chunk) => sum + chunk.items.length,
      0
    )
    const totalFromDisplay = this.recentItems.length

    session.totalItems = totalFromChunks + totalFromDisplay
    await tovoDB.saveSession(session)
  }

  /**
   * Save any remaining items in memory to storage (for session end)
   */
  private async saveRemainingItems(): Promise<void> {
    if (!this.currentSession) return

    // Store local reference to avoid race conditions during async operations
    const session = this.currentSession

    // Save any pending items first
    if (this.pendingSaveItems.length > 0) {
      // Double-check session still exists before proceeding
      if (this.currentSession === session) {
        await this.saveChunkToIndexedDB([...this.pendingSaveItems])
        this.pendingSaveItems = []
      }
    }

    // Save current display items
    if (this.recentItems.length > 0) {
      // Double-check session still exists before proceeding
      if (this.currentSession === session) {
        await this.saveChunkToIndexedDB([...this.recentItems])
        this.recentItems = []
      }
    }
  }

  /**
   * Save chunk to IndexedDB
   */
  private async saveChunkToIndexedDB(
    items: TranscriptionItem[]
  ): Promise<void> {
    if (items.length === 0 || !this.currentSession) return

    // Store local reference to avoid race conditions
    const session = this.currentSession

    const firstItem = items[0]
    const lastItem = items[items.length - 1]

    if (!firstItem || !lastItem) return

    const chunk: TranscriptionChunk = {
      id: `${this.sessionId}-chunk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      startTime: firstItem.timestamp,
      endTime: lastItem.timestamp,
      items: items,
      chunkIndex: session.currentChunk++,
    }

    await tovoDB.saveTranscriptionChunk(chunk)

    // Only update session if it still exists and matches our local reference
    if (this.currentSession && this.currentSession === session) {
      // Calculate accurate total count from all chunks
      const allChunks = await tovoDB.getTranscriptionChunks(this.sessionId)
      const totalFromChunks = allChunks.reduce(
        (sum, chunk) => sum + chunk.items.length,
        0
      )
      session.totalItems = totalFromChunks
      await tovoDB.saveSession(session)
    }
  }

  /**
   * End session and save everything
   */
  async endSession(): Promise<void> {
    try {
      // Store local reference to session to avoid race conditions
      const session = this.currentSession

      // Always save any remaining items, regardless of how few there are
      if (this.pendingSaveItems.length > 0 || this.recentItems.length > 0) {
        await this.saveRemainingItems()
      }

      // Update session end time only if session still exists and matches our reference
      if (session && this.currentSession === session) {
        session.endTime = Date.now()
        await tovoDB.saveSession(session)
      }
    } catch (error) {
      console.error("Error during session ending:", error)
    } finally {
      // Always clear all state after saving to prevent leakage to next session
      this.recentItems = []
      this.pendingSaveItems = []
      this.itemsSinceLastSave = 0
      this.currentSession = null
    }
  }

  /**
   * Clear all session data
   */
  async clearSession(): Promise<void> {
    try {
      // If session was created but never had content, delete it from IndexedDB
      if (this.currentSession && this.currentSession.totalItems === 0) {
        await tovoDB.deleteSession(this.sessionId)
      }
    } catch (error) {
      console.error("Error during session clearing:", error)
    } finally {
      // Always clear state regardless of errors
      this.recentItems = []
      this.pendingSaveItems = []
      this.itemsSinceLastSave = 0
      this.currentSession = null
    }
  }
}

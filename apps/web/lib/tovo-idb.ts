import { type DBSchema, type IDBPDatabase, openDB } from "idb"
import { modelLogger } from "./logger"
import type {
  SessionHistory,
  TranscriptionItem,
} from "./transcription/transcription-history-manager"

// Database schema for Tovo app data
interface TovoDB extends DBSchema {
  models: {
    key: string
    value: {
      url: string
      data: Uint8Array
      timestamp: number
      size: number
    }
    indexes: {
      timestamp: number
    }
  }
  sessions: {
    key: string
    value: SessionHistory
    indexes: {
      startTime: number
    }
  }
  transcriptionChunks: {
    key: string
    value: TranscriptionChunk
    indexes: {
      sessionId: string
      startTime: number
    }
  }
  aiResponses: {
    key: string
    value: AIResponseItem
    indexes: {
      sessionId: string
      timestamp: number
    }
  }
}

// Renamed session chunk to transcription chunk for clarity
export interface TranscriptionChunk {
  id: string
  sessionId: string
  startTime: number
  endTime: number
  items: TranscriptionItem[]
  chunkIndex: number
}

// AI Response item for storage
export interface AIResponseItem {
  id: string
  sessionId: string
  content: string
  timestamp: number
  sessionType?: string
}

const DB_NAME = "tovo-indexeddb"
const DB_VERSION = 2
const MODELS_STORE_NAME = "models"
const SESSIONS_STORE_NAME = "sessions"
const TRANSCRIPTION_CHUNKS_STORE_NAME = "transcriptionChunks"
const AI_RESPONSES_STORE_NAME = "aiResponses"

class TovoIndexedDB {
  private db: IDBPDatabase<TovoDB> | null = null
  private dbPromise: Promise<IDBPDatabase<TovoDB>> | null = null

  private async getDB(): Promise<IDBPDatabase<TovoDB>> {
    if (this.db) {
      return this.db
    }

    if (!this.dbPromise) {
      // IMPT: be aware of versioning issues when deploying updates, use a migration strategy if needed
      this.dbPromise = openDB<TovoDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create models store
          if (!db.objectStoreNames.contains(MODELS_STORE_NAME)) {
            const store = db.createObjectStore(MODELS_STORE_NAME, {
              keyPath: "url",
            })
            store.createIndex("timestamp", "timestamp")
            modelLogger.info("Created IndexedDB models store", {
              dbName: DB_NAME,
              version: DB_VERSION,
            })
          }

          // Create sessions store
          if (!db.objectStoreNames.contains(SESSIONS_STORE_NAME)) {
            const sessionsStore = db.createObjectStore(SESSIONS_STORE_NAME, {
              keyPath: "id",
            })
            sessionsStore.createIndex("startTime", "startTime")
            modelLogger.info("Created sessions store")
          }

          // Create transcription chunks store
          if (!db.objectStoreNames.contains(TRANSCRIPTION_CHUNKS_STORE_NAME)) {
            const chunksStore = db.createObjectStore(
              TRANSCRIPTION_CHUNKS_STORE_NAME,
              {
                keyPath: "id",
              }
            )
            chunksStore.createIndex("sessionId", "sessionId")
            chunksStore.createIndex("startTime", "startTime")
            modelLogger.info("Created transcriptionChunks store")
          }

          // Create AI responses store
          if (!db.objectStoreNames.contains(AI_RESPONSES_STORE_NAME)) {
            const aiResponsesStore = db.createObjectStore(
              AI_RESPONSES_STORE_NAME,
              {
                keyPath: "id",
              }
            )
            aiResponsesStore.createIndex("sessionId", "sessionId")
            aiResponsesStore.createIndex("timestamp", "timestamp")
            modelLogger.info("Created aiResponses store")
          }
        },
      })
    }

    this.db = await this.dbPromise
    return this.db
  }

  async hasModel(url: string): Promise<boolean> {
    try {
      const db = await this.getDB()
      const model = await db.get(MODELS_STORE_NAME, url)
      const exists = !!model
      return exists
    } catch (error) {
      modelLogger.error("Error checking model existence", { url, error })
      return false
    }
  }

  async getModel(url: string): Promise<Uint8Array | null> {
    try {
      const db = await this.getDB()
      const model = await db.get(MODELS_STORE_NAME, url)

      if (model) {
        modelLogger.info(`Retrieved model from cache: ${url}`, {
          size: model.data.length,
          timestamp: new Date(model.timestamp),
        })
        return model.data
      }

      modelLogger.debug(`Model not found in cache: ${url}`)
      return null
    } catch (error) {
      modelLogger.error("Error retrieving model from IndexedDB", {
        url,
        error,
      })
      return null
    }
  }

  async storeModel(url: string, data: Uint8Array): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.put(MODELS_STORE_NAME, {
        url,
        data,
        timestamp: Date.now(),
        size: data.length,
      })

      modelLogger.info(`Stored model in cache: ${url}`, {
        size: data.length,
      })
      return true
    } catch (error) {
      modelLogger.error("Error storing model in IndexedDB", { url, error })
      return false
    }
  }

  async deleteModel(url: string): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.delete(MODELS_STORE_NAME, url)

      modelLogger.info(`Deleted model from cache: ${url}`)
      return true
    } catch (error) {
      modelLogger.error("Error deleting model from IndexedDB", { url, error })
      return false
    }
  }

  async clearAll(): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.clear(MODELS_STORE_NAME)

      modelLogger.info("Cleared all models from cache")
      return true
    } catch (error) {
      modelLogger.error("Error clearing all models from IndexedDB", { error })
      return false
    }
  }

  async clearAllModels(): Promise<void> {
    await this.clearAll()
  }

  async listModels(): Promise<
    Array<{ url: string; size: number; timestamp: number }>
  > {
    try {
      const db = await this.getDB()
      const models = await db.getAll(MODELS_STORE_NAME)
      return models.map((model) => ({
        url: model.url,
        size: model.size,
        timestamp: model.timestamp,
      }))
    } catch (error) {
      modelLogger.error("Error listing models", { error })
      return []
    }
  }

  async getStorageInfo(): Promise<{
    quota?: number
    usage?: number
    models: Array<{ url: string; size: number; timestamp: number }>
  }> {
    try {
      const [storageEstimate, db] = await Promise.all([
        navigator.storage?.estimate?.(),
        this.getDB(),
      ])

      const models = await db.getAll(MODELS_STORE_NAME)
      const modelInfo = models.map((model) => ({
        url: model.url,
        size: model.size,
        timestamp: model.timestamp,
      }))

      return {
        quota: storageEstimate?.quota,
        usage: storageEstimate?.usage,
        models: modelInfo,
      }
    } catch (error) {
      modelLogger.error("Error getting storage info", { error })
      return { models: [] }
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.dbPromise = null
      modelLogger.debug("Closed IndexedDB connection")
    }
  }

  // Session management methods
  async saveSession(session: SessionHistory): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.put(SESSIONS_STORE_NAME, session)
      modelLogger.info(`Saved session: ${session.id}`)
      return true
    } catch (error) {
      modelLogger.error("Error saving session", {
        sessionId: session.id,
        error,
      })
      return false
    }
  }

  async getSession(sessionId: string): Promise<SessionHistory | null> {
    try {
      const db = await this.getDB()
      const session = await db.get(SESSIONS_STORE_NAME, sessionId)
      return session || null
    } catch (error) {
      modelLogger.error("Error getting session", { sessionId, error })
      return null
    }
  }

  async getTranscriptionChunks(
    sessionId: string
  ): Promise<TranscriptionChunk[]> {
    try {
      const db = await this.getDB()
      const chunks = await db.getAllFromIndex(
        TRANSCRIPTION_CHUNKS_STORE_NAME,
        "sessionId",
        sessionId
      )
      return chunks.sort((a, b) => a.chunkIndex - b.chunkIndex) // Sort by chunk index
    } catch (error) {
      modelLogger.error("Error getting session chunks", { sessionId, error })
      return []
    }
  }

  async saveTranscriptionChunk(chunk: TranscriptionChunk): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.put(TRANSCRIPTION_CHUNKS_STORE_NAME, chunk)
      modelLogger.debug(`Saved chunk: ${chunk.id}`, {
        itemCount: chunk.items.length,
      })
      return true
    } catch (error) {
      modelLogger.error("Error saving session chunk", {
        chunkId: chunk.id,
        error,
      })
      return false
    }
  }

  async findChunkBeforeTimestamp(
    sessionId: string,
    timestamp: number
  ): Promise<TranscriptionChunk | null> {
    try {
      const chunks = await this.getTranscriptionChunks(sessionId)

      // Find the chunk that contains items before the timestamp
      for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i]
        if (chunk && chunk.startTime < timestamp) {
          return chunk
        }
      }

      return null
    } catch (error) {
      modelLogger.error("Error finding chunk before timestamp", {
        sessionId,
        timestamp,
        error,
      })
      return null
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const db = await this.getDB()
      const tx = db.transaction(
        [
          SESSIONS_STORE_NAME,
          TRANSCRIPTION_CHUNKS_STORE_NAME,
          AI_RESPONSES_STORE_NAME,
        ],
        "readwrite"
      )

      // Delete session
      await tx.objectStore(SESSIONS_STORE_NAME).delete(sessionId)

      // Delete all chunks for this session
      const chunks = await tx
        .objectStore(TRANSCRIPTION_CHUNKS_STORE_NAME)
        .index("sessionId")
        .getAllKeys(sessionId)
      for (const chunkId of chunks) {
        await tx.objectStore(TRANSCRIPTION_CHUNKS_STORE_NAME).delete(chunkId)
      }

      // Delete all AI responses for this session
      const aiResponses = await tx
        .objectStore(AI_RESPONSES_STORE_NAME)
        .index("sessionId")
        .getAllKeys(sessionId)
      for (const responseId of aiResponses) {
        await tx.objectStore(AI_RESPONSES_STORE_NAME).delete(responseId)
      }

      await tx.done
      modelLogger.info(
        `Deleted session, chunks, and AI responses: ${sessionId}`
      )
      return true
    } catch (error) {
      modelLogger.error("Error deleting session", { sessionId, error })
      return false
    }
  }

  async listSessions(): Promise<SessionHistory[]> {
    try {
      const db = await this.getDB()
      const sessions = await db.getAllFromIndex(
        SESSIONS_STORE_NAME,
        "startTime"
      )
      return sessions.sort((a, b) => b.startTime - a.startTime) // Most recent first
    } catch (error) {
      modelLogger.error("Error listing sessions", { error })
      return []
    }
  }

  async cleanupEmptySessions(): Promise<void> {
    try {
      const sessions = await this.listSessions()
      const emptySessions = sessions.filter(
        (session) => session.totalItems === 0
      )

      for (const session of emptySessions) {
        await this.deleteSession(session.id)
        modelLogger.info(`Cleaned up empty session: ${session.id}`)
      }
    } catch (error) {
      modelLogger.error("Error cleaning up empty sessions", { error })
    }
  }

  async cleanupEmptySessionsExcept(excludeSessionId?: string): Promise<void> {
    try {
      const sessions = await this.listSessions()
      const emptySessions = sessions.filter(
        (session) => session.totalItems === 0 && session.id !== excludeSessionId
      )

      for (const session of emptySessions) {
        await this.deleteSession(session.id)
        modelLogger.info(`Cleaned up empty session: ${session.id}`)
      }
    } catch (error) {
      modelLogger.error("Error cleaning up empty sessions", { error })
    }
  }

  async getSessionHistoryStorageSize(): Promise<number> {
    try {
      const db = await this.getDB()
      let totalSize = 0

      // Get size of all sessions
      const sessions = await db.getAll(SESSIONS_STORE_NAME)
      totalSize += JSON.stringify(sessions).length

      // Get size of all transcription chunks
      const chunks = await db.getAll(TRANSCRIPTION_CHUNKS_STORE_NAME)
      totalSize += JSON.stringify(chunks).length

      // Get size of all AI responses
      const aiResponses = await db.getAll(AI_RESPONSES_STORE_NAME)
      totalSize += JSON.stringify(aiResponses).length

      return totalSize
    } catch (error) {
      modelLogger.error("Error calculating session history storage size", {
        error,
      })
      return 0
    }
  }

  async clearAllSessionHistory(): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.clear(SESSIONS_STORE_NAME)
      await db.clear(TRANSCRIPTION_CHUNKS_STORE_NAME)
      await db.clear(AI_RESPONSES_STORE_NAME)

      modelLogger.info("Cleared all session history")
      return true
    } catch (error) {
      modelLogger.error("Error clearing session history", { error })
      return false
    }
  }

  // AI Response methods
  async saveAIResponse(aiResponse: AIResponseItem): Promise<void> {
    try {
      const db = await this.getDB()
      await db.put(AI_RESPONSES_STORE_NAME, aiResponse)
    } catch (error) {
      modelLogger.error("Error saving AI response", {
        error,
        responseId: aiResponse.id,
      })
      throw error
    }
  }

  async getAIResponsesBySession(sessionId: string): Promise<AIResponseItem[]> {
    try {
      const db = await this.getDB()
      const aiResponses = await db.getAllFromIndex(
        AI_RESPONSES_STORE_NAME,
        "sessionId",
        sessionId
      )
      return aiResponses.sort((a, b) => a.timestamp - b.timestamp)
    } catch (error) {
      modelLogger.error("Error loading AI responses for session", {
        error,
        sessionId,
      })
      return []
    }
  }

  async deleteAIResponsesBySession(sessionId: string): Promise<void> {
    try {
      const db = await this.getDB()
      const tx = db.transaction(AI_RESPONSES_STORE_NAME, "readwrite")
      const index = tx.store.index("sessionId")
      const aiResponses = await index.getAll(sessionId)

      for (const response of aiResponses) {
        await tx.store.delete(response.id)
      }

      await tx.done
    } catch (error) {
      modelLogger.error("Error deleting AI responses for session", {
        error,
        sessionId,
      })
      throw error
    }
  }
}

// Export singleton instance
export const tovoDB = new TovoIndexedDB()

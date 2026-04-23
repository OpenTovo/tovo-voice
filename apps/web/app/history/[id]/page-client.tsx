"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { ArrowLeft, Bot, Clock, MessageSquare, Mic } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { AIResponseMarkdown } from "@/components/ai/ai-response-markdown"
import { tovoDB } from "@/lib/tovo-idb"
import type { SessionHistory } from "@/lib/transcription/transcription-history-manager"

interface HistoryItem {
  id: string
  type: "transcription" | "ai_response"
  content: string
  timestamp: number
  speaker?: string
}

function formatDuration(startTime: number, endTime?: number) {
  if (!endTime) return "In progress..."

  const duration = endTime - startTime
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)

  if (minutes === 0) {
    return `${seconds}s`
  }
  return `${minutes}m ${seconds}s`
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function SessionDetailsPageClient() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionHistory | null>(null)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncScroll, setSyncScroll] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")

  const transcriptionRef = useRef<HTMLDivElement>(null)
  const aiResponseRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  const loadSessionDetails = useCallback(async () => {
    try {
      const sessionData = await tovoDB.getSession(sessionId)
      if (!sessionData) {
        router.push("/history")
        return
      }
      setSession(sessionData)
      setEditTitle(sessionData.title || "")

      const chunks = await tovoDB.getTranscriptionChunks(sessionId)
      const aiResponses = await tovoDB.getAIResponsesBySession(sessionId)
      const items: HistoryItem[] = []

      for (const chunk of chunks) {
        for (const item of chunk.items) {
          items.push({
            id: item.id,
            type: "transcription",
            content: item.text,
            timestamp: item.timestamp,
            speaker: item.speaker,
          })
        }
      }

      for (const response of aiResponses) {
        items.push({
          id: response.id,
          type: "ai_response",
          content: response.content,
          timestamp: response.timestamp,
        })
      }

      items.sort((a, b) => a.timestamp - b.timestamp)
      setHistoryItems(items)
    } catch (error) {
      console.error("Error loading session details:", error)
      router.push("/history")
    } finally {
      setLoading(false)
    }
  }, [sessionId, router])

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails()
    }
  }, [sessionId, loadSessionDetails])

  const handleScroll = (
    source: "transcription" | "ai",
    event: React.UIEvent<HTMLDivElement>
  ) => {
    if (!syncScroll || isScrolling.current) return

    isScrolling.current = true
    const sourceElement = event.currentTarget
    const targetElement =
      source === "transcription"
        ? aiResponseRef.current
        : transcriptionRef.current

    if (targetElement) {
      const scrollPercentage =
        sourceElement.scrollTop /
        (sourceElement.scrollHeight - sourceElement.clientHeight)
      const targetScrollTop =
        scrollPercentage *
        (targetElement.scrollHeight - targetElement.clientHeight)
      targetElement.scrollTop = targetScrollTop
    }

    setTimeout(() => {
      isScrolling.current = false
    }, 50)
  }

  const saveTitle = useCallback(async () => {
    if (!session || !editTitle.trim()) {
      setIsEditingTitle(false)
      setEditTitle(session?.title || "")
      return
    }

    try {
      const updatedSession = { ...session, title: editTitle.trim() }
      await tovoDB.saveSession(updatedSession)
      setSession(updatedSession)
      setIsEditingTitle(false)
    } catch (error) {
      console.error("Error saving session title:", error)
      setEditTitle(session.title || "")
      setIsEditingTitle(false)
    }
  }, [session, editTitle])

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveTitle()
    } else if (e.key === "Escape") {
      setIsEditingTitle(false)
      setEditTitle(session?.title || "")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="flex-shrink-0 p-4 pb-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 pb-4">
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const transcriptionItems = historyItems.filter(
    (item) => item.type === "transcription"
  )
  const aiResponseItems = historyItems.filter(
    (item) => item.type === "ai_response"
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b p-4">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/history")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-bold"
                autoFocus
              />
            ) : (
              <h1
                className="cursor-pointer truncate text-xl font-bold transition-colors hover:text-blue-600"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
              >
                {session.title ||
                  `Session from ${new Date(session.startTime).toLocaleDateString()}`}
              </h1>
            )}
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm sm:gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(session.startTime, session.endTime)}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {session.totalItems}
              </div>
              <div className="flex items-center gap-1">
                <Mic className="h-3 w-3" />
                {transcriptionItems.length}
              </div>
              <div className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {aiResponseItems.length}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Switch checked={syncScroll} onCheckedChange={setSyncScroll} />
            <span className="text-muted-foreground text-xs">Sync scroll</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
          <div className="flex h-2/5 flex-col">
            <Card className="flex h-full flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mic className="h-4 w-4" />
                  Transcriptions
                  <Badge variant="secondary" className="text-xs">
                    {transcriptionItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div
                  ref={transcriptionRef}
                  className="h-full overflow-y-auto px-6 pb-6"
                  onScroll={(e) => handleScroll("transcription", e)}
                >
                  {transcriptionItems.length === 0 ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center text-center">
                      <div>
                        <Mic className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        <p>No transcriptions in this session</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transcriptionItems.map((item, index) => (
                        <div
                          key={item.id + String(index)}
                          className="border-border/20 border-b pb-3 last:border-b-0"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-muted-foreground text-xs">
                              {formatTime(item.timestamp)}
                            </div>
                            {item.speaker && (
                              <Badge variant="outline" className="text-xs">
                                {item.speaker}
                              </Badge>
                            )}
                          </div>
                          <p className="text-base leading-relaxed sm:text-sm">
                            {item.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex h-3/5 flex-col">
            <Card className="flex h-full flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4" />
                  AI Responses
                  <Badge variant="secondary" className="text-xs">
                    {aiResponseItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div
                  ref={aiResponseRef}
                  className="h-full overflow-y-auto px-6 pb-6"
                  onScroll={(e) => handleScroll("ai", e)}
                >
                  {aiResponseItems.length === 0 ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center text-center">
                      <div>
                        <Bot className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        <p>No AI responses in this session</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiResponseItems.map((item, index) => (
                        <div
                          key={item.id + String(index)}
                          className="border-border/20 border-b pb-3 last:border-b-0"
                        >
                          <div className="text-muted-foreground mb-2 text-xs">
                            {formatTime(item.timestamp)}
                          </div>
                          <AIResponseMarkdown className="text-base leading-relaxed sm:text-sm">
                            {item.content}
                          </AIResponseMarkdown>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

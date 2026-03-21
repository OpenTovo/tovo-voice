"use client"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useSetAtom } from "jotai"
import { Clock, MessageSquare, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth"
import { useRouteGuard } from "@/hooks/use-route-guard"
import { showConfirmDialogAtom } from "@/lib/atoms"
import { tovoDB } from "@/lib/tovo-idb"
import type { SessionHistory } from "@/lib/transcription/transcription-history-manager"

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

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

interface SessionItemProps {
  session: SessionHistory
  onDelete: (sessionId: string) => Promise<void>
  onView: (sessionId: string) => void
}

function SessionItem({ session, onDelete, onView }: SessionItemProps) {
  const showConfirmDialog = useSetAtom(showConfirmDialogAtom)

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: "Delete Session",
      message:
        "Are you sure you want to delete this session? Note: the data is only on this device, deleting it will not be able to recover.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (confirmed) {
      await onDelete(session.id)
    }
  }

  return (
    <Card
      className="hover:bg-accent/50 mb-3 cursor-pointer transition-colors"
      onClick={() => onView(session.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="truncate font-medium">
                {session.title || `Session ${formatDate(session.startTime)}`}
              </h3>
            </div>

            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(session.startTime, session.endTime)}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {session.totalItems} messages
              </div>
            </div>

            <div className="text-muted-foreground mt-1 text-xs">
              {formatDate(session.startTime)}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className="text-destructive hover:text-destructive ml-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HistoryPage() {
  const { user } = useAuth()
  const { isReady } = useRouteGuard({ requireAuth: true })
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionHistory[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    try {
      // Clean up empty sessions first
      await tovoDB.cleanupEmptySessions()

      const sessionList = await tovoDB.listSessions()
      setSessions(sessionList)
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await tovoDB.deleteSession(sessionId)
      setSessions(sessions.filter((s) => s.id !== sessionId))
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  const handleViewSession = (sessionId: string) => {
    router.push(`/history/${sessionId}`)
  }

  if (!isReady) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <div className="flex-shrink-0 p-4 pb-2">
          <h1 className="text-2xl font-bold">History</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 md:px-8">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // useRouteGuard ensures user is authenticated when isReady is true
  if (!user) {
    return null
  }

  return (
    <div className="flex h-full flex-col">
      <div className="hidden flex-shrink-0 p-4 pb-2 md:block">
        <h1 className="text-2xl font-bold">Session History</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 sm:px-6 md:px-8 md:pt-0">
        {sessionsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <h3 className="mb-2 font-medium">No sessions yet</h3>
              <p className="text-sm">
                Start your first transcription session to see it here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onDelete={handleDeleteSession}
                onView={handleViewSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

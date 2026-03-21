"use client"

import { Button } from "@workspace/ui/components/button"
import { RefreshCw } from "lucide-react"
import { isPWAMode, smartReload } from "@/lib/utils/pwa"

export function PWARefreshButton() {
  const handleRefresh = async () => {
    await smartReload()
  }

  // Only show in PWA mode
  if (!isPWAMode()) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      className="h-8 w-8 p-0"
      title="Refresh app"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  )
}

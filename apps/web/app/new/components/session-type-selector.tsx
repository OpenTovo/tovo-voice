"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useAtom } from "jotai"
import { sessionTypeAtom } from "@/lib/atoms/session"
import { SESSION_TYPE_CONFIG, SessionType } from "@/lib/llm/session-types"

export function SessionTypeSelector() {
  const [sessionType, setSessionType] = useAtom(sessionTypeAtom)

  const currentConfig =
    SESSION_TYPE_CONFIG[sessionType] ?? SESSION_TYPE_CONFIG[SessionType.GENERAL]

  const handleTypeChange = (newType: string) => {
    setSessionType(newType as SessionType)
  }

  return (
    <Select value={sessionType} onValueChange={handleTypeChange}>
      <SelectTrigger className="h-11! w-fit">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-base">{currentConfig.icon}</span>
            <span className="text-sm">{currentConfig.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SESSION_TYPE_CONFIG).map(([type, config]) => (
          <SelectItem key={type} value={type}>
            <div className="w-45 flex items-center gap-3">
              <span className="-mt-[2px] text-base">{config.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{config.name}</div>
                <div className="text-muted-foreground text-xs">
                  {config.description}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

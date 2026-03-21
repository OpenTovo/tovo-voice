"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { ChevronRight, Laptop, Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeManagement() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering component after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const getThemeDisplayName = () => {
    if (!mounted) return "Loading..."
    switch (theme) {
      case "light":
        return "Light mode"
      case "dark":
        return "Dark mode"
      case "system":
        return "System preference"
      default:
        return "System preference"
    }
  }

  const getThemeIcon = () => {
    if (!mounted) return <Palette className="h-5 w-5" />
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />
      case "dark":
        return <Moon className="h-5 w-5" />
      case "system":
        return <Laptop className="h-5 w-5" />
      default:
        return <Palette className="h-5 w-5" />
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {getThemeIcon()}
            <div className="text-left">
              <div className="font-medium">Appearance</div>
              <div className="text-muted-foreground text-sm">
                {getThemeDisplayName()}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-md px-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>
            Choose how Tovo looks to you. Select a theme preference or sync with
            your system settings.
          </DialogDescription>
        </DialogHeader>
        {mounted && (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="flex h-auto flex-col items-center justify-center p-3"
            >
              <Sun className="mb-1 h-5 w-5" />
              <span className="text-xs">Light</span>
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="flex h-auto flex-col items-center justify-center p-3"
            >
              <Moon className="mb-1 h-5 w-5" />
              <span className="text-xs">Dark</span>
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
              className="flex h-auto flex-col items-center justify-center p-3"
            >
              <Laptop className="mb-1 h-5 w-5" />
              <span className="text-xs">System</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

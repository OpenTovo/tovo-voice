"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  ChevronRight,
  Download,
  Home,
  Monitor,
  MoreVertical,
  Share,
  Smartphone,
} from "lucide-react"
import { useEffect, useState } from "react"
import { getDeviceType, isPWAInstalled } from "@/lib/utils/pwa"

interface AddToHomeScreenProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddToHomeScreen({ open, onOpenChange }: AddToHomeScreenProps) {
  const [defaultTab, setDefaultTab] = useState<string>("desktop")
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)

  // Use external open state if provided, otherwise use internal
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  useEffect(() => {
    const deviceType = getDeviceType()
    setDefaultTab(deviceType)
    setIsAlreadyInstalled(isPWAInstalled())
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Home className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Add to Home Screen</div>
              <div className="text-muted-foreground text-sm">
                {isAlreadyInstalled
                  ? "Already added to home screen"
                  : "Add for offline access"}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Add to Home Screen
          </DialogTitle>
        </DialogHeader>
        <DialogContentBody
          isAlreadyInstalled={isAlreadyInstalled}
          defaultTab={defaultTab}
        />
      </DialogContent>
    </Dialog>
  )
}

function DialogContentBody({
  isAlreadyInstalled,
  defaultTab,
}: {
  isAlreadyInstalled: boolean
  defaultTab: string
}) {
  if (isAlreadyInstalled) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-2xl text-green-600 dark:text-green-400">✅</div>
        <div>
          <h3 className="text-lg font-semibold">Already Added!</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            You're already using Tovo from your home screen. You can access it
            offline and it works like a native app.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Add Tovo to your home screen for offline access and a native app
        experience.
      </p>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="desktop" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Desktop
          </TabsTrigger>
          <TabsTrigger value="android" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Android
          </TabsTrigger>
          <TabsTrigger value="ios" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            iOS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ios" className="space-y-4">
          <div className="space-y-4">
            <div className="rounded-lg border border-red-500/30 bg-red-50 p-4 dark:bg-red-950/20">
              <h4 className="mb-2 font-semibold text-red-700 dark:text-red-300">
                ⚠️ iOS Not Currently Supported
              </h4>
              <p className="text-sm text-red-600 dark:text-red-200">
                Unfortunately, Tovo doesn't work on iOS devices due to Safari's
                memory limitations. Our app requires at least 650MB of memory to
                run the transcription and AI models, but iOS Safari is limited
                to 200-400MB depending on the device.
              </p>
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-200">
                Please use a desktop computer or Android device instead.
              </p>
            </div>

            <div className="opacity-60">
              <h4 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                Installation steps (if iOS support becomes available in the
                future):
              </h4>
              <ol className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-medium text-white">
                    1
                  </span>
                  <span>
                    Open <strong>Safari browser</strong> and navigate to Tovo
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-medium text-white">
                    2
                  </span>
                  <div className="space-y-2">
                    <span>
                      Tap the <strong>Share button</strong> at the bottom of the
                      screen
                    </span>
                    <div className="bg-muted flex items-center gap-2 rounded-md p-2">
                      <Share className="h-4 w-4 text-gray-400" />
                      <span className="text-xs">Share icon</span>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-medium text-white">
                    3
                  </span>
                  <span>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-medium text-white">
                    4
                  </span>
                  <span>
                    Confirm by tapping <strong>"Add"</strong> in the top right
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="android" className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold">For Android (Chrome):</h4>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  1
                </span>
                <span>
                  Open <strong>Chrome browser</strong> and navigate to Tovo
                </span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  2
                </span>
                <div className="space-y-2">
                  <span>
                    Look for the <strong>"Add to Home"</strong> banner at the
                    bottom, or tap the menu button
                  </span>
                  <div className="bg-muted flex items-center gap-2 rounded-md p-2">
                    <MoreVertical className="h-4 w-4" />
                    <span className="text-xs">Menu (three dots)</span>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  3
                </span>
                <span>
                  Select <strong>"Add to Home screen"</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  4
                </span>
                <span>Confirm to add to home screen</span>
              </li>
            </ol>
            <div className="rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950/20">
              <p className="text-green-800 dark:text-green-200">
                💡 <strong>Tip:</strong> Chrome may show an automatic "Add to
                Home" banner. Tap "Add" when it appears!
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="desktop" className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold">
              For Desktop (Chrome, Edge, Safari):
            </h4>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  1
                </span>
                <span>Open your browser and navigate to Tovo</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  2
                </span>
                <div className="space-y-2">
                  <span>
                    Look for the <strong>add to home icon</strong> in the
                    address bar, or use the browser menu
                  </span>
                  <div className="bg-muted flex items-center gap-2 rounded-md p-2">
                    <Download className="h-4 w-4" />
                    <span className="text-xs">
                      Add to home icon in address bar
                    </span>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  3
                </span>
                <span>
                  Click <strong>"Add to Home Screen"</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  4
                </span>
                <span>Confirm to add Tovo to your desktop</span>
              </li>
            </ol>
            <div className="rounded-lg bg-purple-50 p-3 text-sm dark:bg-purple-950/20">
              <p className="text-purple-800 dark:text-purple-200">
                💡 <strong>Tip:</strong> You can also drag the URL to your
                desktop to install.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-4">
        <h4 className="mb-2 text-sm font-semibold">
          Benefits of installing as PWA:
        </h4>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          <li>Works offline once cached</li>
          <li>Native app-like experience</li>
          <li>No app download required</li>
          <li>Faster loading and better performance</li>
        </ul>
      </div>
    </div>
  )
}

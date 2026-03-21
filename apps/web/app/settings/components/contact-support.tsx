"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Check, ChevronRight, Copy, Mail } from "lucide-react"
import { useState } from "react"

export function ContactSupport() {
  const [copied, setCopied] = useState(false)
  const supportEmail = "support@tovo.dev"

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = supportEmail
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openEmailClient = () => {
    window.location.href = `mailto:${supportEmail}`
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Mail className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Contact Support</div>
              <div className="text-muted-foreground text-sm">
                Get help or send feedback
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Support
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Need help? Have questions or feedback? We're here to help!
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="font-mono text-sm">{supportEmail}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="h-8"
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <Button onClick={openEmailClient} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Open Email Client
            </Button>
          </div>

          <div className="text-muted-foreground bg-muted/50 rounded-lg p-3 text-xs">
            <p className="font-medium">What to include in your message:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>Description of the issue or question</li>
              <li>Your browser and device information</li>
              <li>Steps to reproduce (if applicable)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

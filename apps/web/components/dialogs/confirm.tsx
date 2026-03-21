"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { useAtom, useSetAtom } from "jotai"
import {
  confirmDialogCancelAtom,
  confirmDialogConfirmAtom,
  confirmDialogDataAtom,
  confirmDialogOpenAtom,
} from "@/lib/atoms/dialog"

export function ConfirmDialog() {
  const [open] = useAtom(confirmDialogOpenAtom)
  const [data] = useAtom(confirmDialogDataAtom)
  const confirmDialog = useSetAtom(confirmDialogConfirmAtom)
  const cancelDialog = useSetAtom(confirmDialogCancelAtom)

  if (!data) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Only handle close events
        if (!newOpen) {
          cancelDialog()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {data.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              cancelDialog()
            }}
          >
            {data.cancelText || "Cancel"}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              confirmDialog()
            }}
            variant={data.variant === "destructive" ? "destructive" : "default"}
          >
            {data.confirmText || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

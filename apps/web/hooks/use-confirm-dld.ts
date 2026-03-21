import { useAtom } from "jotai"
import { useCallback } from "react"
import { showConfirmDialogAtom } from "@/lib/atoms/dialog"

export const useConfirmDownload = () => {
  const [, showConfirmDialogAction] = useAtom(showConfirmDialogAtom)

  // Show confirmation dialog for downloads
  const showConfirmDialog = useCallback(
    async (message: string): Promise<boolean> => {
      try {
        return await showConfirmDialogAction({
          title: "Download Model",
          message,
          confirmText: "Download",
          cancelText: "Cancel",
        })
      } catch (error) {
        console.error("Dialog error:", error)
        return false // Default to cancel on error
      }
    },
    [showConfirmDialogAction]
  )

  return { showConfirmDialog }
}

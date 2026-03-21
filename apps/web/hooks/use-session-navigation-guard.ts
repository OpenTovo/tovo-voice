import { useAtom } from "jotai"
import { useRouter } from "next/navigation"
import { showConfirmDialogAtom } from "@/lib/atoms/dialog"
import { clearSessionDataAtom, isSessionActiveAtom } from "@/lib/atoms/session"

export function useSessionNavigationGuard() {
  const router = useRouter()
  const [isSessionActive] = useAtom(isSessionActiveAtom)
  const [, clearSessionData] = useAtom(clearSessionDataAtom)
  const [, showConfirmDialog] = useAtom(showConfirmDialogAtom)

  const navigateWithGuard = async (path: string) => {
    if (isSessionActive) {
      const confirmed = await showConfirmDialog({
        title: "End Current Session?",
        message:
          "You have an active session. Navigating away will end the current session, and data will be saved. Do you want to continue?",
        confirmText: "End Session",
        cancelText: "Stay Here",
        variant: "destructive",
      })

      if (confirmed) {
        clearSessionData()
        router.push(path)
      }
      // If not confirmed, do nothing (stay on current page)
    } else {
      router.push(path)
    }
  }

  return {
    navigateWithGuard,
    isSessionActive,
  }
}

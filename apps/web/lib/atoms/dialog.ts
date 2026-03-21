import { atom } from "jotai"

// Dialog state management
export interface ConfirmDialogData {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

// Dialog state atoms
export const confirmDialogOpenAtom = atom(false)
export const confirmDialogDataAtom = atom<ConfirmDialogData | null>(null)

// Simple state atom for dialog result
export const confirmDialogResultAtom = atom<
  "pending" | "confirmed" | "cancelled"
>("pending")

// Action atom to show confirm dialog and wait for result
export const showConfirmDialogAtom = atom(
  null,
  async (get, set, data: ConfirmDialogData) => {
    // Reset state
    set(confirmDialogResultAtom, "pending")
    set(confirmDialogDataAtom, data)
    set(confirmDialogOpenAtom, true)

    // Wait for user decision with polling
    return new Promise<boolean>((resolve) => {
      const checkResult = () => {
        const result = get(confirmDialogResultAtom)
        if (result === "confirmed") {
          resolve(true)
        } else if (result === "cancelled") {
          resolve(false)
        } else {
          // Still pending, check again in 100ms
          setTimeout(checkResult, 100)
        }
      }
      checkResult()
    })
  }
)

// Action atoms for dialog responses
export const confirmDialogConfirmAtom = atom(null, (get, set) => {
  set(confirmDialogResultAtom, "confirmed")
  set(confirmDialogOpenAtom, false)
  set(confirmDialogDataAtom, null)
})

export const confirmDialogCancelAtom = atom(null, (get, set) => {
  set(confirmDialogResultAtom, "cancelled")
  set(confirmDialogOpenAtom, false)
  set(confirmDialogDataAtom, null)
})

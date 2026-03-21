import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export type TabType = "new" | "history" | "settings"

// Current active tab
export const currentTabAtom = atom<TabType>("new")

// Side menu expanded/collapsed state (desktop mode)
export const sideMenuExpandedAtom = atomWithStorage<boolean>(
  "tovo-side-menu-expanded",
  true // Default to expanded
)

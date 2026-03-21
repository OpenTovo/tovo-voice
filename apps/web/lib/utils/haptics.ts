/**
 * Haptic feedback utilities for mobile and web platforms
 * Provides vibration and haptic feedback for better UX
 */

// Types for different haptic patterns
export enum HapticType {
  LIGHT = "light",
  MEDIUM = "medium",
  HEAVY = "heavy",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  SELECTION = "selection",
}

// Vibration patterns for different feedback types (in milliseconds)
const VIBRATION_PATTERNS = {
  [HapticType.LIGHT]: [10],
  [HapticType.MEDIUM]: [20],
  [HapticType.HEAVY]: [30],
  [HapticType.SUCCESS]: [10, 50, 10],
  [HapticType.WARNING]: [20, 100, 20],
  [HapticType.ERROR]: [50, 100, 50],
  [HapticType.SELECTION]: [5],
} as const

/**
 * Trigger haptic feedback with fallback support
 */
export function triggerHaptic(type: HapticType = HapticType.LIGHT): void {
  try {
    // iOS Safari Haptic Feedback (iOS 10+)
    if ("haptics" in navigator && (navigator as any).haptics?.vibrate) {
      switch (type) {
        case HapticType.LIGHT:
        case HapticType.SELECTION:
          ;(navigator as any).haptics.vibrate?.(1)
          break
        case HapticType.MEDIUM:
          ;(navigator as any).haptics.vibrate?.(2)
          break
        case HapticType.HEAVY:
        case HapticType.ERROR:
          ;(navigator as any).haptics.vibrate?.(3)
          break
        case HapticType.SUCCESS:
          ;(navigator as any).haptics.vibrate?.(2)
          break
        case HapticType.WARNING:
          ;(navigator as any).haptics.vibrate?.(2)
          break
      }
      return
    }

    // Web Vibration API (Android Chrome, Firefox, etc.)
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      const pattern = VIBRATION_PATTERNS[type]
      navigator.vibrate(pattern)
      return
    }

    // Gamepad haptic feedback (for controllers connected to desktop)
    if (
      "getGamepads" in navigator &&
      typeof (navigator as any).getGamepads === "function"
    ) {
      const gamepads = (navigator as any).getGamepads()
      for (const gamepad of gamepads) {
        if (gamepad?.vibrationActuator) {
          const intensity =
            type === HapticType.HEAVY
              ? 0.8
              : type === HapticType.MEDIUM
                ? 0.5
                : 0.3
          gamepad.vibrationActuator
            .playEffect("dual-rumble", {
              duration: 100,
              strongMagnitude: intensity,
              weakMagnitude: intensity * 0.5,
            })
            .catch(() => {
              // Ignore gamepad haptic errors
            })
        }
      }
    }

    // Fallback: Audio feedback (very subtle click sound)
    // This provides some feedback even on unsupported devices
    if ("AudioContext" in window || "webkitAudioContext" in window) {
      try {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioCtx()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        )

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch {
        // Ignore audio feedback errors
      }
    }
  } catch (error) {
    // Silently fail if haptics are not supported
    console.debug("Haptic feedback not available:", error)
  }
}

/**
 * Check if haptic feedback is supported on this device
 */
export function isHapticSupported(): boolean {
  return (
    ("haptics" in navigator && (navigator as any).haptics?.vibrate) ||
    ("vibrate" in navigator && typeof navigator.vibrate === "function") ||
    ("getGamepads" in navigator &&
      typeof (navigator as any).getGamepads === "function" &&
      (navigator as any)
        .getGamepads()
        .some((gamepad: any) => gamepad?.vibrationActuator))
  )
}

/**
 * Session-specific haptic patterns for different recording actions
 */
export const TovoHaptics = {
  success: () => triggerHaptic(HapticType.SUCCESS),
  warning: () => triggerHaptic(HapticType.WARNING),
  medium: () => triggerHaptic(HapticType.MEDIUM),
  error: () => triggerHaptic(HapticType.ERROR),
  light: () => triggerHaptic(HapticType.LIGHT),
} as const

/**
 * File size formatting utilities
 */

/**
 * Format file size in MB to a human-readable string
 * @param sizeInMB - Size in megabytes
 * @returns Formatted string (e.g., "1.2 GB" or "512 MB")
 */
export function formatFileSize(sizeInMB: number): string {
  if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(1)} GB`
  }
  return `${sizeInMB.toFixed(1)} MB`
}

/**
 * Format file size in bytes to a human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.2 GB" or "512 MB")
 */
export function formatFileSizeFromBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return formatFileSize(mb)
}

/**
 * Format storage quota in bytes to a human-readable string
 * @param bytes - Storage quota in bytes
 * @returns Formatted string (e.g., "15.5 GB" or "Unknown")
 */
export function formatStorageQuota(bytes?: number): string {
  if (!bytes) return "Unknown"
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(2)} GB`
}

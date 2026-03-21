import { rm, readdir, stat } from "node:fs/promises"
import path from "node:path"

const [, , appDirArg] = process.argv

if (!appDirArg) {
  console.error("Usage: node scripts/prune-cloudflare-assets.mjs <app-dir>")
  process.exit(1)
}

const repoRoot = process.cwd()
const appDir = path.resolve(repoRoot, appDirArg)
const assetDir = path.join(appDir, ".open-next", "assets")
const maxAssetSize = 25 * 1024 * 1024
const excludedTopLevelPrefixes = ["sherpa-onnx-"]

async function removeExcludedTopLevelEntries() {
  const entries = await readdir(assetDir, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) =>
        excludedTopLevelPrefixes.some((prefix) => entry.name.startsWith(prefix))
      )
      .map(async (entry) => {
        const target = path.join(assetDir, entry.name)
        await rm(target, { recursive: true, force: true })
        console.log(`Removed Cloudflare-incompatible asset bundle: ${path.relative(repoRoot, target)}`)
      })
  )
}

async function collectOversizedFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const oversizedFiles = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      oversizedFiles.push(...(await collectOversizedFiles(fullPath)))
      continue
    }

    const fileStats = await stat(fullPath)
    if (fileStats.size > maxAssetSize) {
      oversizedFiles.push({
        path: fullPath,
        size: fileStats.size,
      })
    }
  }

  return oversizedFiles
}

try {
  await removeExcludedTopLevelEntries()

  const oversizedFiles = await collectOversizedFiles(assetDir)
  if (oversizedFiles.length > 0) {
    const formattedFiles = oversizedFiles
      .map(
        (file) =>
          `- ${path.relative(repoRoot, file.path)} (${(file.size / 1024 / 1024).toFixed(1)} MiB)`
      )
      .join("\n")

    throw new Error(
      `Cloudflare asset size limit exceeded after pruning.\n${formattedFiles}`
    )
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
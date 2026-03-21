#!/usr/bin/env node

/**
 * Script to filter WebLLM models by size for iOS compatibility
 *
 * Usage:
 *   node filter-small-models.js [maxSizeMB]
 *
 * Examples:
 *   node filter-small-models.js 800        # Models under 800MB (iOS 1GB - safety margin)
 *   node filter-small-models.js 500        # Very small models for tight constraints
 *   node filter-small-models.js 1200       # Models under 1.2GB
 */

const fs = require("fs")
const path = require("path")

// Default max size (800MB - safe for iOS 1GB limit with margin)
const DEFAULT_MAX_SIZE_MB = 800

function formatSize(mb) {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`
  }
  return `${Math.round(mb)} MB`
}

function extractModelInfo(model) {
  const sizeInMB = model.vram_required_MB
  const name = model.model_id

  // Extract model family and size from name
  const familyMatch = name.match(/^([^-]+(?:-[^-]+)?)/)
  const family = familyMatch ? familyMatch[1] : "Unknown"

  // Extract quantization info
  const quantMatch = name.match(/(q\d+f\d+(_\d+)?)/)
  const quantization = quantMatch ? quantMatch[1] : "unknown"

  // Check if it's instruct tuned
  const isInstruct = name.toLowerCase().includes("instruct")

  // Check if it's low resource
  const isLowResource = model.low_resource_required || false

  return {
    id: name,
    family,
    size: sizeInMB,
    quantization,
    isInstruct,
    isLowResource,
    contextWindow: model.overrides?.context_window_size || "default",
  }
}

function main() {
  const args = process.argv.slice(2)
  const maxSizeMB = args[0] ? parseFloat(args[0]) : DEFAULT_MAX_SIZE_MB

  if (isNaN(maxSizeMB) || maxSizeMB <= 0) {
    console.error("❌ Invalid size limit. Please provide a positive number.")
    process.exit(1)
  }

  console.log(
    `🔍 Filtering WebLLM models smaller than ${formatSize(maxSizeMB)}`
  )
  console.log(`📱 Target: iOS Safari (1GB limit) compatibility\n`)

  // Read and parse the model list
  const modelListPath = path.join(__dirname, "model_list.json")

  if (!fs.existsSync(modelListPath)) {
    console.error("❌ model_list.json not found in the same directory")
    process.exit(1)
  }

  function parseJsonc(text) {
    // Simple but effective JSONC parser
    // Remove all types of comments while preserving string content

    let result = ""
    let inString = false
    let inSingleComment = false
    let inMultiComment = false
    let escaped = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const next = text[i + 1]

      if (escaped) {
        if (inString) result += char
        escaped = false
        continue
      }

      if (char === "\\" && inString) {
        escaped = true
        result += char
        continue
      }

      if (inSingleComment) {
        if (char === "\n") {
          inSingleComment = false
          result += char // Keep the newline
        }
        continue
      }

      if (inMultiComment) {
        if (char === "*" && next === "/") {
          inMultiComment = false
          i++ // Skip the '/'
        }
        continue
      }

      if (char === '"' && !inSingleComment && !inMultiComment) {
        inString = !inString
        result += char
        continue
      }

      if (!inString) {
        if (char === "/" && next === "/") {
          inSingleComment = true
          i++ // Skip the second '/'
          continue
        }

        if (char === "/" && next === "*") {
          inMultiComment = true
          i++ // Skip the '*'
          continue
        }
      }

      result += char
    }

    // Clean up trailing commas and extra whitespace
    result = result.replace(/,(\s*[}\]])/g, "$1").replace(/^\s*\n/gm, "")

    return result
  }

  // ...existing code...

  let models
  try {
    const rawData = fs.readFileSync(modelListPath, "utf8")

    // Parse JSONC format
    const cleanData = parseJsonc(rawData)

    models = JSON.parse(cleanData)
  } catch (error) {
    console.error("❌ Error parsing model_list.json:", error.message)
    console.error(
      "💡 The file might have formatting issues or invalid JSON syntax"
    )

    // Try to provide helpful debugging info
    try {
      const rawData = fs.readFileSync(modelListPath, "utf8")
      const lines = rawData.split("\n")

      if (error.message.includes("position")) {
        const match = error.message.match(/position (\d+)/)
        if (match) {
          const position = parseInt(match[1])
          let currentPos = 0
          let lineNum = 0

          for (let i = 0; i < lines.length; i++) {
            if (currentPos + lines[i].length >= position) {
              lineNum = i + 1
              break
            }
            currentPos += lines[i].length + 1
          }

          console.error(`📍 Error around line ${lineNum}:`)
          const start = Math.max(0, lineNum - 2)
          const end = Math.min(lines.length, lineNum + 2)

          for (let i = start; i < end; i++) {
            const marker = i === lineNum - 1 ? ">>> " : "    "
            console.error(`${marker}${i + 1}: ${lines[i]}`)
          }
        }
      }
    } catch (debugError) {
      // Ignore debug errors
    }

    process.exit(1)
  }

  // Filter and process models
  const smallModels = models
    .filter((model) => {
      // Skip commented out models (they might not have required fields)
      return model.model_id && model.vram_required_MB !== undefined
    })
    .map(extractModelInfo)
    .filter((model) => model.size <= maxSizeMB)
    .sort((a, b) => a.size - b.size) // Sort by size, smallest first

  if (smallModels.length === 0) {
    console.log(`❌ No models found under ${formatSize(maxSizeMB)}`)
    return
  }

  console.log(
    `✅ Found ${smallModels.length} models under ${formatSize(maxSizeMB)}:\n`
  )

  // Group by family for better readability
  const byFamily = {}
  smallModels.forEach((model) => {
    if (!byFamily[model.family]) {
      byFamily[model.family] = []
    }
    byFamily[model.family].push(model)
  })

  // Display results
  Object.entries(byFamily).forEach(([family, familyModels]) => {
    console.log(`📦 ${family} (${familyModels.length} models):`)

    familyModels.forEach((model) => {
      const badges = []
      if (model.isInstruct) badges.push("📝 Instruct")
      if (model.isLowResource) badges.push("📱 Low-Resource")
      if (model.contextWindow !== "default")
        badges.push(`🪟 ${model.contextWindow}ctx`)

      console.log(`  • ${model.id}`)
      console.log(
        `    Size: ${formatSize(model.size)} | Quant: ${model.quantization}`
      )
      if (badges.length > 0) {
        console.log(`    ${badges.join(" | ")}`)
      }
      console.log("")
    })
  })

  // Summary stats
  console.log(`📊 Summary:`)
  console.log(`  • Total models: ${smallModels.length}`)
  console.log(
    `  • Size range: ${formatSize(smallModels[0].size)} - ${formatSize(smallModels[smallModels.length - 1].size)}`
  )
  console.log(
    `  • Instruct models: ${smallModels.filter((m) => m.isInstruct).length}`
  )
  console.log(
    `  • Low-resource models: ${smallModels.filter((m) => m.isLowResource).length}`
  )

  // Suggestions for iOS
  console.log(`\n💡 For iOS (1GB limit) recommendations:`)
  const iosRecommended = smallModels.filter(
    (m) => m.size <= 600 && m.isInstruct
  ) // Extra safe margin
  if (iosRecommended.length > 0) {
    console.log(`  🎯 Extra safe (≤600MB): ${iosRecommended.length} models`)
    iosRecommended.slice(0, 3).forEach((model) => {
      console.log(`    - ${model.id} (${formatSize(model.size)})`)
    })
  }

  // Generate code snippet for adding to WEBLLM_MODELS
  console.log(`\n🔧 To add these models to your WEBLLM_MODELS config:`)
  console.log(`\n// Add to lib/llm/models.ts:`)
  smallModels.slice(0, 5).forEach((model) => {
    const configKey = model.id
    const displayName = model.id
      .replace(/-MLC$/, "")
      .replace(/-/g, " ")
      .replace(/q\d+f\d+(_\d+)?/, "")
      .trim()

    console.log(`"${configKey}": {`)
    console.log(`  name: "${displayName}",`)
    console.log(
      `  description: "${model.family} model (${formatSize(model.size)}, ${model.quantization})",`
    )
    console.log(`  config: prebuiltAppConfig.model_list.find(`)
    console.log(`    (m) => m.model_id === "${configKey}"`)
    console.log(`  ),`)
    console.log(`},`)
    console.log("")
  })
}

if (require.main === module) {
  main()
}

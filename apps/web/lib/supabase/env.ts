import { getCloudflareContext } from "@opennextjs/cloudflare"

type SupabaseEnv = {
  url: string
  anonKey: string
}

const SUPABASE_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL"
const SUPABASE_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY"

type CloudflareRuntimeEnv = Partial<Record<string, unknown>>

function getProcessEnvValue(key: string) {
  const value = process.env[key]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

async function getCloudflareRuntimeEnv(): Promise<CloudflareRuntimeEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    return env as CloudflareRuntimeEnv
  } catch {
    return {}
  }
}

function getStringBinding(env: CloudflareRuntimeEnv, key: string) {
  const value = env[key]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function getSupabaseEnv(): Promise<SupabaseEnv> {
  const runtimeEnv = await getCloudflareRuntimeEnv()

  const url =
    getStringBinding(runtimeEnv, SUPABASE_URL_KEY) ??
    getProcessEnvValue(SUPABASE_URL_KEY)
  const anonKey =
    getStringBinding(runtimeEnv, SUPABASE_ANON_KEY) ??
    getProcessEnvValue(SUPABASE_ANON_KEY)

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Cloudflare runtime Variables/Secrets, and also in Workers Builds environment variables for browser bundles."
    )
  }

  return { url, anonKey }
}

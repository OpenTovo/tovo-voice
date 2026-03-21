"use client"

import dynamic from "next/dynamic"

const SettingsPageClient = dynamic(() => import("./page-client"), {
  ssr: false,
})

export default function SettingsPageLoader() {
  return <SettingsPageClient />
}

"use client"

import dynamic from "next/dynamic"

const SessionDetailsPageClient = dynamic(() => import("./page-client"), {
  ssr: false,
})

export default function SessionDetailsPageLoader() {
  return <SessionDetailsPageClient />
}

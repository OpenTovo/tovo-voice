"use client"

import dynamic from "next/dynamic"

const NewSessionPageClient = dynamic(() => import("./page-client"), {
  ssr: false,
})

export default function NewSessionPageLoader() {
  return <NewSessionPageClient />
}

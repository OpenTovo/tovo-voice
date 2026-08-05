"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import dynamic from "next/dynamic"

const NewSessionPageClient = dynamic(() => import("./page-client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-col px-4 py-4 pb-6 sm:px-6 md:px-8">
      <Skeleton className="mb-4 h-[220px] w-full rounded-xl" />
      <Skeleton className="mb-4 min-h-0 flex-1 rounded-xl" />
      <Skeleton className="h-[76px] w-full rounded-xl" />
    </div>
  ),
})

export default function NewSessionPageLoader() {
  return <NewSessionPageClient />
}

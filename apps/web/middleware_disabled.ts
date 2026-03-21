// import { type NextRequest } from "next/server"
// import { updateSession } from "@/lib/supabase/middleware"

// export async function middleware(request: NextRequest) {
//   return await updateSession(request)
// }

// export const config = {
//   matcher: [
//     /*
//      * Match only specific protected routes for optimal performance:
//      * - /new (session page)
//      * - /settings (settings page)
//      * - /history (history page)
//      * - Protected API routes (exclude auth endpoints)
//      *
//      * AUTOMATICALLY EXCLUDED (no auth needed):
//      * - Static files: /_next/*, /favicon.ico, /manifest.json, /version.json
//      * - Assets: /wasm/*, images (*.png, *.jpg, *.svg, etc.)
//      * - Public pages: /, /login, /auth/*
//      * - Public API: /api/auth/*
//      *
//      * This reduces middleware execution by ~80% for better performance
//      */
//     "/new/:path*",
//     "/settings/:path*",
//     "/history/:path*",
//     "/api/((?!auth).)*",
//   ],
// }

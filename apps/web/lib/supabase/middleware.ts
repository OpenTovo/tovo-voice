import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase/env"

export async function updateSession(request: NextRequest) {
  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.log("Middleware processing:", request.nextUrl.pathname)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const { url, anonKey } = await getSupabaseEnv()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  // Use a timeout to prevent hanging requests
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Auth check timeout")), 3000) // 3 second timeout
  })

  try {
    const {
      data: { user },
    } = (await Promise.race([supabase.auth.getUser(), timeoutPromise])) as any

    if (process.env.NODE_ENV === "development") {
      console.log("Middleware auth check:", {
        path: request.nextUrl.pathname,
        hasUser: !!user,
      })
    }

    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("Redirecting to login from:", request.nextUrl.pathname)
      }
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    // In case of auth check failure, redirect to login to be safe
    if (process.env.NODE_ENV === "development") {
      console.warn("Auth check failed:", error)
    }

    if (
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

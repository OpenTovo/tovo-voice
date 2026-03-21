"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth"
import { useRouteGuard } from "@/hooks/use-route-guard"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")
  const { signInWithGoogle, signInWithEmail, verifyOtp, user } = useAuth()
  const { isReady } = useRouteGuard({ requireAuth: false })
  const router = useRouter()

  // Redirect if user is already logged in - prevent login screen flash
  useEffect(() => {
    if (user && isReady) {
      router.replace("/new") // Use replace to avoid back button issues
    }
  }, [user, isReady, router])

  // Don't render login form at all if user is authenticated
  if (user) {
    return (
      <div className="relative flex min-h-svh items-center justify-center p-4">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

        <Card className="relative w-full max-w-md border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
              <p className="text-sm text-slate-400">Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading while checking auth state
  if (!isReady) {
    return (
      <div className="relative flex min-h-svh items-center justify-center p-4">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

        <Card className="relative w-full max-w-md border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
              <p className="text-sm text-slate-400">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError("")
      await signInWithGoogle()
    } catch (error) {
      console.error("Google auth error:", error)
      setError("Failed to sign in with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setIsLoading(true)
      setError("")
      await signInWithEmail(email)
      setEmailSent(true)
    } catch (error) {
      console.error("Email auth error:", error)
      setError("Failed to send verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otp) return

    try {
      setIsLoading(true)
      setError("")
      await verifyOtp(email, otp)
      // After successful verification, user will be redirected automatically
    } catch (error) {
      console.error("OTP verification error:", error)
      setError("Invalid verification code. Please check and try again.")
      setOtp("") // Clear the OTP field on error
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="relative flex min-h-svh items-center justify-center p-4">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-purple-500/10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-blue-500/10 blur-3xl delay-1000"></div>
        </div>

        <Card className="relative w-full max-w-md border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-2xl font-bold text-transparent">
              Enter verification code
            </CardTitle>
            <CardDescription className="text-slate-400">
              We've sent a 6-digit verification code to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleOtpVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value)
                    setError("") // Clear error when user types
                  }}
                  maxLength={6}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !otp || otp.length !== 6}
                className="w-full border-0 bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
            {!isLoading ? (
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
                onClick={() => {
                  setEmailSent(false)
                  setOtp("")
                  setError("")
                }}
              >
                Back to login
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-blue-500/10 blur-3xl delay-1000"></div>
      </div>

      <Card className="relative w-full max-w-md border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-2xl font-bold text-transparent">
            Welcome to Tovo
          </CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && !emailSent && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full border-0 bg-white font-medium shadow-lg transition-all duration-200 hover:bg-slate-100 hover:shadow-xl"
            variant="outline"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/80 px-3 font-medium text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("") // Clear error when user types
                }}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full border-0 bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
            >
              Send login code
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

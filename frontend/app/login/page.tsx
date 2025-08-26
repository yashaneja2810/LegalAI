"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Scale, Eye, EyeOff, Mail, Lock, UserCheck, AlertCircle } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { signInWithEmail, signInWithGoogle } from "../../lib/supabase"
import { toast } from "sonner"

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  
  const { user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  if (user) {
    router.push("/dashboard")
    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix the errors below")
      return
    }

    setIsLoading(true)
    setAuthError("")

    try {
      const { data, error } = await signInWithEmail(formData.email, formData.password)
      
      if (error) {
        setAuthError(error.message)
        toast.error("Login failed: " + error.message)
      } else {
        toast.success("Login successful!")
        router.push("/dashboard")
      }
    } catch (error: any) {
      setAuthError("An unexpected error occurred")
      toast.error("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setAuthError("")

    try {
      const { data, error } = await signInWithGoogle()
      
      if (error) {
        setAuthError(error.message)
        toast.error("Google login failed: " + error.message)
      } else {
        toast.success("Login successful!")
        // Google OAuth will redirect automatically
      }
    } catch (error: any) {
      setAuthError("Google login failed")
      toast.error("Google login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // For now, just redirect to dashboard
    // You can implement guest session logic later
    toast.success("Welcome! You're now browsing as a guest.")
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen legal-bg-primary">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="flex items-center justify-center p-6 pt-20 pb-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 legal-icon-bg rounded-2xl flex items-center justify-center">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl legal-heading">LegalEase</h1>
            </div>

            <h2 className="text-2xl legal-heading mb-3">Welcome back</h2>
            <p className="text-legal-secondary legal-text">Enter your credentials to access your account</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-legal border border-legal-border">
            {/* Error Display */}
            {authError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-destructive text-sm legal-text">{authError}</p>
                  {authError.includes('Invalid') && (
                    <p className="text-sm text-legal-secondary mt-1">
                      <Link href="/signup" className="text-legal-accent hover:underline">
                        Create an account here
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Google Login */}
            <div className="mb-6">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-4 text-base shadow-legal hover:shadow-legal-lg transition-all duration-300 rounded-2xl"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>

            {/* Guest Login Option */}
            <div className="mb-6">
              <Button
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full bg-success hover:bg-success/90 text-white font-semibold py-4 text-base shadow-legal hover:shadow-legal-lg transition-all duration-300 rounded-2xl"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Continue as Guest
              </Button>
              <p className="text-xs text-legal-secondary text-center mt-2 legal-text">
                Explore all features without creating an account
              </p>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-legal-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-legal-secondary legal-text">
                  Or sign in with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-legal-dark-text font-medium legal-text">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-legal-secondary" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-12 py-3 bg-legal-bg-secondary border-legal-border focus:border-legal-accent focus:ring-legal-accent ${
                      errors.email ? 'border-destructive' : ''
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm legal-text">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-legal-dark-text font-medium legal-text">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-legal-secondary" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-12 pr-12 py-3 bg-legal-bg-secondary border-legal-border focus:border-legal-accent focus:ring-legal-accent ${
                      errors.password ? 'border-destructive' : ''
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-legal-secondary hover:text-legal-dark-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm legal-text">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))}
                    className="border-legal-border data-[state=checked]:bg-legal-brown data-[state=checked]:border-legal-brown"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-legal-secondary cursor-pointer legal-text">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-legal-accent hover:text-legal-brown transition-colors legal-text"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="btn-legal-primary w-full py-4 text-base font-semibold"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-legal-secondary legal-text">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-legal-accent hover:text-legal-brown font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

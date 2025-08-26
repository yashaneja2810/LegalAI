"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Scale, Eye, EyeOff, Mail, Lock, UserCheck, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { signUpWithEmail, signInWithGoogle } from "../../lib/supabase"
import { toast } from "sonner"
import SupabaseTest from "../../components/SupabaseTest"

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
  subscribeNewsletter: boolean
}

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  
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
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
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

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
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
      const { data, error } = await signUpWithEmail(formData.email, formData.password)

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('Network error')) {
          setAuthError("Unable to connect to authentication service. Please check your internet connection.")
        } else if (error.message.includes('already registered')) {
          setAuthError("An account with this email already exists.")
        } else {
          setAuthError(error.message)
        }
        toast.error("Signup failed: " + error.message)
      } else {
        setIsSuccess(true)
        toast.success("Account created successfully! Please check your email to verify your account.")
        // Don't redirect immediately, show success message
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      setAuthError("Unable to create account. Please try again later.")
      toast.error("Signup failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setAuthError("")

    try {
      const { data, error } = await signInWithGoogle()
      
      if (error) {
        setAuthError(error.message)
        toast.error("Google signup failed: " + error.message)
      } else {
        toast.success("Account created successfully!")
        // Google OAuth will redirect automatically
      }
    } catch (error: any) {
      setAuthError("Google signup failed")
      toast.error("Google signup failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestAccess = () => {
    toast.success("Welcome! You're now browsing as a guest.")
    router.push("/dashboard")
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen legal-bg-primary flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-legal border border-legal-border">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl legal-heading mb-4">Account Created!</h2>
            <p className="text-legal-secondary legal-text mb-6">
              We've sent a verification email to <strong>{formData.email}</strong>. 
              Please check your inbox and click the verification link to activate your account.
            </p>
            <Button 
              onClick={() => router.push("/login")}
              className="btn-legal-primary w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
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

            <h2 className="text-2xl legal-heading mb-3">Create your account</h2>
            <p className="text-legal-secondary legal-text">Join thousands of professionals using LegalEase</p>
          </div>

          {/* Debug Component - Remove in production */}
          <div className="mb-4">
            <SupabaseTest />
          </div>

          {/* Signup Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-legal border border-legal-border">
            {/* Error Display */}
            {authError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-destructive text-sm legal-text">{authError}</p>
                  {authError.includes('already') && (
                    <p className="text-sm text-legal-secondary mt-1">
                      <Link href="/login" className="text-legal-accent hover:underline">
                        Sign in to your existing account
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Google Signup */}
            <div className="mb-6">
              <Button
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-4 text-base shadow-legal hover:shadow-legal-lg transition-all duration-300 rounded-2xl"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>
            </div>

            {/* Guest Access Option */}
            <div className="mb-6">
              <Button
                onClick={handleGuestAccess}
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
                  Or create account with email
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
                    placeholder="Create a strong password"
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
                <p className="text-xs text-legal-secondary legal-text">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-legal-dark-text font-medium legal-text">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-legal-secondary" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-12 pr-12 py-3 bg-legal-bg-secondary border-legal-border focus:border-legal-accent focus:ring-legal-accent ${
                      errors.confirmPassword ? 'border-destructive' : ''
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-legal-secondary hover:text-legal-dark-text transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm legal-text">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Newsletter */}
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleCheckboxChange('agreeToTerms', checked as boolean)}
                    className="border-legal-border data-[state=checked]:bg-legal-brown data-[state=checked]:border-legal-brown mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="agreeToTerms" className="text-sm text-legal-secondary cursor-pointer legal-text">
                      I agree to the{" "}
                      <Link href="/terms" className="text-legal-accent hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-legal-accent hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                    {errors.agreeToTerms && (
                      <p className="text-destructive text-xs mt-1 legal-text">{errors.agreeToTerms}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="subscribeNewsletter"
                    checked={formData.subscribeNewsletter}
                    onCheckedChange={(checked) => handleCheckboxChange('subscribeNewsletter', checked as boolean)}
                    className="border-legal-border data-[state=checked]:bg-legal-brown data-[state=checked]:border-legal-brown"
                  />
                  <Label htmlFor="subscribeNewsletter" className="text-sm text-legal-secondary cursor-pointer legal-text">
                    Subscribe to our newsletter for legal updates and tips
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="btn-legal-primary w-full py-4 text-base font-semibold"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-legal-secondary legal-text">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-legal-accent hover:text-legal-brown font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

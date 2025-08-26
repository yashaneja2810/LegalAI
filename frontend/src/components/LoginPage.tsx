import { useState } from 'react';
import { motion } from 'framer-motion';
import { Chrome, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { Logo } from './Logo';
import { AnimatedButton } from './AnimatedButton';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error('Failed to sign in with Google');
      }
    } catch (err) {
      toast.error('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = isSignUp 
        ? await signUpWithEmail(formData.email, formData.password)
        : await signInWithEmail(formData.email, formData.password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(isSignUp ? 'Account created successfully!' : 'Signed in successfully!');
      }
    } catch (err) {
      toast.error('An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)' }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" className="absolute animate-pulse" style={{ opacity: 0.18 }}>
          <defs>
            <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <circle cx="60%" cy="40%" r="320" fill="url(#bg-glow)" />
          <circle cx="20%" cy="80%" r="180" fill="url(#bg-glow)" />
        </svg>
      </div>
      {/* Glassy login card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring' }}
        className="relative z-10 w-full max-w-md p-10 rounded-3xl glassy shadow-2xl border border-blue-900/30 flex flex-col items-center"
      >
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.7, type: 'spring' }} className="mb-8 flex flex-col items-center">
          <Logo size={64} />
          <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-600 to-blue-300 bg-clip-text text-transparent tracking-tight mt-2 select-none">Bolt Legal AI</span>
          <span className="text-base text-blue-200 mt-1 font-medium tracking-wide select-none">Demystifying Legal Documents</span>
        </motion.div>
        <form className="w-full flex flex-col gap-4" onSubmit={handleEmailAuth}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-blue-200 font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-blue-800/30 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                placeholder="you@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-blue-200 font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/40 border border-blue-800/30 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-2.5 text-blue-400 hover:text-blue-200 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-blue-200 font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-blue-800/30 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}
          <AnimatedButton
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-2"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </AnimatedButton>
        </form>
        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-px bg-blue-900/30" />
          <span className="mx-4 text-blue-300 text-sm">or</span>
          <div className="flex-1 h-px bg-blue-900/30" />
        </div>
        <AnimatedButton
          onClick={handleGoogleSignIn}
          size="lg"
          icon={Chrome}
          disabled={loading}
          variant="ghost"
          className="w-full"
        >
          Continue with Google
        </AnimatedButton>
        <div className="w-full flex justify-center mt-6">
          <button
            className="text-blue-300 hover:text-blue-100 font-medium transition-all text-sm focus:outline-none"
            onClick={() => setIsSignUp((v) => !v)}
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

'use client';

import { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

interface SocialAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

export default function SocialAuth({ mode, onSuccess }: SocialAuthProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const router = useRouter();

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    setLoading(provider);
    setError(null);
    
    try {
      let authProvider;
      if (provider === 'google') {
        authProvider = new GoogleAuthProvider();
      } else {
        authProvider = new FacebookAuthProvider();
      }
      
      const result = await signInWithPopup(auth, authProvider);
      console.log('Authentication successful:', result.user);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || `Failed to sign in with ${provider}`);
    } finally {
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError(null);

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Email authentication error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('reset');
    setError(null);
    setResetMessage('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(null);
    }
  };

  if (showPasswordReset) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-glow-purple mb-2">Reset Password</h2>
          <p className="text-gray-300">Enter your email to receive a reset link</p>
        </div>

        {resetMessage && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-300 text-sm">
            {resetMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            className="w-full p-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
          
          <button
            type="submit"
            disabled={loading === 'reset'}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
          >
            {loading === 'reset' ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <button
          onClick={() => setShowPasswordReset(false)}
          className="w-full text-gray-400 hover:text-white text-sm"
        >
          ← Back to login
        </button>
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-glow-purple mb-2">
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-300">Enter your email and password</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
          
          <button
            type="submit"
            disabled={loading === 'email'}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
          >
            {loading === 'email' ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {mode === 'signin' && (
          <button
            onClick={() => setShowPasswordReset(true)}
            className="w-full text-gray-400 hover:text-white text-sm"
          >
            Forgot your password?
          </button>
        )}

        <button
          onClick={() => setShowEmailForm(false)}
          className="w-full text-gray-400 hover:text-white text-sm"
        >
          ← Back to social options
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-glow-purple mb-2">
          {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-300">Choose your preferred sign-in method</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={() => handleSocialAuth('google')}
          disabled={loading === 'google'}
          className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{loading === 'google' ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <button
          onClick={() => handleSocialAuth('facebook')}
          disabled={loading === 'facebook'}
          className="w-full bg-[#1877F2] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#166FE5] transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>{loading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-purple-900 px-2 text-gray-400">Or</span>
          </div>
        </div>

        <button
          onClick={() => setShowEmailForm(true)}
          className="w-full bg-transparent border-2 border-purple-500/30 text-white py-3 px-4 rounded-lg font-semibold hover:border-purple-500 hover:bg-purple-500/10 transition-all duration-300"
        >
          Continue with Email
        </button>
      </div>
    </div>
  );
}

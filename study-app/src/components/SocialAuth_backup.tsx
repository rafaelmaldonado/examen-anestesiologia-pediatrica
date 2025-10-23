'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

interface SocialAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

export default function SocialAuth({ mode, onSuccess }: SocialAuthProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    setLoading(provider);
    setError(null);

    try {
      let authProvider;
      
      if (provider === 'google') {
        authProvider = new GoogleAuthProvider();
        authProvider.addScope('email');
        authProvider.addScope('profile');
      } else {
        authProvider = new FacebookAuthProvider();
        authProvider.addScope('email');
      }

      const result = await signInWithPopup(auth, authProvider);
      console.log('Social auth successful:', result.user.email);
      
      onSuccess?.();
      router.push('/');
    } catch (error: any) {
      console.error(`${provider} auth error:`, error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials. Try signing in with a different method.');
      } else {
        setError(error.message || `Failed to sign in with ${provider}`);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError(null);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      
      onSuccess?.();
      router.push('/');
    } catch (error: any) {
      console.error('Email auth error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('reset');
    setError(null);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else {
        setError(error.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(null);
    }
  };

  if (showResetPassword) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-200 mb-2">Reset Password</h2>
          <p className="text-gray-400">Enter your email to receive a password reset link</p>
        </div>

        {resetSent ? (
          <div className="text-center space-y-4">
            <div className="text-green-400 text-lg">✅ Reset email sent!</div>
            <p className="text-gray-300">Check your email for password reset instructions</p>
            <button
              onClick={() => {
                setShowResetPassword(false);
                setResetSent(false);
                setResetEmail('');
              }}
              className="text-purple-400 hover:text-purple-300"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-neon w-full px-4 py-3 rounded-lg"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading === 'reset'}
              className="btn-neon-purple w-full py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading === 'reset' ? (
                <div className="flex items-center justify-center">
                  <div className="spinner-neon w-5 h-5 mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Reset Email'
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowResetPassword(false)}
              className="w-full text-gray-400 hover:text-white text-sm"
            >
              ← Back to sign in
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-gray-400">
          {mode === 'signin' 
            ? 'Welcome back! Sign in to continue your learning journey' 
            : 'Join us to start your certification journey'
          }
        </p>
      </div>

      {/* Social Authentication Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleSocialAuth('google')}
          disabled={!!loading}
          className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'google' ? (
            <div className="spinner-neon w-5 h-5 mr-2"></div>
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <button
          onClick={() => handleSocialAuth('facebook')}
          disabled={!!loading}
          className="w-full flex items-center justify-center px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'facebook' ? (
            <div className="spinner-neon w-5 h-5 mr-2"></div>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          Continue with Facebook
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#1a1a2e] text-gray-400">or</span>
        </div>
      </div>

      {/* Email/Password Form Toggle */}
      {!showEmailForm ? (
        <button
          onClick={() => setShowEmailForm(true)}
          className="w-full text-gray-400 hover:text-white text-sm border border-gray-600 hover:border-gray-500 py-2 rounded-lg transition-all"
        >
          Continue with Email
        </button>
      ) : (
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="input-neon w-full px-4 py-3 rounded-lg"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-neon w-full px-4 py-3 rounded-lg"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading === 'email'}
            className="btn-neon-purple w-full py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading === 'email' ? (
              <div className="flex items-center justify-center">
                <div className="spinner-neon w-5 h-5 mr-2"></div>
                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>

          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="w-full text-gray-400 hover:text-purple-400 text-sm"
            >
              Forgot your password?
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowEmailForm(false)}
            className="w-full text-gray-400 hover:text-white text-sm"
          >
            ← Back to social options
          </button>
        </form>
      )}
    </div>
  );
}

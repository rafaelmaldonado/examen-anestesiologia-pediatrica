'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SocialAuth from '@/components/SocialAuth';
import Link from 'next/link';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card-dark p-8 rounded-2xl">
          <SocialAuth 
            mode={isSignUp ? 'signup' : 'signin'} 
            onSuccess={handleAuthSuccess} 
          />
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-glow-orange hover:text-glow-cyan transition-all duration-300"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-400 hover:text-glow-purple transition-all duration-300">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

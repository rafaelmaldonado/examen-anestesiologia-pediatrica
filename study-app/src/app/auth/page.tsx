'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useAuth } from '@/app/providers';
import SocialAuth from '@/components/SocialAuth';

export default function AuthPage() {
  const { user, loading } = useAuth();

  // If already logged in, redirect to home using a hard redirect so the
  // session cookie is sent with the new request and the middleware allows through.
  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  const handleAuthSuccess = () => {
    window.location.href = '/';
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-dark rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Examen Anestesiología Pediátrica</h1>
            <p className="text-[var(--foreground-muted)]">Inicia sesión para acceder a los exámenes</p>
          </div>
          
          <SocialAuth mode="signin" onSuccess={handleAuthSuccess} />
        </div>
      </div>
    </div>
  );
}

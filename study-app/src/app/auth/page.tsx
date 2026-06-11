'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useAuth } from '@/app/providers';
import SocialAuth from '@/components/SocialAuth';
import Logo from '@/components/Logo';

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
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size={64} />
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-5 tracking-tight">
            Anestesiología Pediátrica
          </h1>
          <p className="text-[var(--foreground-muted)] mt-2 max-w-xs">
            Plataforma de exámenes de certificación
          </p>
        </div>

        <div className="card-dark rounded-2xl p-8">
          <SocialAuth mode="signin" onSuccess={handleAuthSuccess} />
        </div>

        <p className="text-center text-xs text-[var(--foreground-muted)] mt-6">
          Acceso exclusivo para estudiantes registrados.
        </p>
      </div>
    </div>
  );
}

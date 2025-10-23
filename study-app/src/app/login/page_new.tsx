'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified auth page
    router.replace('/auth');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
        <div className="text-xl font-semibold text-glow-purple">Redirecting...</div>
      </div>
    </div>
  );
}

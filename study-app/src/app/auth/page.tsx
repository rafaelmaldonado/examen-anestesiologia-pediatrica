'use client';

import { useRouter } from 'next/navigation';
import SocialAuth from '@/components/SocialAuth';

export default function AuthPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-dark rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Adobe Certification</h1>
            <p className="text-[var(--foreground-muted)]">Access your study materials and take quizzes</p>
          </div>
          
          <SocialAuth mode="signin" onSuccess={handleAuthSuccess} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const response = await fetch('/api/auth/verify');
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin); // Use the server-side admin check
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
      setCheckingAdmin(false);
    };

    if (!loading && user) {
      checkAdminStatus();
    } else if (!loading && !user) {
      setCheckingAdmin(false);
    }
  }, [user, loading]);

  // Show loading while checking authentication and admin status
  if (loading || checkingAdmin) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  // Redirect non-authenticated users
  if (!user) {
    router.push('/login');
    return null;
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-8 min-h-screen">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--error)] mb-4">Access Denied</h1>
            <p className="text-[var(--foreground-muted)] mb-6">You don't have permission to access the admin panel.</p>
            <p className="text-sm text-[var(--foreground-muted)] mb-8">Only administrators can access this section.</p>
            <Link 
              href="/" 
              className="btn-neon-purple px-6 py-3 rounded-lg font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and is admin, render the protected content
  return <>{children}</>;
}

'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  // Don't show navigation on admin pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/login')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear any stored user data
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="nav-dark sticky top-0 z-40 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-[var(--foreground)]">
          🩺 Anestesiología Pediátrica
        </Link>
        
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              
              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-sm hover:bg-[var(--primary-light)] transition-colors duration-200"
                >
                  {user.email?.charAt(0).toUpperCase()}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--border)] z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-[var(--foreground-muted)] border-b border-[var(--border)]">
                        {user.email}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-light)] transition-colors duration-200"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link 
              href="/auth" 
              className="btn-neon-purple py-2 px-5 rounded-lg text-sm font-medium"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

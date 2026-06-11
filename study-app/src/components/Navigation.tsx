'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useState, useEffect } from 'react';
import Logo from './Logo';

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
    <nav className="nav-dark sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={36} />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] sm:text-base font-bold text-[var(--foreground)] tracking-tight">
              Anestesiología Pediátrica
            </span>
            <span className="text-[11px] text-[var(--foreground-muted)] -mt-0.5 hidden sm:block">
              Plataforma de exámenes
            </span>
          </span>
        </Link>

        <div className="flex items-center">
          {user ? (
            <div className="relative user-menu">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="Menú de usuario"
                className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-sm hover:bg-[var(--primary-dark)] transition-colors duration-200 ring-2 ring-transparent focus-visible:ring-[var(--ring)]"
              >
                {user.email?.charAt(0).toUpperCase()}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border)] z-50 overflow-hidden animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-xs text-[var(--foreground-muted)]">Sesión iniciada como</p>
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-[var(--error)] hover:bg-[var(--error-light)] transition-colors duration-200"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="btn-neon-purple py-2 px-5 rounded-lg text-sm"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

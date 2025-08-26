'use client';

import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const response = await fetch('/api/auth/verify');
          if (response.ok) {
            const data = await response.json();
            const adminEmail = 'admin@cert-3d7e6.com'; // Could be moved to env variable
            setIsAdmin(data.email === adminEmail);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  return {
    isAdmin,
    loading: loading || checkingAdmin,
  };
}

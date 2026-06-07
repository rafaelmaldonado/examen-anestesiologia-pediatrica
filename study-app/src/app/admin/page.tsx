'use client';

import { useAuth } from '@/app/providers';
import Link from "next/link";
import SignOutButton from './SignOutButton';
import AdminGuard from '@/components/AdminGuard';

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <AdminGuard>
      <div className="container mx-auto p-8 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
              <p className="text-[var(--foreground-muted)] text-sm">Welcome, {user?.email}</p>
              <SignOutButton />
          </div>
        </div>

        <p className="text-[var(--foreground-muted)] mb-8">Manage your certification platform from this dashboard.</p>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-5">Management Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/admin/certifications" className="block group">
                <div className="card-dark p-6 sm:p-8 rounded-xl h-full">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">📜</span>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">Manage Certifications</h3>
                    </div>
                    <p className="text-[var(--foreground-muted)] text-sm">Create, edit, and delete certification categories.</p>
                  <div className="mt-4 text-[var(--primary)] group-hover:text-[var(--primary-light)] transition-colors text-sm font-medium">
                    Access Panel →
                  </div>
              </div>
            </Link>

            <Link href="/admin/stats" className="block group">
              <div className="card-dark p-6 sm:p-8 rounded-xl h-full">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">📊</span>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">View Statistics</h3>
                  </div>
                  <p className="text-[var(--foreground-muted)] text-sm">See total questions per certification and platform stats.</p>
                  <div className="mt-4 text-[var(--primary)] group-hover:text-[var(--primary-light)] transition-colors text-sm font-medium">
                    View Stats →
                  </div>
              </div>
            </Link>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}

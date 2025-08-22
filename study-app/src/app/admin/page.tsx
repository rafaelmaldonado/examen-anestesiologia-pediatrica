'use client';

import { useAuth } from '@/app/providers';
import Link from "next/link";
import SignOutButton from './SignOutButton';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-glow-purple">Loading Admin Panel...</div>
        </div>
      </div>
    );
  }

  // This check is redundant due to middleware but is good practice
  if (!user) {
    router.push('/login');
    return null; // Return null while redirecting
  }

  return (
    <div className="container mx-auto p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-glow-purple">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
            <p className="text-gray-300">Welcome, {user.email}</p>
            <SignOutButton />
        </div>
      </div>

      <p className="text-lg text-gray-300 mb-8">Manage your certification platform from this dashboard.</p>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6">Management Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/admin/certifications" className="block group">
              <div className="card-dark p-8 rounded-xl h-full group-hover:scale-105 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-4">📜</span>
                    <h3 className="text-xl font-bold text-glow-orange">Manage Certifications</h3>
                  </div>
                  <p className="text-gray-300">Create, edit, and delete certification categories.</p>
                  <div className="mt-4 text-purple-400 group-hover:text-orange-400 transition-colors">
                    Access Panel →
                  </div>
              </div>
            </Link>
        </div>
      </div>

    </div>
  );
}

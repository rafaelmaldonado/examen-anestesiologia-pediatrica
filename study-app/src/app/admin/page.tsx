'use client';

import { useAuth } from '@/app/providers';
import Link from "next/link";
import SignOutButton from './SignOutButton';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  // This check is redundant due to middleware but is good practice
  if (!user) {
    router.push('/login');
    return null; // Return null while redirecting
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
            <p className="text-gray-600">Welcome, {user.email}</p>
            <SignOutButton />
        </div>
      </div>

      <p className="text-lg">This is where you will manage certifications and questions.</p>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Management Sections</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/certifications" className="block group">
              <div className="p-6 bg-white rounded-lg shadow-md h-full group-hover:bg-gray-50 transition-all">
                  <h3 className="text-xl font-bold mb-2">Manage Certifications</h3>
                  <p>Create, edit, and delete certification categories.</p>
              </div>
            </Link>
            <div className="p-6 bg-gray-200 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2 text-gray-500">Manage Questions (Coming Soon)</h3>
                <p className="text-gray-600">Add, edit, and delete questions for each certification.</p>
            </div>
        </div>
      </div>

    </div>
  );
}

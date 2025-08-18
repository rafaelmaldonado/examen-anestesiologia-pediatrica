import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import Link from "next/link";

async function SignOut() {
    'use server';
    // This is a placeholder. Real sign out is done on the client side.
    // I will create a client component for the sign out button.
    return (
        <form action={async () => {
            'use server';
            // This is not how next-auth signout works.
            // I need a client component.
        }}>
            <button type="submit">Sign Out</button>
        </form>
    )
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // The middleware should handle this, but it's good practice for direct navigation
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
            <p className="text-gray-600">Welcome, {session.user?.email}</p>
            {/* Sign out needs to be a client component */}
            <Link href="/api/auth/signout">
                <span className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    Sign Out
                </span>
            </Link>
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
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2">Manage Questions</h3>
                <p>Add, edit, and delete questions for each certification.</p>
                {/* Link to be added later */}
            </div>
        </div>
      </div>

    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';

export default function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            // First, sign out from the Firebase client instance.
            // The onAuthStateChanged listener in the AuthProvider will then trigger.
            await signOut(auth);

            // The listener will also hit the DELETE /api/auth/session endpoint
            // to clear the server-side session cookie automatically.

            // After sign out, redirect the user to the home page.
            router.push('/');
        } catch (error) {
            console.error("Error signing out: ", error);
            // Optionally, show an error message to the user.
        }
    };

    return (
        <button
            onClick={handleSignOut}
            className="bg-[var(--error-light)] hover:bg-red-100 border border-red-200 text-[var(--error)] font-medium py-2 px-4 rounded-lg transition-colors"
        >
            Sign Out
        </button>
    );
}

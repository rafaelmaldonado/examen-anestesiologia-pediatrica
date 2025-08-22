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
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-400 text-red-400 hover:text-red-300 font-bold py-2 px-4 rounded-lg transition-all duration-300"
        >
            Sign Out
        </button>
    );
}

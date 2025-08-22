import { adminAuth, adminDb } from '@/lib/firebase/admin';

export function checkFirebaseAdmin() {
  if (!adminAuth || !adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  return { adminAuth, adminDb };
}

export { adminAuth, adminDb };

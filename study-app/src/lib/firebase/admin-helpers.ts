import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export function checkFirebaseAdmin() {
  return { adminAuth: getAdminAuth(), adminDb: getAdminDb() };
}

export { getAdminAuth as adminAuth, getAdminDb as adminDb };

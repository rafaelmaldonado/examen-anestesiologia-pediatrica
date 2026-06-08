import * as admin from 'firebase-admin';

function getCredential(): admin.credential.Credential | null {
  // Option 1: individual env vars (recommended for Vercel — avoids JSON escaping issues)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (clientEmail && rawPrivateKey && projectId) {
    // Vercel escapes \n in env vars — convert back to real newlines
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    console.log('[Firebase Admin] Using individual env vars for credential');
    return admin.credential.cert({ projectId, clientEmail, privateKey });
  }

  // Option 2: full JSON blob
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  if (serviceAccountString) {
    try {
      const sa = JSON.parse(serviceAccountString.trim());
      // Fix mangled newlines in private_key
      if (typeof sa.private_key === 'string') {
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      }
      console.log('[Firebase Admin] Using FIREBASE_SERVICE_ACCOUNT_KEY_JSON for credential');
      return admin.credential.cert(sa);
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON:', e);
    }
  }

  console.error(
    '[Firebase Admin] No credentials found. Add FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY ' +
    '(or FIREBASE_SERVICE_ACCOUNT_KEY_JSON) to your Vercel environment variables.'
  );
  return null;
}

if (!admin.apps.length) {
  const credential = getCredential();
  if (credential) {
    try {
      admin.initializeApp({ credential });
      console.log('[Firebase Admin] App initialized ✓');
    } catch (e) {
      console.error('[Firebase Admin] initializeApp failed:', e);
    }
  }
  // Do NOT fall back to projectId-only init — it tries ADC and always fails in Vercel
}

const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

export { adminAuth, adminDb };

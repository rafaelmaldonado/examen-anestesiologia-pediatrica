import * as admin from 'firebase-admin';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountString && process.env.NODE_ENV !== 'production') {
  console.warn('The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. Some features may not work.');
}

let serviceAccount;
try {
    if (serviceAccountString) {
        serviceAccount = JSON.parse(serviceAccountString);
    }
} catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON. Make sure it is a valid JSON string.');
}


if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (!admin.apps.length) {
  // Fallback initialization for build time
  console.warn('Firebase Admin not initialized due to missing service account');
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };

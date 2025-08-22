import * as admin from 'firebase-admin';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountString && process.env.NODE_ENV === 'production') {
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
} else if (!admin.apps.length && process.env.NODE_ENV === 'production') {
  // Initialize with minimal config for production build
  try {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cert-3d7e6',
    });
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
  }
}

// Export with error handling
let adminAuth, adminDb;
try {
  adminAuth = admin.auth();
  adminDb = admin.firestore();
} catch (error) {
  console.warn('Firebase Admin services not available:', error);
  // Create mock objects for build time
  adminAuth = null as any;
  adminDb = null as any;
}

export { adminAuth, adminDb };

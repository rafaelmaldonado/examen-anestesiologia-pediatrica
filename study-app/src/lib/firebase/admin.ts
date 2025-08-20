import * as admin from 'firebase-admin';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountString) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. Please check your .env.local file.');
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountString);
} catch (error) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON. Make sure it is a valid JSON string.');
}


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };

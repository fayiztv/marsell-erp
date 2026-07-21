/**
 * Firebase App singleton initialization.
 * This file is the ONLY place Firebase is configured.
 * All other Firebase instances import from their dedicated files (auth.ts, firestore.ts, functions.ts).
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Singleton pattern — prevents re-initialization during HMR in development
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export default app;

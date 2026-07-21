import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import app from './config';

export const db = getFirestore(app);

// Connect to local emulator in development if configured
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import app from './config';

export const functions = getFunctions(app);

// Connect to local emulator in development if configured
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config from Firebase Console
// Project: moms-who-trade
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'USER_WILL_ADD',
  authDomain: 'moms-who-trade.firebaseapp.com',
  projectId: 'moms-who-trade',
  storageBucket: 'moms-who-trade.firebasestorage.app',
  messagingSenderId: '469803981741',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'USER_WILL_ADD',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

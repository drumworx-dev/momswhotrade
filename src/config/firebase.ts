import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDTpMwA3YoynWGyuoIGkdDXZD_jva9Kh-k',
  authDomain: 'moms-who-trade.firebaseapp.com',
  projectId: 'moms-who-trade',
  storageBucket: 'moms-who-trade.firebasestorage.app',
  messagingSenderId: '469803981741',
  appId: '1:469803981741:web:7c7d7cc61ae2d2e5995f24',
  measurementId: 'G-D0BB6SSRGM',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

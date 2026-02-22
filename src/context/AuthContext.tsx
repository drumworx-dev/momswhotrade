import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
  experience?: string;
  monthlyGoal?: number;
  dailyProfitGoalPercent?: number;
  onboardingComplete?: boolean;
  emailConsent?: boolean;
  loginDates?: string[]; // YYYY-MM-DD, stored in Firestore — syncs across all devices
}

/** Local-time date string — avoids UTC timezone drift */
function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function upsertUser(firebaseUser: FirebaseUser, provider: string): Promise<AppUser> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  const today = localDateStr();

  if (!snap.exists()) {
    const newUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Mom',
      photoURL: firebaseUser.photoURL || undefined,
      provider,
      onboardingComplete: false,
      loginDates: [today],
    };
    await setDoc(ref, { ...newUser, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
    return newUser;
  } else {
    // arrayUnion adds today's date only if not already present — idempotent
    await setDoc(ref, { lastLoginAt: serverTimestamp(), loginDates: arrayUnion(today) }, { merge: true });
    const data = snap.data() as Partial<AppUser>;
    // Merge today into the returned value (arrayUnion is server-side; snap is pre-update)
    const existing = data.loginDates ?? [];
    const loginDates = existing.includes(today) ? existing : [...existing, today].sort();
    // Always stamp uid/email/displayName from Firebase Auth — the Firestore doc may be
    // a partial record written during sign-up before all fields were available.
    return {
      ...data,
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || data.displayName || 'Mom',
      provider,
      loginDates,
    } as AppUser;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true); // show splash while we fetch the Firestore profile
        const provider = firebaseUser.providerData[0]?.providerId || 'google';
        const appUser = await upsertUser(firebaseUser, provider);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    await signInWithPopup(auth, provider);
  };

  const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    await signInWithPopup(auth, provider);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    // Ensure Firestore has complete fields regardless of onAuthStateChanged timing
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: credential.user.email || '',
      displayName,
      provider: 'password',
    }, { merge: true });
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const updateUserProfile = async (data: Partial<AppUser>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithFacebook, signUpWithEmail, signInWithEmail, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

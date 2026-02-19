import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function upsertUser(firebaseUser: FirebaseUser, provider: string): Promise<AppUser> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Mom',
      photoURL: firebaseUser.photoURL || undefined,
      provider,
      onboardingComplete: false,
    };
    await setDoc(ref, { ...newUser, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
    return newUser;
  } else {
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
    return snap.data() as AppUser;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithFacebook, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

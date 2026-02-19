import React, { createContext, useContext, useState, useEffect } from 'react';

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
  updateUserProfile: (data: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for demo user
    const stored = localStorage.getItem('mwt_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    // Demo mode - simulate Google sign in
    const demoUser: AppUser = {
      uid: 'demo-user-123',
      email: 'demo@momswhotrade.co',
      displayName: 'Demo Mom',
      photoURL: 'https://ui-avatars.com/api/?name=Demo+Mom&background=D4A5A5&color=fff',
      provider: 'google',
      onboardingComplete: false,
    };
    setUser(demoUser);
    localStorage.setItem('mwt_user', JSON.stringify(demoUser));
  };

  const signInWithFacebook = async () => {
    // Demo mode - simulate Facebook sign in
    const demoUser: AppUser = {
      uid: 'demo-user-456',
      email: 'demo@momswhotrade.co',
      displayName: 'Demo Mom',
      photoURL: 'https://ui-avatars.com/api/?name=Demo+Mom&background=D4A5A5&color=fff',
      provider: 'facebook',
      onboardingComplete: false,
    };
    setUser(demoUser);
    localStorage.setItem('mwt_user', JSON.stringify(demoUser));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mwt_user');
  };

  const updateUserProfile = (data: Partial<AppUser>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('mwt_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithFacebook, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

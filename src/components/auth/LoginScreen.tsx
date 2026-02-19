import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

type Mode = 'social' | 'signin' | 'signup';

export function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('social');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) { toast.error('Please enter your email and password'); return; }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Incorrect email or password'
        : err.code === 'auth/user-not-found'
        ? 'No account found with that email'
        : err.message || 'Sign in failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!email) { toast.error('Please enter your email'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name.trim());
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account already exists with that email — try signing in'
        : err.code === 'auth/invalid-email'
        ? 'Please enter a valid email address'
        : err.message || 'Sign up failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try { await signInWithGoogle(); } catch { toast.error('Google sign-in failed'); }
  };

  const inputClass = "w-full bg-surface-dim border border-gray-200 rounded-input px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm";

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl shadow-md overflow-hidden mb-4 flex items-center justify-center bg-white">
            <img
              src="/icon-512.png"
              alt="Moms Who Trade"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback to SVG if PNG not found
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<svg viewBox="0 0 60 60" class="w-14 h-14" fill="none"><rect x="8" y="30" width="8" height="22" rx="2" fill="#2D2D2D"/><rect x="22" y="20" width="8" height="32" rx="2" fill="#2D2D2D"/><rect x="36" y="10" width="8" height="42" rx="2" fill="#2D2D2D"/><path d="M8 28 L26 18 L40 8" stroke="#D4A5A5" stroke-width="2.5" stroke-linecap="round"/></svg>`;
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-text-primary text-center">Moms Who Trade</h1>
          <p className="text-text-secondary text-center mt-1 text-sm">
            The World's #1 Mom-focused Trading Community
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Social buttons */}
              <div className="flex flex-col gap-3 mb-5">
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 bg-white text-text-primary rounded-pill px-6 py-4 font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[56px]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-text-tertiary font-medium">or use email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('signin')}
                  className="flex-1 py-3 rounded-pill font-semibold text-sm border border-gray-200 bg-white text-text-primary hover:border-text-primary transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className="flex-1 py-3 rounded-pill font-semibold text-sm bg-text-primary text-white hover:opacity-90 transition-all"
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'signin' && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <h2 className="text-lg font-bold text-text-primary mb-1">Welcome back</h2>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                className={inputClass}
                autoComplete="current-password"
              />
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-4 rounded-pill font-semibold bg-text-primary text-white hover:opacity-90 transition-all disabled:opacity-50 min-h-[56px]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                onClick={() => setMode('social')}
                className="text-sm text-text-secondary hover:text-text-primary text-center py-1 transition-colors"
              >
                ← Back to all sign-in options
              </button>
              <button
                onClick={() => { setMode('signup'); }}
                className="text-sm text-accent-primary text-center hover:opacity-80 transition-opacity"
              >
                Don't have an account? Create one
              </button>
            </motion.div>
          )}

          {mode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <h2 className="text-lg font-bold text-text-primary mb-1">Create your account</h2>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
                autoComplete="name"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                className={inputClass}
                autoComplete="new-password"
              />
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full py-4 rounded-pill font-semibold bg-text-primary text-white hover:opacity-90 transition-all disabled:opacity-50 min-h-[56px]"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <button
                onClick={() => setMode('social')}
                className="text-sm text-text-secondary hover:text-text-primary text-center py-1 transition-colors"
              >
                ← Back to all sign-in options
              </button>
              <button
                onClick={() => setMode('signin')}
                className="text-sm text-accent-primary text-center hover:opacity-80 transition-opacity"
              >
                Already have an account? Sign in
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms */}
        <p className="text-center text-xs text-text-tertiary leading-relaxed px-4 mt-6">
          By signing up, you agree to receive marketing emails and accept our{' '}
          <a href="#" className="text-accent-dark underline">Privacy Policy</a>
          {' '}and{' '}
          <a href="#" className="text-accent-dark underline">Terms of Service</a>
        </p>
      </motion.div>
    </div>
  );
}

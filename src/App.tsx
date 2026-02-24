import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAnalytics } from './hooks/useAnalytics';
import { TradesProvider } from './context/TradesContext';
import { GoalsProvider } from './context/GoalsContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingFlow } from './components/auth/OnboardingFlow';
import { BottomNav } from './components/shared/BottomNav';
import { BlogFeed } from './components/blog/BlogFeed';
import { TradingCalculator } from './components/calculator/TradingCalculator';
import { TradeJournal } from './components/journal/TradeJournal';
import { GoalTracker } from './components/goals/GoalTracker';
import { CommunityTab } from './components/community/CommunityTab';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

/**
 * Applies the .dark class to <html> ONLY when the user is inside the main app.
 * Login, onboarding, and the loading splash always render in light mode regardless
 * of the user's saved theme preference.
 *
 * Lives inside both ThemeProvider (for isDark) and AuthProvider (for auth state),
 * so it has everything it needs without coupling those two contexts together.
 */
function DarkModeGate() {
  const { isDark } = useTheme();
  const { user, loading } = useAuth();

  const isMainApp = !loading && !!user?.onboardingComplete;

  useEffect(() => {
    if (isDark && isMainApp) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark, isMainApp]);

  return null;
}

// Fires a page_view event on every client-side route change.
// Must live inside <BrowserRouter> so useLocation() works.
const PAGE_TITLES: Record<string, string> = {
  '/':                    'Home',
  '/calculator':          'Calculator',
  '/journal':             'Journal',
  '/goals':               'Goals',
  '/community-level-up':  'Community – Level Up',
};

function PageViewTracker() {
  const location = useLocation();
  const { track } = useAnalytics();

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? location.pathname;
    track({ name: 'page_view', params: { page_path: location.pathname, page_title: title } });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: isDark ? '#2C2A2D' : '#fff',
          color: isDark ? '#F0EBE7' : '#2D2D2D',
          borderRadius: '12px',
          boxShadow: isDark
            ? '0 4px 16px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(0,0,0,0.1)',
          fontSize: '14px',
          fontWeight: 500,
        },
      }}
    />
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ backgroundColor: '#FDE2D1' }}>
        <img src="/icon.svg" alt="Moms Who Trade" className="w-24 h-24" />
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="md" />
          <p className="text-text-secondary text-sm font-medium">Getting everything ready...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!user.onboardingComplete) {
    return <OnboardingFlow />;
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <PageViewTracker />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<BlogFeed />} />
          <Route path="/calculator" element={<TradingCalculator />} />
          <Route path="/journal" element={<TradeJournal />} />
          <Route path="/goals" element={<GoalTracker />} />
          <Route path="/community-level-up" element={<CommunityTab />} />
          {/* Legacy redirect so any saved link/bookmark still works */}
          <Route path="/community" element={<Navigate to="/community-level-up" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TradesProvider>
            <GoalsProvider>
              <DarkModeGate />
              <AppRoutes />
              <ThemedToaster />
            </GoalsProvider>
          </TradesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

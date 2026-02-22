import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TradesProvider } from './context/TradesContext';
import { GoalsProvider } from './context/GoalsContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingFlow } from './components/auth/OnboardingFlow';
import { BottomNav } from './components/shared/BottomNav';
import { BlogFeed } from './components/blog/BlogFeed';
import { TradingCalculator } from './components/calculator/TradingCalculator';
import { TradeJournal } from './components/journal/TradeJournal';
import { GoalTracker } from './components/goals/GoalTracker';
import { CommunityTab } from './components/community/CommunityTab';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

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
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<BlogFeed />} />
          <Route path="/calculator" element={<TradingCalculator />} />
          <Route path="/journal" element={<TradeJournal />} />
          <Route path="/goals" element={<GoalTracker />} />
          <Route path="/community" element={<CommunityTab />} />
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
      <AuthProvider>
        <TradesProvider>
          <GoalsProvider>
            <AppRoutes />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#fff',
                  color: '#2D2D2D',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  fontSize: '14px',
                  fontWeight: 500,
                },
              }}
            />
          </GoalsProvider>
        </TradesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

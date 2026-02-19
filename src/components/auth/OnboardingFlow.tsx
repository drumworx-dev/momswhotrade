import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';
import { compoundBalance } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

export function OnboardingFlow() {
  const { user, updateUserProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [monthlyGoal, setMonthlyGoal] = useState('1000');
  const [dailyPercent, setDailyPercent] = useState(1);

  const presets = [500, 1000, 2000, 5000];

  const projection30 = compoundBalance(1000, dailyPercent, 30) - 1000;

  const handleComplete = () => {
    updateUserProfile({
      experience,
      monthlyGoal: parseFloat(monthlyGoal) || 1000,
      dailyProfitGoalPercent: dailyPercent,
      onboardingComplete: true,
    });
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="flex flex-col items-center text-center gap-6">
      <div className="text-5xl">👋</div>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Welcome, {user?.displayName?.split(' ')[0]}!
        </h1>
        <p className="text-text-secondary">Let's personalize your trading journey</p>
      </div>
      <Button onClick={() => setStep(1)} size="lg" fullWidth>Get Started</Button>
    </div>,

    // Step 1: Experience
    <div key="experience" className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-1">What's your trading experience?</h2>
        <p className="text-text-secondary text-sm">This helps us personalize your content</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          { value: 'beginner', label: 'Complete Beginner', emoji: '🌱', desc: "I've never made a trade" },
          { value: 'intermediate', label: 'Some Experience', emoji: '📈', desc: "I've traded a few times" },
          { value: 'advanced', label: 'Experienced Trader', emoji: '🚀', desc: 'Trading regularly for 1+ years' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setExperience(opt.value as any)}
            className={`flex items-center gap-4 p-4 rounded-card border-2 transition-all text-left ${
              experience === opt.value
                ? 'border-accent-primary bg-bg-secondary'
                : 'border-gray-200 bg-white hover:border-accent-primary/50'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div>
              <div className="font-semibold text-text-primary">{opt.label}</div>
              <div className="text-sm text-text-secondary">{opt.desc}</div>
            </div>
            {experience === opt.value && (
              <div className="ml-auto w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      <Button onClick={() => setStep(2)} size="lg" fullWidth>Continue</Button>
    </div>,

    // Step 2: Monthly Goal
    <div key="goal" className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-1">What's your monthly income goal?</h2>
        <p className="text-text-secondary text-sm">Set a realistic target for your trading</p>
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold text-lg">$</span>
        <input
          type="number"
          value={monthlyGoal}
          onChange={e => setMonthlyGoal(e.target.value)}
          className="w-full bg-surface-dim border border-gray-200 rounded-input pl-8 pr-4 py-3 text-text-primary text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="1000"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => setMonthlyGoal(p.toString())}
            className={`flex-1 py-2 px-3 rounded-pill text-sm font-medium border transition-all ${
              monthlyGoal === p.toString()
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'bg-white border-gray-200 text-text-secondary hover:border-accent-primary'
            }`}
          >
            ${p >= 1000 ? `${p/1000}k` : p}
          </button>
        ))}
      </div>
      <Button onClick={() => setStep(3)} size="lg" fullWidth>Continue</Button>
    </div>,

    // Step 3: Daily Target
    <div key="daily" className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-1">Set your daily profit goal</h2>
        <p className="text-text-secondary text-sm">Small, consistent gains compound fast</p>
      </div>
      <div className="bg-bg-secondary rounded-card p-4 text-center">
        <div className="text-4xl font-bold text-text-primary">{dailyPercent}%</div>
        <div className="text-text-secondary text-sm mt-1">daily profit target</div>
      </div>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.5"
        value={dailyPercent}
        onChange={e => setDailyPercent(parseFloat(e.target.value))}
        className="w-full accent-accent-primary"
      />
      <div className="flex justify-between text-xs text-text-tertiary">
        <span>0.5% (Conservative)</span>
        <span>5% (Aggressive)</span>
      </div>
      <div className="bg-white rounded-card p-4 shadow-sm">
        <div className="text-sm text-text-secondary text-center mb-1">30-day projection (starting $1,000)</div>
        <div className="text-2xl font-bold text-accent-success text-center">
          +{formatCurrency(projection30)}
        </div>
      </div>
      <Button onClick={() => setStep(4)} size="lg" fullWidth>Continue</Button>
    </div>,

    // Step 4: Complete
    <div key="complete" className="flex flex-col items-center text-center gap-6">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">You're all set!</h2>
        <p className="text-text-secondary">Your personalized trading journey starts now</p>
      </div>
      <a
        href="https://t.me/+0_HXQIvTI5Y2YTQ0"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 bg-white text-text-primary rounded-pill px-6 py-4 font-semibold shadow-sm hover:shadow-md transition-all min-h-[56px]"
      >
        <span className="text-xl">📱</span>
        Join Our Free Telegram Community
      </a>
      <Button onClick={handleComplete} size="lg" fullWidth variant="accent">
        Start Exploring →
      </Button>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col px-6 py-12">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        {/* Progress dots */}
        {step > 0 && (
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-accent-primary w-6' : 'bg-gray-200 w-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Back button */}
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="text-text-secondary text-sm mb-6 flex items-center gap-1 hover:text-text-primary transition-colors"
          >
            ← Back
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

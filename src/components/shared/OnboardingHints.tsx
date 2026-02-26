import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const HINT_FLAG = 'mwt_ob_hints_shown';

interface HintConfig {
  tab: number;      // 0–4 index matching BottomNav order
  message: string;
  subtext: string;
}

// Home · Calculator · Journal · Goals · Level Up
const BEGINNER_HINTS: HintConfig[] = [
  {
    tab: 0,
    message: 'Start here 👋',
    subtext: 'Read tips & strategies before your first trade',
  },
  {
    tab: 4,
    message: 'Join the community',
    subtext: 'Connect with moms who trade',
  },
];

const ADVANCED_HINTS: HintConfig[] = [
  {
    tab: 1,
    message: 'Set up your trades now',
    subtext: 'Calculate position size & risk',
  },
  {
    tab: 3,
    message: 'Track your daily goals',
    subtext: 'Stay consistent with your growth plan',
  },
];

// Horizontal centre of each nav tab as a % within the nav bar
// (justify-around, 5 tabs)
const TAB_X = ['10%', '30%', '50%', '70%', '90%'];

export function OnboardingHints() {
  const { user } = useAuth();
  const [hintIndex, setHintIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // Pick hint sequence based on experience level
  const hints =
    user?.experience === 'beginner' ? BEGINNER_HINTS : ADVANCED_HINTS;

  // Show once — skip if flag already set
  useEffect(() => {
    if (!user?.onboardingComplete) return;
    if (localStorage.getItem(HINT_FLAG)) return;
    setVisible(true);
  }, [user?.onboardingComplete]);

  // Auto-advance after 25 s; dismiss when hints exhausted
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      if (hintIndex < hints.length - 1) {
        setHintIndex(i => i + 1);
      } else {
        dismiss();
      }
    }, 25_000);
    return () => clearTimeout(timer);
  }, [visible, hintIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(HINT_FLAG, '1');
  };

  if (!visible) return null;

  const hint = hints[hintIndex];
  const xPos = TAB_X[hint.tab];

  return (
    // Overlay sits just above the bottom nav (nav ≈ 64 px tall including safe-area)
    <div className="fixed bottom-[68px] left-0 right-0 z-50 pointer-events-none">
      <div className="relative max-w-lg mx-auto h-0">
        <div
          className="absolute bottom-0 pointer-events-auto"
          style={{ left: xPos, transform: 'translateX(-50%)' }}
        >
          {/* Speech bubble */}
          <div className="relative bg-text-primary text-white rounded-xl px-4 py-3 shadow-xl w-[185px]">
            <button
              onClick={dismiss}
              className="absolute top-1.5 right-2.5 text-white opacity-50 hover:opacity-90 text-xs leading-none"
              aria-label="Dismiss hint"
            >
              ✕
            </button>
            <div className="font-semibold text-sm pr-4">{hint.message}</div>
            <div className="text-[11px] opacity-70 mt-0.5 leading-tight">{hint.subtext}</div>

            {/* Step dots */}
            {hints.length > 1 && (
              <div className="flex gap-1 mt-2">
                {hints.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === hintIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Down-pointing arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: -7,
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '7px solid #2D2D2D',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

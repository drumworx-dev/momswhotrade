import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiOverlayProps {
  visible: boolean;
  /** Bold headline in the centre card */
  message: string;
  /** Smaller subtext below the headline (optional) */
  subtext?: string;
  /** Called when the animation finishes (or the user taps to dismiss early) */
  onDone: () => void;
}

const PALETTE = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF922B', '#F06595', '#CC5DE8', '#74C0FC',
  '#63E6BE', '#FFA94D',
];

interface Piece {
  id: number;
  left: number;       // % from left
  delay: number;      // animation-delay seconds
  duration: number;   // animation-duration seconds
  color: string;
  width: number;
  height: number;
  rotate: number;     // initial rotation degrees
  isCircle: boolean;
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2.6 + Math.random() * 1.8,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    width: 6 + Math.floor(Math.random() * 8),
    height: 8 + Math.floor(Math.random() * 10),
    rotate: Math.random() * 360,
    isCircle: Math.random() > 0.72,
  }));
}

export function ConfettiOverlay({ visible, message, subtext, onDone }: ConfettiOverlayProps) {
  // Stable set of pieces for this mount — regenerated each time overlay becomes visible
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pieces = useMemo(() => makePieces(80), [visible]);

  // Auto-dismiss after 3.8 s
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] overflow-hidden"
          onClick={onDone}
        >
          {/* Dark blur backdrop */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

          {/* Confetti pieces */}
          {pieces.map((p) => (
            <div
              key={p.id}
              className="absolute top-0 pointer-events-none"
              style={{
                left: `${p.left}%`,
                width: p.width,
                height: p.isCircle ? p.width : p.height,
                backgroundColor: p.color,
                borderRadius: p.isCircle ? '50%' : 2,
                transform: `rotate(${p.rotate}deg)`,
                animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in both`,
              }}
            />
          ))}

          {/* Central message card — stop propagation so tapping it doesn't dismiss */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 18 }}
              className="bg-white rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center gap-4 mx-6 max-w-xs w-full"
            >
              {/* Green tick circle */}
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path
                    d="M7 15.5L12.5 21L23 10"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="text-text-primary font-bold text-xl text-center leading-snug">
                {message}
              </p>

              {subtext && (
                <p className="text-text-secondary text-sm text-center leading-snug">{subtext}</p>
              )}

              <p className="text-text-tertiary text-xs mt-1">Tap anywhere to continue</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

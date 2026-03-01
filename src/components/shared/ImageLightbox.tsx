import { useRef, useState } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

function touchDist(a: Touch, b: Touch) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

export function ImageLightbox({ src, alt = '', onClose }: ImageLightboxProps) {
  const [scale, setScale]   = useState(1);
  const [tx, setTx]         = useState(0); // content-space X offset
  const [ty, setTy]         = useState(0); // content-space Y offset

  // Refs for gesture tracking (no re-render needed)
  const pinchDist0  = useRef<number | null>(null);
  const pinchScale0 = useRef(1);
  const panOrigin   = useRef<{ x: number; y: number } | null>(null);
  const lastTap     = useRef(0);

  const resetZoom = () => { setScale(1); setTx(0); setTy(0); };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchDist0.current  = touchDist(e.touches[0], e.touches[1]);
      pinchScale0.current = scale;
      panOrigin.current   = null;
    } else if (e.touches.length === 1) {
      // Double-tap: toggle between 1× and 2.5×
      const now = Date.now();
      if (now - lastTap.current < 280) {
        scale > 1.1 ? resetZoom() : setScale(2.5);
      }
      lastTap.current = now;
      panOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // block page scroll while interacting
    if (e.touches.length === 2 && pinchDist0.current !== null) {
      const newDist  = touchDist(e.touches[0], e.touches[1]);
      const newScale = Math.min(
        Math.max(pinchScale0.current * (newDist / pinchDist0.current), 1),
        5,
      );
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1 && panOrigin.current) {
      const dx = e.touches[0].clientX - panOrigin.current.x;
      const dy = e.touches[0].clientY - panOrigin.current.y;
      // delta is in screen-space; divide by scale to get content-space offset
      setTx(x => x + dx / scale);
      setTy(y => y + dy / scale);
      panOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchDist0.current = null;
    if (e.touches.length === 0) {
      panOrigin.current = null;
      if (scale < 1.1) resetZoom(); // snap back to 1× if barely zoomed
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Image area — stop propagation so tapping the image doesn't close */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{ touchAction: 'none', userSelect: 'none' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            // scale(s) translate(x, y): translate is in content-space (before scale)
            transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
            transformOrigin: 'center center',
            // Smooth snap-back animation only when returning to rest
            transition: scale <= 1 ? 'transform 0.25s ease' : undefined,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      </div>

      {/* Gesture hint — fades after first zoom */}
      {scale <= 1 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-white/50 text-xs bg-black/30 rounded-full px-3 py-1.5">
            Pinch or double-tap to zoom · tap outside to close
          </span>
        </div>
      )}
    </div>
  );
}

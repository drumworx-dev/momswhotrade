import { useRef, useState } from 'react';
import { X, ImageDown, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Trade } from '../../types';
import { PnLShareCard } from './PnLShareCard';

interface ShareCardModalProps {
  trade: Trade;
  onClose: () => void;
}

async function captureCard(el: HTMLDivElement): Promise<Blob> {
  const canvas = await html2canvas(el, {
    scale: 3, // → 1200×1200 crisp PNG
    useCORS: true,
    backgroundColor: null,
    logging: false,
    allowTaint: false,
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/png',
    );
  });
}

/** True on iOS Safari / Chrome iOS — <a download> is broken there */
function isIOS() {
  return (
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  );
}

export function ShareCardModal({ trade, onClose }: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'sharing'>('idle');

  const tokenName = (trade.token || 'Trade').toUpperCase();
  const fileName  = `MWT-${tokenName}-${trade.direction?.toUpperCase()}-PnL.png`;

  /** Save to Photos on iOS via share sheet; direct download on desktop */
  async function handleSave() {
    if (!cardRef.current || status !== 'idle') return;
    setStatus('saving');
    try {
      const blob = await captureCard(cardRef.current);
      const file = new File([blob], fileName, { type: 'image/png' });

      if (isIOS() && navigator.canShare?.({ files: [file] })) {
        // On iOS the only way to land in Photos is the native share sheet
        await navigator.share({ files: [file] });
      } else {
        // Desktop / Android — trigger a normal download
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Save failed:', err);
      }
    } finally {
      setStatus('idle');
    }
  }

  /** Native share with caption — works on both iOS and Android */
  async function handleShare() {
    if (!cardRef.current || status !== 'idle') return;
    setStatus('sharing');
    try {
      const blob = await captureCard(cardRef.current);
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${tokenName} Trade — Moms Who Trade`,
          text: 'Check out my trade result 👇\nmomswhotrade.co',
        });
      } else {
        // Desktop fallback — just download
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setStatus('idle');
    }
  }

  const busy           = status !== 'idle';
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:w-auto bg-bg-primary rounded-t-[28px] sm:rounded-[28px] p-5 pb-safe flex flex-col items-center gap-5 shadow-lg">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-secondary p-1 rounded-full"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-base font-bold text-text-primary pt-1">Share Your Trade</h2>

        {/* Card preview */}
        <div className="overflow-hidden rounded-[24px] shadow-md">
          <PnLShareCard ref={cardRef} trade={trade} />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full max-w-[400px]">
          {/* Save to Photos / Download */}
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill border-2 border-accent-primary text-accent-dark font-semibold text-sm disabled:opacity-50 transition-opacity active:scale-[0.98]"
          >
            <ImageDown size={16} />
            {status === 'saving'
              ? 'Saving…'
              : isIOS() ? 'Save to Photos' : 'Download PNG'}
          </button>

          {/* Share (native share sheet) */}
          {canNativeShare && (
            <button
              onClick={handleShare}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill bg-accent-primary text-white font-semibold text-sm disabled:opacity-50 transition-opacity active:scale-[0.98]"
            >
              <Share2 size={16} />
              {status === 'sharing' ? 'Preparing…' : 'Share'}
            </button>
          )}
        </div>

        <p className="text-xs text-text-tertiary text-center leading-relaxed">
          {isIOS()
            ? 'Tap "Save to Photos" then post on Instagram, X, Facebook or LinkedIn'
            : 'Download the PNG then post on Instagram, X, Facebook or LinkedIn'}
        </p>
      </div>
    </div>
  );
}

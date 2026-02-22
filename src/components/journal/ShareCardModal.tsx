import { useRef, useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Trade } from '../../types';
import { PnLShareCard } from './PnLShareCard';

interface ShareCardModalProps {
  trade: Trade;
  onClose: () => void;
}

async function captureCard(el: HTMLDivElement): Promise<Blob> {
  const canvas = await html2canvas(el, {
    scale: 3, // 3× for crisp social-media quality (1200×1200)
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/png',
    );
  });
}

export function ShareCardModal({ trade, onClose }: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const tokenName = (trade.token || 'Trade').toUpperCase();
  const fileName = `MWT-${tokenName}-${trade.direction?.toUpperCase()}-PnL.png`;

  async function handleShare() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const blob = await captureCard(cardRef.current);

      // Native share sheet (mobile PWA)
      if (navigator.canShare?.({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], fileName, { type: 'image/png' })],
          title: `${tokenName} Trade Result — Moms Who Trade`,
          text: `Check out my trade on momswhotrade.co`,
        });
      } else {
        // Desktop fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // User cancelled share or export failed — silently ignore cancel
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setExporting(false);
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const blob = await captureCard(cardRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setExporting(false);
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:w-auto bg-bg-primary rounded-t-[28px] sm:rounded-[28px] p-5 pb-safe flex flex-col items-center gap-5 shadow-lg">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-secondary p-1 rounded-full"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-base font-bold text-text-primary pt-1">Share Your Trade</h2>

        {/* Card preview — rendered at natural 400px size */}
        <div className="overflow-hidden rounded-[24px] shadow-md">
          <PnLShareCard ref={cardRef} trade={trade} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full max-w-[400px]">
          {/* Download always available */}
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill border-2 border-accent-primary text-accent-dark font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            <Download size={16} />
            Save Image
          </button>

          {/* Share button — native share on mobile, hidden on desktop where download is sufficient */}
          {canNativeShare && (
            <button
              onClick={handleShare}
              disabled={exporting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill bg-accent-primary text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
            >
              <Share2 size={16} />
              {exporting ? 'Preparing…' : 'Share'}
            </button>
          )}

          {!canNativeShare && (
            <button
              onClick={handleShare}
              disabled={exporting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill bg-accent-primary text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
            >
              <Download size={16} />
              {exporting ? 'Exporting…' : 'Export PNG'}
            </button>
          )}
        </div>

        <p className="text-xs text-text-tertiary text-center">
          Save to Photos then post on Instagram, Facebook, X or LinkedIn
        </p>
      </div>
    </div>
  );
}

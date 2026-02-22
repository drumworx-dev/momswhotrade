import { useEffect, useRef, useState } from 'react';
import { X, ImageDown, Share2 } from 'lucide-react';
import type { Trade } from '../../types';
import { generatePnLCard } from './generatePnLCard';

interface ShareCardModalProps {
  trade: Trade;
  onClose: () => void;
}

/** True on iOS Safari / Chrome iOS where <a download> is broken */
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

async function getExportBlob(trade: Trade): Promise<Blob> {
  const canvas = await generatePnLCard(trade, 3); // 1200×1200
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
    );
  });
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ShareCardModal({ trade, onClose }: ShareCardModalProps) {
  const previewRef  = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'sharing'>('idle');
  const [preview, setPreview] = useState(false);

  const tokenName = (trade.token || 'Trade').toUpperCase();
  const fileName  = `MWT-${tokenName}-${trade.direction?.toUpperCase()}-PnL.png`;

  // Draw preview canvas once on mount (scale=1 → 400×400)
  useEffect(() => {
    let cancelled = false;
    generatePnLCard(trade, 1).then((offscreen) => {
      if (cancelled || !previewRef.current) return;
      const ctx = previewRef.current.getContext('2d')!;
      ctx.drawImage(offscreen, 0, 0);
      setPreview(true);
    });
    return () => { cancelled = true; };
  }, [trade]);

  async function handleSave() {
    if (status !== 'idle') return;
    setStatus('saving');
    try {
      const blob = await getExportBlob(trade);
      const file = new File([blob], fileName, { type: 'image/png' });

      if (isIOS() && navigator.canShare?.({ files: [file] })) {
        // iOS: share sheet → "Save Image" → Photos
        // Send files only — no text/url so apps like Slack don't grab a link instead
        await navigator.share({ files: [file] });
      } else {
        triggerDownload(blob, fileName);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') console.error(err);
    } finally {
      setStatus('idle');
    }
  }

  async function handleShare() {
    if (status !== 'idle') return;
    setStatus('sharing');
    try {
      const blob = await getExportBlob(trade);
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        // Files only — omitting title/text prevents apps from preferring a link
        await navigator.share({ files: [file] });
      } else {
        triggerDownload(blob, fileName);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') console.error(err);
    } finally {
      setStatus('idle');
    }
  }

  const busy           = status !== 'idle';
  const canNativeShare = !!navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:w-auto bg-bg-primary rounded-t-[28px] sm:rounded-[28px] p-5 pb-safe flex flex-col items-center gap-5 shadow-lg">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-secondary p-1 rounded-full"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-base font-bold text-text-primary pt-1">Share Your Trade</h2>

        {/* Canvas preview — same drawing code as export, guaranteed match */}
        <div
          className="shadow-md"
          style={{ borderRadius: 24, overflow: 'hidden', lineHeight: 0 }}
        >
          <canvas
            ref={previewRef}
            width={400}
            height={400}
            style={{
              display: 'block',
              width: 400,
              height: 400,
              opacity: preview ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          />
        </div>

        <div className="flex gap-3 w-full max-w-[400px]">
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill border-2 border-accent-primary text-accent-dark font-semibold text-sm disabled:opacity-50 transition-opacity active:scale-[0.98]"
          >
            <ImageDown size={16} />
            {status === 'saving' ? 'Saving…' : isIOS() ? 'Save to Photos' : 'Download PNG'}
          </button>

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
            ? 'Save to Photos then post on Instagram, X, Facebook or LinkedIn'
            : 'Download the PNG then post on Instagram, X, Facebook or LinkedIn'}
        </p>
      </div>
    </div>
  );
}

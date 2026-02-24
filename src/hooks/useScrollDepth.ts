import { useEffect, useRef, type RefObject } from 'react';
import { useAnalytics } from './useAnalytics';

const MILESTONES = [25, 50, 75, 100] as const;

/**
 * Fires feed_scroll_depth analytics events at 25 / 50 / 75 / 100 % thresholds.
 *
 * Pass a ref to the overflow-y-auto container you want to measure.
 * `tab` is a label that appears in the GA4 event so you can filter by screen/section.
 * `resetKey` — when this value changes, milestone tracking resets (e.g. on tab switch).
 *
 * Usage:
 *   const feedRef = useRef<HTMLDivElement>(null);
 *   useScrollDepth(feedRef, 'Latest', activeTab);
 *   <div ref={feedRef} className="overflow-y-auto">…</div>
 */
export function useScrollDepth(
  containerRef: RefObject<HTMLElement | null>,
  tab: string,
  resetKey: unknown = tab,
) {
  const { track } = useAnalytics();
  const firedRef  = useRef<Set<number>>(new Set());

  // Clear milestones whenever the tracked content changes (tab switch, etc.)
  useEffect(() => {
    firedRef.current.clear();
  }, [resetKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) return;
      const pct = (scrollTop / scrollable) * 100;

      for (const m of MILESTONES) {
        if (pct >= m && !firedRef.current.has(m)) {
          firedRef.current.add(m);
          track({ name: 'feed_scroll_depth', params: { depth_pct: m, tab } });
        }
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
    // Re-attach when tab changes so the closure captures the updated tab label
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
}

import { useCallback } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../config/firebase';

/**
 * Thin wrapper around Firebase Analytics logEvent.
 * Resolves the analytics promise once, then calls logEvent synchronously.
 * All custom MWT events are typed below — add new ones here as the app grows.
 */

type MwtEvent =
  | { name: 'page_view';            params: { page_path: string; page_title: string } }
  | { name: 'article_read';         params: { article_title: string; article_tag: string } }
  | { name: 'position_calculated';  params: { asset: string; category: string; direction: string } }
  | { name: 'trade_taken';          params: { asset: string; category: string; rr: string } }
  | { name: 'trade_saved_journal';  params: { asset: string; category: string } }
  | { name: 'pnl_card_shared';      params: { method: 'share_sheet' | 'download' } }
  | { name: 'goal_settings_saved';  params: { daily_goal_pct: number; exclude_weekends: boolean; exclude_holidays: boolean } }
  | { name: 'whop_product_tapped';  params: { product_title: string; plan_id: string } };

export function useAnalytics() {
  const track = useCallback((event: MwtEvent) => {
    // Resolve analytics (Promise<Analytics | null>) and fire — never throws.
    analytics
      .then(a => {
        if (!a) return;
        logEvent(a, event.name as string, event.params);
      })
      .catch(() => { /* silently ignore analytics failures */ });
  }, []);

  return { track };
}

import { useCallback } from 'react';
import { logEvent, setUserProperties } from 'firebase/analytics';
import { analytics } from '../config/firebase';

/**
 * Thin wrapper around Firebase Analytics logEvent + setUserProperties.
 * All custom MWT events and user properties are typed here.
 * Add new ones as the app grows — the union enforces consistent naming.
 */

// ── Events ───────────────────────────────────────────────────────────────────

type MwtEvent =
  // Auth funnel
  | { name: 'login_screen_viewed' }
  | { name: 'sign_up';                   params: { method: 'email' | 'google' | 'facebook' } }
  | { name: 'login';                     params: { method: 'email' | 'google' | 'facebook' } }
  // Onboarding funnel
  | { name: 'onboarding_started' }
  | { name: 'onboarding_step_completed'; params: { step: number; step_name: string } }
  | { name: 'onboarding_completed';      params: { experience: string; monthly_goal_bucket: string; email_consent: 'yes' | 'no' } }
  // Navigation
  | { name: 'page_view';                 params: { page_path: string; page_title: string } }
  // Content
  | { name: 'article_read';              params: { article_title: string; article_tag: string } }
  // Calculator
  | { name: 'position_calculated';       params: { asset: string; category: string; direction: string } }
  | { name: 'trade_taken';               params: { asset: string; category: string; rr: string } }
  | { name: 'trade_saved_journal';       params: { asset: string; category: string } }
  // Journal
  | { name: 'pnl_card_shared';           params: { method: 'share_sheet' | 'download' } }
  // Goals
  | { name: 'goal_settings_saved';       params: { daily_goal_pct: number; exclude_weekends: boolean; exclude_holidays: boolean } }
  // Level Up
  | { name: 'whop_product_tapped';       params: { product_title: string; plan_id: string } };

// ── User Properties ──────────────────────────────────────────────────────────
// Persisted on the Analytics user — appear as dimensions in every GA4 report.

export type MwtUserProps = {
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  email_consent?:    'yes' | 'no';
  monthly_goal_bucket?: '<$500' | '$500-$999' | '$1k-$1,999' | '$2k-$4,999' | '$5k+';
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalytics() {
  const track = useCallback((event: MwtEvent) => {
    analytics
      .then(a => {
        if (!a) return;
        // Firebase logEvent has strict overloads for standard event names (sign_up, login,
        // page_view …) that conflict with the generic string overload. Type safety is
        // already enforced by the MwtEvent union at every call site, so we cast here to
        // let Firebase's runtime handle all names uniformly.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logEvent(a, event.name as any, (event as any).params ?? {});
      })
      .catch(() => { /* never surface analytics errors */ });
  }, []);

  const setUserProps = useCallback((props: MwtUserProps) => {
    analytics
      .then(a => {
        if (!a) return;
        setUserProperties(a, props as Record<string, string>);
      })
      .catch(() => {});
  }, []);

  return { track, setUserProps };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Bucket a raw monthly goal dollar amount into a GA4-safe string dimension. */
export function monthlyGoalBucket(goal: number): MwtUserProps['monthly_goal_bucket'] {
  if (goal < 500)  return '<$500';
  if (goal < 1000) return '$500-$999';
  if (goal < 2000) return '$1k-$1,999';
  if (goal < 5000) return '$2k-$4,999';
  return '$5k+';
}

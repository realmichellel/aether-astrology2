// A birth form filled in before signing up. Held in the browser until the
// person has an account, then written to their profile so nothing is retyped.

import { trackPixelCustom } from "./meta-pixel";

export type BirthDraft = {
  full_name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  birth_lat: number;
  birth_lng: number;
  saved_at: string;
};

const KEY = "aether_birth_draft";

export function saveBirthDraft(draft: Omit<BirthDraft, "saved_at">) {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...draft, saved_at: new Date().toISOString() }),
    );
  } catch {
    /* storage unavailable — the person simply re-enters after signup */
  }
}

export function readBirthDraft(): BirthDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BirthDraft;
    if (!parsed?.birth_date || typeof parsed.birth_lat !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearBirthDraft() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Funnel steps, in order. Each is mirrored to Meta (pixel + Conversions API)
 * so drop-off between steps is visible in Events Manager.
 */
export type FunnelStep =
  | "LandingCTA"
  | "BirthFormViewed"
  | "BirthFormStarted"
  | "BirthFormSubmitted"
  | "AuthViewed"
  | "AuthCompleted"
  | "ChartCreated";

export function trackFunnel(step: FunnelStep, params?: Record<string, unknown>) {
  trackPixelCustom(`Funnel${step}`, { funnel: "signup", step, ...params });
}

// Meta (Facebook) Pixel — browser pixel + server-side Conversions API mirror.
// Every event is sent twice with a shared event_id so Meta deduplicates them.

import { sendMetaCapiEvent } from "./meta-capi.functions";

export const META_PIXEL_ID = "120250803090400374";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

let initialized = false;

export function initMetaPixel() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    f.fbq = n;
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable @typescript-eslint/no-explicit-any */

  window.fbq?.("init", META_PIXEL_ID);
  track("PageView");
}

// --- identity + browser cookies used to match server events ------------------

let identity: { email?: string; externalId?: string } = {};

/** Called after sign-in so server-side events can be matched to a person. */
export function setMetaIdentity(next: { email?: string; externalId?: string }) {
  identity = { ...identity, ...next };
}

export function clearMetaIdentity() {
  identity = {};
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mirrorToCapi(event: string, eventId: string, params?: Record<string, unknown>) {
  void sendMetaCapiEvent({
    data: {
      eventName: event,
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: window.location.href,
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.externalId ? { externalId: identity.externalId } : {}),
      ...(readCookie("_fbp") ? { fbp: readCookie("_fbp")! } : {}),
      ...(readCookie("_fbc") ? { fbc: readCookie("_fbc")! } : {}),
      ...(params ? { customData: params } : {}),
    },
  }).catch(() => {
    /* analytics must never break the app */
  });
}

function track(event: string, params?: Record<string, unknown>, custom = false) {
  if (typeof window === "undefined") return;
  const eventId = newEventId();
  window.fbq?.(custom ? "trackCustom" : "track", event, params ?? {}, { eventID: eventId });
  mirrorToCapi(event, eventId, params);
}

/** Standard Meta events (PageView, Lead, Purchase, …). */
export function trackPixel(event: string, params?: Record<string, unknown>) {
  track(event, params, false);
}

/** Custom events that have no Meta standard equivalent. */
export function trackPixelCustom(event: string, params?: Record<string, unknown>) {
  track(event, params, true);
}

export function trackPageView(path: string) {
  trackPixel("PageView", { page_path: path });
}

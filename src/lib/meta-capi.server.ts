import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

export type MetaCapiInput = {
  eventName: string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  email?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  customData?: Record<string, unknown>;
};

const MAX_STR = 512;

function clean(value: unknown, max = MAX_STR): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export function validateMetaCapiInput(data: MetaCapiInput): MetaCapiInput {
  const eventName = clean(data.eventName, 64);
  const eventId = clean(data.eventId, 128);
  if (!eventName || !eventId) throw new Error("eventName and eventId are required");
  const sourceUrl = clean(data.eventSourceUrl, 1024);
  const email = clean(data.email, 254);
  const externalId = clean(data.externalId, 128);
  const fbp = clean(data.fbp, 128);
  const fbc = clean(data.fbc, 256);
  return {
    eventName,
    eventId,
    ...(typeof data.eventTime === "number" ? { eventTime: data.eventTime } : {}),
    ...(sourceUrl ? { eventSourceUrl: sourceUrl } : {}),
    ...(email ? { email } : {}),
    ...(externalId ? { externalId } : {}),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...(data.customData && typeof data.customData === "object"
      ? { customData: data.customData as Record<string, unknown> }
      : {}),
  };
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Forwards one event to Meta's Conversions API. Never throws. */
export async function forwardMetaCapiEvent(data: MetaCapiInput) {
  const pixelId = process.env["META_PIXEL_ID"] ?? "120250803090400374";
  const token = process.env["META_CAPI_ACCESS_TOKEN"];
  if (!token) return { ok: false as const, skipped: "missing_token" as const };

  const userData: Record<string, unknown> = {};
  if (data.email) userData["em"] = [await sha256(data.email.toLowerCase())];
  if (data.externalId) userData["external_id"] = [await sha256(data.externalId)];
  if (data.fbp) userData["fbp"] = data.fbp;
  if (data.fbc) userData["fbc"] = data.fbc;

  const clientIp = getRequestIP({ xForwardedFor: true });
  if (clientIp) userData["client_ip_address"] = clientIp;
  const userAgent = getRequestHeader("user-agent");
  if (userAgent) userData["client_user_agent"] = userAgent;

  const payload = {
    data: [
      {
        event_name: data.eventName,
        event_time: data.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: data.eventId,
        action_source: "website",
        ...(data.eventSourceUrl ? { event_source_url: data.eventSourceUrl } : {}),
        user_data: userData,
        ...(data.customData ? { custom_data: data.customData } : {}),
      },
    ],
    ...(process.env["META_CAPI_TEST_EVENT_CODE"]
      ? { test_event_code: process.env["META_CAPI_TEST_EVENT_CODE"] }
      : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error("[meta-capi] rejected", res.status, (await res.text()).slice(0, 500));
      return { ok: false as const };
    }
    return { ok: true as const };
  } catch (error) {
    console.error("[meta-capi] request failed", error);
    return { ok: false as const };
  }
}

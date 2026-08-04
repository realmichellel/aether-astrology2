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


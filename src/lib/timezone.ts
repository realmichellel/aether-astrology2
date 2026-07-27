// src/lib/timezone.ts
//
// Getting this right matters more than it might look: the ascendant moves
// ~1° every 4 minutes, so a 1-hour timezone/DST error can shift the rising
// sign by ~15° — often into a neighboring sign entirely. A naive
// "longitude / 15 = UTC offset" approximation is not good enough.
//
// Requires: npm install tz-lookup
import tzlookup from "tz-lookup";

/** Resolves the IANA time zone in effect at a given birth location. */
export function resolveTimeZone(lat: number, lon: number): string {
  return tzlookup(lat, lon);
}

/**
 * Converts a birth date + local wall-clock time into a precise UTC instant,
 * using the *historical* offset (including any DST rule in effect on that
 * date) for the given IANA zone. Uses only the runtime's built-in Intl time
 * zone database — no extra dependency needed for the DST math itself.
 */
export function localWallTimeToUtc(
  isoDate: string, // "YYYY-MM-DD"
  isoTime: string | null, // "HH:MM", or null if unknown
  timeZone: string,
): { utc: Date; timeIsApproximate: boolean } {
  const timeIsApproximate = !isoTime;
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hour, minute] = (isoTime ?? "12:00").split(":").map(Number);

  // Two-pass convergence: guess a UTC instant assuming 0 offset, read back
  // the actual offset the zone has at that instant, then correct. DST
  // offsets only take a handful of discrete values, so two passes always
  // converge (a single pass can be wrong right at a DST transition).
  let guess = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 2; i++) {
    const offsetMinutes = getOffsetMinutes(new Date(guess), timeZone);
    guess = Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000;
  }

  return { utc: new Date(guess), timeIsApproximate };
}

function getOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" });
  const part = dtf.formatToParts(date).find((p) => p.type === "timeZoneName");
  // e.g. "GMT-05:00" or "GMT+9"
  const match = part?.value.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1].startsWith("-") ? -1 : 1;
  const hours = Math.abs(parseInt(match[1], 10));
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return sign * (hours * 60 + minutes);
}
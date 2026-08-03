// src/lib/geocode.server.ts
//
// Geocodes a free-text birth place ("Casablanca, Morocco") to coordinates
// using OpenStreetMap's Nominatim. Nominatim's usage policy requires a
// descriptive User-Agent and caps anonymous usage at ~1 request/sec, which is
// fine here since this only runs once per user, at onboarding, and the
// result is cached on the profile row (birth_lat/birth_lng) afterward.
//
// Swap this out for a paid geocoder (Google, Mapbox, etc.) if you need higher
// volume or better disambiguation of ambiguous place names.
export async function geocodePlace(place: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    place,
  )}`;

  const res = await fetch(url, {
    headers: {
      // Replace with a real contact address before shipping — Nominatim will
      // block traffic that doesn't identify itself.
      "User-Agent": "Aether/1.0 (astrology app; contact: support@aether.app)",
    },
  });
  if (!res.ok) return null;

  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!results.length) return null;

  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
}

/**
 * Typeahead search for cities/towns. Restricted to populated places so users
 * can only pick a real, geocoded location — free-text birth places (and the
 * silently-wrong charts they produce) are no longer possible.
 */
export async function searchPlaces(
  query: string,
): Promise<Array<{ label: string; lat: number; lon: number }>> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1` +
    `&featureType=city&accept-language=en&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Aether/1.0 (astrology app; contact: support@aetherhoroscope.com)",
    },
  });
  if (!res.ok) return [];

  const results = (await res.json()) as Array<{
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
    address?: Record<string, string>;
  }>;

  const seen = new Set<string>();
  const out: Array<{ label: string; lat: number; lon: number }> = [];
  for (const r of results) {
    const a = r.address ?? {};
    const city = r.name || a.city || a.town || a.village || a.municipality;
    const region = a.state || a.region || a.county;
    const country = a.country;
    const label = [city, region, country].filter(Boolean).join(", ") || r.display_name;
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ label, lat: parseFloat(r.lat), lon: parseFloat(r.lon) });
  }
  return out;
}
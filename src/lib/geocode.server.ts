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
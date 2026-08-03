import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sunSignFor } from "./astrology";
import { geocodePlace } from "./geocode.server";
import { resolveTimeZone, localWallTimeToUtc } from "./timezone";
import { computeBirthChart } from "./birth-chart";
import { z } from "zod";

const ProfileInput = z.object({
  full_name: z.string().min(1).max(120),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, "Birth time is required (HH:MM)."),
  birth_place: z.string().min(1).max(200),
  // Supplied by the city picker. When present we trust these exact
  // coordinates instead of re-geocoding the label.
  birth_lat: z.number().min(-90).max(90).optional(),
  birth_lng: z.number().min(-180).max(180).optional(),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const getBirthChart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    if (data.birth_lat == null || data.birth_lng == null || !data.timezone || !data.birth_time) {
      return { profile: data, chart: null };
    }
    const { utc } = localWallTimeToUtc(data.birth_date, data.birth_time, data.timezone);
    const chart = computeBirthChart({
      utcDate: utc,
      latitude: Number(data.birth_lat),
      longitude: Number(data.birth_lng),
      timeIsKnown: true,
    });
    return { profile: data, chart };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const sun = sunSignFor(data.birth_date);

    // Coordinates come from the city picker. If a client somehow submits a
    // bare label we fall back to geocoding it, and refuse the save when the
    // place can't be resolved — an unlocatable birth place means an
    // unknowable chart, not a chart with blank fields.
    const coords =
      data.birth_lat != null && data.birth_lng != null
        ? { lat: data.birth_lat, lon: data.birth_lng }
        : await geocodePlace(data.birth_place);
    if (!coords) {
      throw new Error(
        `Couldn't locate "${data.birth_place}". Pick a city from the dropdown list so Aether has exact coordinates.`,
      );
    }

    const birth_lat = coords.lat;
    const birth_lng = coords.lon;
    const timezone = resolveTimeZone(coords.lat, coords.lon);
    const { utc } = localWallTimeToUtc(data.birth_date, data.birth_time, timezone);

    const chart = computeBirthChart({
      utcDate: utc,
      latitude: coords.lat,
      longitude: coords.lon,
      timeIsKnown: true,
    });

    const moon_sign = chart.planets.find((p) => p.body === "Moon")?.name ?? null;
    const rising_sign = chart.ascendant?.name ?? null;
    const planetSummary = chart.planets.map((p) => `${p.body} in ${p.name}`).join(", ");
    const chart_summary = `${planetSummary}, Ascendant in ${chart.ascendant!.name}, Midheaven in ${chart.midheaven!.name}`;

    const { error } = await context.supabase.from("profiles").upsert(
      {
        user_id: context.userId,
        full_name: data.full_name,
        birth_date: data.birth_date,
        birth_time: data.birth_time,
        birth_place: data.birth_place,
        birth_lat,
        birth_lng,
        timezone,
        sun_sign: sun.name,
        moon_sign,
        rising_sign,
        chart_summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, sun_sign: sun.name, moon_sign, rising_sign };
  });
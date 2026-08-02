import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { geocodePlace } from "./geocode.server";
import { resolveTimeZone, localWallTimeToUtc } from "./timezone";
import { computeBirthChart, type PlanetPlacement } from "./birth-chart";
import { sunSignFor } from "./astrology";
import { computeAspects, scoreFromAspects, buildCategoryContext } from "./synastry";

const PartnerInput = z.object({
  full_name: z.string().min(1).max(120),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, "Birth time is required (HH:MM)."),
  birth_place: z.string().min(1).max(200),
});

type Placements = {
  name: string;
  sun: string;
  moon: string;
  rising: string;
  venus: string;
  mars: string;
  mercury: string;
};

// computePlacements now also returns the raw planet longitudes, since the
// summarized sign-name Placements alone can't support aspect calculation —
// aspects are derived from the actual degree separation between planets.
async function computePlacements(
  input: z.infer<typeof PartnerInput>,
): Promise<{ placements: Placements; planets: PlanetPlacement[] }> {
  const coords = await geocodePlace(input.birth_place);
  if (!coords) {
    throw new Error(
      `Couldn't locate "${input.birth_place}". Try adding a country or region (e.g. "Springfield, Illinois, USA").`,
    );
  }
  const timezone = resolveTimeZone(coords.lat, coords.lon);
  const { utc } = localWallTimeToUtc(input.birth_date, input.birth_time, timezone);
  const chart = computeBirthChart({
    utcDate: utc,
    latitude: coords.lat,
    longitude: coords.lon,
    timeIsKnown: true,
  });
  const get = (body: string) => chart.planets.find((p) => p.body === body)?.name ?? "Unknown";
  const placements: Placements = {
    name: input.full_name,
    sun: get("Sun") !== "Unknown" ? get("Sun") : sunSignFor(input.birth_date).name,
    moon: get("Moon"),
    rising: chart.ascendant?.name ?? "Unknown",
    venus: get("Venus"),
    mars: get("Mars"),
    mercury: get("Mercury"),
  };
  return { placements, planets: chart.planets };
}

function extractSign(summary: string | null, body: string): string {
  if (!summary) return "Unknown";
  const m = summary.match(new RegExp(`${body} in (\\w+)`));
  return m?.[1] ?? "Unknown";
}

type Report = {
  overall_score: number;
  dynamic_summary: string;
  emotional_bond: { text: string; stars: number };
  chemistry_and_attraction: { text: string; stars: number };
  communication_style: { text: string; stars: number };
  potential_friction_points: string[];
  super_powers: string[];
  crush_cheat_sheet: {
    green_flags: string[];
    red_flags: string[];
    how_to_give_them_butterflies: string;
  };
};

function parseJson(text: string): Report {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as Report;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as Report;
    }
    throw new Error("The Oracle returned an unreadable report. Try again.");
  }
}

export const generateCompatibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PartnerInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) throw new Error("Set up your own natal chart first.");

    // Aspect calculation needs person1's real planetary longitudes, not just
    // the sign names stored on the profile row — so the chart is recomputed
    // here from the stored birth data rather than parsed from chart_summary.
    if (!profile.birth_lat || !profile.birth_lng || !profile.timezone || !profile.birth_time) {
      throw new Error(
        "Your own chart is missing precise birth data — add your birth time and place in Settings first.",
      );
    }

    const { utc: person1Utc } = localWallTimeToUtc(
      profile.birth_date,
      profile.birth_time,
      profile.timezone,
    );
    const person1Chart = computeBirthChart({
      utcDate: person1Utc,
      latitude: Number(profile.birth_lat),
      longitude: Number(profile.birth_lng),
      timeIsKnown: true,
    });

    const person1: Placements = {
      name: profile.full_name ?? "You",
      sun: profile.sun_sign ?? "Unknown",
      moon: profile.moon_sign ?? "Unknown",
      rising: profile.rising_sign ?? "Unknown",
      venus: extractSign(profile.chart_summary, "Venus"),
      mars: extractSign(profile.chart_summary, "Mars"),
      mercury: extractSign(profile.chart_summary, "Mercury"),
    };

    const { placements: person2, planets: person2Planets } = await computePlacements(data);

    const aspects = computeAspects(person1Chart.planets, person2Planets);
    const overallBaseline = scoreFromAspects(aspects);

    const emotionalCtx = buildCategoryContext(aspects, "emotional_bond");
    const chemistryCtx = buildCategoryContext(aspects, "chemistry_and_attraction");
    const commCtx = buildCategoryContext(aspects, "communication_style");

    const overallAspectSummary =
      aspects
        .slice(0, 8)
        .map((a) => `${a.body1}-${a.body2} ${a.aspect} (orb ${a.orb.toFixed(1)}°, ${a.nature})`)
        .join("; ") || "No major aspects within orb.";

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const system =
      "You are an expert, empathetic, and modern astrologer. Keep the tone insightful, engaging, modern, and avoid archaic jargon. Respond with ONLY valid JSON — no markdown fences, no commentary.";

    const prompt = `Generate a relationship synastry report for:
- Person 1: ${person1.name} (Sun: ${person1.sun}, Moon: ${person1.moon}, Rising: ${person1.rising}, Venus: ${person1.venus}, Mars: ${person1.mars}, Mercury: ${person1.mercury})
- Person 2: ${person2.name} (Sun: ${person2.sun}, Moon: ${person2.moon}, Rising: ${person2.rising}, Venus: ${person2.venus}, Mars: ${person2.mars}, Mercury: ${person2.mercury})

Computed aspects, overall and per domain (this is the real astrological basis
for every score below — weight it heavily rather than defaulting to a "safe"
middle value):

Overall: ${overallAspectSummary}
Overall baseline score: ${overallBaseline}/100 (loose anchor, not a hard rule).

Emotional bond (Sun/Moon aspects): ${emotionalCtx.summary}
Emotional bond baseline: ${emotionalCtx.baselineStars}/5 stars.

Chemistry & attraction (Venus/Mars aspects): ${chemistryCtx.summary}
Chemistry baseline: ${chemistryCtx.baselineStars}/5 stars.

Communication style (Mercury aspects): ${commCtx.summary}
Communication baseline: ${commCtx.baselineStars}/5 stars.

Calibration and content rules — USE THE SPECIFIED RANGE on every score below, and do not let
scores cluster near the middle regardless of the aspects:
- overall_score: always above 50. below 65 for mostly square/opposition charts, 90+ only for
  charts with several tight trines/sextiles. Reserve 75-85 for genuinely
  mixed pairings, not as a default.
- Each of the three star ratings (emotional_bond, chemistry_and_attraction,
  communication_style) should independently reflect ONLY its own domain's
  aspects. It is normal and expected for one category to score low (1-2)
  while another scores high (4-5) in the same report — do not average them
  toward a similar middling number.
- "potential_friction_points" & "super_powers": High-level relationship dynamics (e.g., core themes of growth vs conflict).
- "crush_cheat_sheet": focus on **behavioral & actionable tips**, NOT repeating the astrological placements.
     * green_flags: Specific high-vibe behavioral habits they bring out in each other.
     * red_flags: Specific relational pitfalls or triggers to watch out for.
     * how_to_give_them_butterflies: specific, creative, real-world romantic gestures or scenario tailored to their combined Venus/Mars/Moon dynamic.
- For each category, write the "text" reasoning FIRST, then derive the
  "stars" number from what you just wrote — don't decide the number before
  reasoning about the aspects.

   
     
Output the response in clean JSON with exactly this shape:
{
  "overall_score": number (0-100),
  "dynamic_summary": string (2 short sentences summarizing their vibe),
  "emotional_bond": { "text": string (~150 words on Moon/Sun interactions), "stars": number (0-5, in 0.5 increments) },
  "chemistry_and_attraction": { "text": string (~150 words on Venus/Mars interactions), "stars": number (0-5, in 0.5 increments) },
  "communication_style": { "text": string (~100 words on Mercury interactions), "stars": number (0-5, in 0.5 increments) },
  "potential_friction_points": [string, string],
  "super_powers": [string, string],
  "crush_cheat_sheet": {
    "green_flags": [string, ...],
    "red_flags": [string, ...],
    "how_to_give_them_butterflies": string
  }
}`;

    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      system,
      prompt,
      temperature: 1.0,
    });

    const report = parseJson(text);

    const { data: saved, error } = await context.supabase
      .from("synastry_reports")
      .insert({
        user_id: context.userId,
        partner_name: data.full_name,
        partner_birth_date: data.birth_date,
        partner_birth_time: data.birth_time,
        partner_birth_place: data.birth_place,
        person1,
        person2,
        report,
        unlocked: false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { id: saved.id, report, person1, person2, unlocked: false };
  });

export const listSynastryReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("synastry_reports")
      .select("id, partner_name, unlocked, created_at, report")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      partner_name: r.partner_name as string,
      unlocked: r.unlocked as boolean,
      created_at: r.created_at as string,
      overall_score: (r.report as { overall_score?: number })?.overall_score ?? 0,
    }));
  });

// Keep this as POST so checkout settlement polling always reaches the database
// instead of reusing a cached locked report.
export const getSynastryReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("synastry_reports")
      .select("*")
      .eq("user_id", context.userId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Report not found.");
    return {
      id: row.id as string,
      report: row.report as Report,
      person1: row.person1 as Placements,
      person2: row.person2 as Placements,
      unlocked: row.unlocked as boolean,
    };
  });

export const unlockSynastryReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // NOTE: Free unlock for now. Stripe checkout ($3.99) can gate this later.
    const { error } = await context.supabase
      .from("synastry_reports")
      .update({ unlocked: true })
      .eq("user_id", context.userId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

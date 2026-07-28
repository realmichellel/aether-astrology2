import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { geocodePlace } from "./geocode.server";
import { resolveTimeZone, localWallTimeToUtc } from "./timezone";
import { computeBirthChart } from "./birth-chart";
import { sunSignFor } from "./astrology";

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

async function computePlacements(input: z.infer<typeof PartnerInput>): Promise<Placements> {
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
  return {
    name: input.full_name,
    sun: get("Sun") !== "Unknown" ? get("Sun") : sunSignFor(input.birth_date).name,
    moon: get("Moon"),
    rising: chart.ascendant?.name ?? "Unknown",
    venus: get("Venus"),
    mars: get("Mars"),
    mercury: get("Mercury"),
  };
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

    const person1: Placements = {
      name: profile.full_name ?? "You",
      sun: profile.sun_sign ?? "Unknown",
      moon: profile.moon_sign ?? "Unknown",
      rising: profile.rising_sign ?? "Unknown",
      // Derive Venus/Mars/Mercury from chart_summary when possible.
      venus: extractSign(profile.chart_summary, "Venus"),
      mars: extractSign(profile.chart_summary, "Mars"),
      mercury: extractSign(profile.chart_summary, "Mercury"),
    };

    const person2 = await computePlacements(data);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const system =
      "You are an expert, empathetic, and modern astrologer. Keep the tone insightful, engaging, modern, and avoid archaic jargon. Respond with ONLY valid JSON — no markdown fences, no commentary.";

    const prompt = `Generate a relationship synastry report for:
- Person 1: ${person1.name} (Sun: ${person1.sun}, Moon: ${person1.moon}, Rising: ${person1.rising}, Venus: ${person1.venus}, Mars: ${person1.mars}, Mercury: ${person1.mercury})
- Person 2: ${person2.name} (Sun: ${person2.sun}, Moon: ${person2.moon}, Rising: ${person2.rising}, Venus: ${person2.venus}, Mars: ${person2.mars}, Mercury: ${person2.mercury})

Output the response in clean JSON with exactly this shape:
{
  "overall_score": number (0-100),
  "dynamic_summary": string (2 short sentences summarizing their vibe),
  "emotional_bond": { "stars": number (0-5), "text": string (~150 words on Moon/Sun interactions) },
  "chemistry_and_attraction": { "stars": number (0-5), "text": string (~150 words on Venus/Mars interactions) },
  "communication_style": string (~100 words on Mercury interactions),
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
    });

    const reportJson = JSON.stringify(parseJson(text));
    return { reportJson, person1, person2 };
  });

function extractSign(summary: string | null, body: string): string {
  if (!summary) return "Unknown";
  const m = summary.match(new RegExp(`${body} in (\\w+)`));
  return m?.[1] ?? "Unknown";
}

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("The Oracle returned an unreadable report. Try again.");
  }
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Returns a YYYY-MM-DD string `daysAgo` days before today (UTC).
function dateNDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
// Rough planetary transit summary — deterministic seed so AI has variety without external calls.
function planetarySnapshot(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const moon = signs[(day + month * 2) % 12];
  const mercury = signs[(day + 3) % 12];
  const venus = signs[(day + 5) % 12];
  const mars = signs[(day + 7) % 12];
  return `Moon in ${moon}, Mercury in ${mercury}, Venus in ${venus}, Mars in ${mars}`;
}

type ReadingPayload = { headline: string; body: string; dos: string[]; donts: string[] };

function parseReading(raw: string): ReadingPayload {
  try {
    const parsed = JSON.parse(raw);
    return {
      headline: typeof parsed.headline === "string" ? parsed.headline : "",
      body: typeof parsed.body === "string" ? parsed.body : "",
      dos: Array.isArray(parsed.dos) ? parsed.dos : [],
      donts: Array.isArray(parsed.donts) ? parsed.donts : [],
    };
  } catch {
    // fallback for malformed model output or legacy plain-text cached rows
    return { headline: "", body: raw, dos: [], donts: [] };
  }
}

export const getDailyReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const date = today();

    const { data: existing } = await context.supabase
      .from("daily_readings")
      .select("content, reading_date")
      .eq("user_id", context.userId)
      .eq("reading_date", date)
      .maybeSingle();

    if (existing) return { content: parseReading(existing.content), date };

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!profile) throw new Error("Profile not found");

    const { data: journal } = await context.supabase
      .from("journal_entries")
      .select("entry_date, mood, content")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const journalContext = (journal ?? [])
      .map((j) => `- ${j.entry_date} (${j.mood ?? "—"}): ${j.content}`)
      .join("\n") || "No recent entries.";


      const { text } = await generateText({
        model: gateway("openai/gpt-5.5"),
        system: `You are a modern astrologer writing a daily reading in the style of Co-Star Astrology.
      Tone Guidelines:
      - Concise, slightly stark, poetic, slightly surreal, and direct.
      - Minimalist and existential, avoiding generic cheerleader "horoscope" cliché advice.
      - Use sharp, evocative imagery and real-life metaphors.
      - Never use exclamation points or fluffy language. Do not include the user's name.
      - Dos and Donts rules: include both purely emotional or abstract advice (e.g. "Force clarity", "Find inner peace", "Move slowly"), 
      as well as concrete and specific advice that anchor items in tangible physical objects, sensory details, mundane habits, pop culture/tech actions, or specific interactions (e.g. "sticky lip gloss", 
      "iced espresso", "voicemails", "the group chat", "scrolling past 1 AM", "unmatching", "heavy denim", "second guessing a compliment", "buying green tea". Try to mix categories across the items.
      - NO CONTRADICTIONS: Ensure none of the items under "Dos" contradict or overlap in meaning with items under "Don'ts" (e.g., do not say "Do: Text back fast" while also saying "Don't: Rush your replies").

      Shape:
      {"headline": string, "body": string, "dos": string[], "donts": string[]}
      - headline: A short, intriguing 3 to 6-word phrase, second person (e.g., "Stop negotiating with your instincts.", "Solitude is not a performance.").
      - body: A short paragraph (3-4 sentences) exploring the emotional theme of the day, second person, focusing on tension, vulnerability, or self-awareness, do not explicitly mention astrological signs.
      - dos: exactly 3 short phrases (1-3 words each) — things to lean into today.
      - donts: exactly 3 short phrases (1-3 words each) — things to avoid today.`,
        messages: [
          {
            role: "user",
            content: `Generate today's reading (${date}) for ${profile.full_name}.
      Sun: ${profile.sun_sign}. Born ${profile.birth_date} in ${profile.birth_place}.
      Sky today: ${planetarySnapshot(date)}.
      Recent journal:
      ${journalContext}
      
      Weave the sky, their chart, and their recent moods into the headline, body, dos, and donts.`,
          },
        ],
      });
    const parsed = parseReading(text);

    await context.supabase.from("daily_readings").insert({
      user_id: context.userId,
      reading_date: date,
      content: JSON.stringify(parsed),
    });
    // Retention: keep only the most recent 5 days of readings for this user.
    await context.supabase
      .from("daily_readings")
      .delete()
      .eq("user_id", context.userId)
      .lt("reading_date", dateNDaysAgo(5));
    
    return { content: parsed, date };
  });

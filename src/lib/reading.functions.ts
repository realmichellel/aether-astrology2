import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

function today(): string {
  return new Date().toISOString().slice(0, 10);
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

    if (existing) return { content: existing.content, date };

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
      system:
        "You are a minimalist, poetic astrologer in the vein of Co-Star. Write in short, unadorned, sometimes provocative sentences. No emojis. No exclamation marks. Second person. 90-140 words.",
      messages: [
        {
          role: "user",
          content: `Write today's reading (${date}) for ${profile.full_name}.
Sun: ${profile.sun_sign}. Born ${profile.birth_date} in ${profile.birth_place}.
Sky today: ${planetarySnapshot(date)}.
Recent journal:
${journalContext}

Weave the sky, their chart, and their recent moods into a single reading. End with one sharp instruction for the day.`,
        },
      ],
    });

    await context.supabase.from("daily_readings").insert({
      user_id: context.userId,
      reading_date: date,
      content: text,
    });

    return { content: text, date };
  });

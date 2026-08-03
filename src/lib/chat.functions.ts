import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { z } from "zod";

const ORACLE_GUIDELINES = `Follow these guidelines without exception:

1. NO MEDICAL, PSYCHIATRIC, OR LEGAL ADVICE: Never diagnose, treat, or advise on physical health, mental health conditions, pharmaceuticals, or legal/financial matters. If asked, state directly that astrology is a tool for personal reflection, not medical or legal guidance.

2. NON-DETERMINISTIC GUIDANCE: Frame astrological themes as archetypes, cosmic moods, or prompts for personal growth and emotional reflection—never as fixed fortune-telling, unavoidable fate, or hard predictions of future events.

3. AGE-APPROPRIATE & HEALTHY: Keep all advice constructive, clean, safe, and focused on healthy personal boundaries, mindfulness, and self-awareness.

4. NO DIRECT QUOTES: Do not ever quote from user's journals directly. It should only be used as context for what might be on the user's mind and what they likely want to hear `;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type SupabaseCtx = { supabase: any; userId: string };

/** Reads the credit row, creating it and applying the weekly free grant as needed. */
async function ensureCredits({ supabase, userId }: SupabaseCtx) {
  const { data: existing } = await supabase
    .from("oracle_credits")
    .select("credits, last_weekly_grant")
    .eq("user_id", userId)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);

  if (!existing) {
    const { data: created, error } = await supabase
      .from("oracle_credits")
      .insert({ user_id: userId, credits: 1, last_weekly_grant: today })
      .select("credits, last_weekly_grant")
      .single();
    if (error) throw new Error(error.message);
    return created as { credits: number; last_weekly_grant: string };
  }

  const last = new Date(existing.last_weekly_grant + "T00:00:00Z").getTime();
  const weeksElapsed = Math.floor((Date.now() - last) / WEEK_MS);
  if (weeksElapsed >= 1) {
    const credits = existing.credits + weeksElapsed;
    const nextGrant = new Date(last + weeksElapsed * WEEK_MS).toISOString().slice(0, 10);
    const { error } = await supabase
      .from("oracle_credits")
      .update({ credits, last_weekly_grant: nextGrant, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { credits, last_weekly_grant: nextGrant };
  }

  return existing as { credits: number; last_weekly_grant: string };
}

function nextGrantIso(lastGrant: string) {
  return new Date(new Date(lastGrant + "T00:00:00Z").getTime() + WEEK_MS).toISOString();
}

// POST prevents browsers and intermediaries from serving a stale balance while
// the checkout webhook is updating this row.
export const getOracleCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const row = await ensureCredits(context);
    return { credits: row.credits, next_free_at: nextGrantIso(row.last_weekly_grant) };
  });


export const listChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const sendChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ content: z.string().min(1).max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const balance = await ensureCredits(context);
    if (balance.credits <= 0) {
      throw new Error("You're out of Oracle questions. Unlock 10 more, or wait for your free weekly question.");
    }
    const { error: spendError } = await supabase
      .from("oracle_credits")
      .update({ credits: balance.credits - 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (spendError) throw new Error(spendError.message);

    await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: data.content });

    const [{ data: profile }, { data: history }, { data: journal }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(40),
      supabase
        .from("journal_entries")
        .select("entry_date, mood, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const journalCtx = (journal ?? [])
      .map((j: { entry_date: string; mood: string | null; content: string }) =>
        `- ${j.entry_date} (${j.mood ?? "—"}): ${j.content}`,
      )
      .join("\n") || "None.";

    const systemMsg = `You are a minimalist conversational astrologer. Terse, poetic, direct. No emojis. No exclamation marks. Second person.

The user's chart:
- Sun: ${profile?.sun_sign ?? "unknown"}
- Moon: ${profile?.moon_sign ?? "unknown"}
- Rising: ${profile?.rising_sign ?? "unknown"}

Recent journal:
${journalCtx}

${ORACLE_GUIDELINES}`;

    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      system: systemMsg,
      messages: (history ?? []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: text });
    return { content: text, credits: balance.credits - 1 };
  });

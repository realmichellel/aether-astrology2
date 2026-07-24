import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { z } from "zod";

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
      .map((j) => `- ${j.entry_date} (${j.mood ?? "—"}): ${j.content}`)
      .join("\n") || "None.";

    const systemMsg = `You are a minimalist conversational astrologer. Terse, poetic, direct. No emojis. No exclamation marks. Second person.
The user's chart: Sun ${profile?.sun_sign ?? "unknown"}. Born ${profile?.birth_date ?? "?"} in ${profile?.birth_place ?? "?"}.
Recent journal:
${journalCtx}`;

    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      messages: [
        { role: "system", content: systemMsg },
        ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });

    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: text });
    return { content: text };
  });

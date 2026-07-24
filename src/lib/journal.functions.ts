import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const NewEntry = z.object({
  mood: z.string().min(1).max(40),
  content: z.string().min(1).max(4000),
});

export const listJournal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journal_entries")
      .select("id, entry_date, mood, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => NewEntry.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("journal_entries").insert({
      user_id: context.userId,
      mood: data.mood,
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

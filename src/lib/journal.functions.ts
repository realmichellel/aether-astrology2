import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const NewEntry = z.object({
  mood: z.string().min(1).max(40),
  content: z.string().min(1).max(4000),
});

// Returns a YYYY-MM-DD string exactly one calendar month before today (UTC).
function oneMonthAgo(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}

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

    // Retention: keep only the past month of journal entries for this user.
    await context.supabase
      .from("journal_entries")
      .delete()
      .eq("user_id", context.userId)
      .lt("entry_date", oneMonthAgo());
    
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ConsentInput = z.object({
  marketing_opt_in: z.boolean(),
  terms_accepted_at: z.string().nullable().optional(),
});

/** Read the current user's email marketing consent record. */
export const getEmailPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

/**
 * Create the consent record once, at first sign-in, from what the user agreed
 * to at signup. Never overwrites an existing record — later changes go through
 * setMarketingOptIn so a deliberate opt-out can't be undone by stale metadata.
 */
export const syncEmailPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ConsentInput.parse(input))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string }).email;
    if (!email) return null;

    const { data: existing } = await context.supabase
      .from("email_preferences")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return existing;

    const now = new Date().toISOString();
    const { error } = await context.supabase.from("email_preferences").insert({
      user_id: context.userId,
      email,
      marketing_opt_in: data.marketing_opt_in,
      opted_in_at: data.marketing_opt_in ? now : null,
      terms_accepted_at: data.terms_accepted_at ?? now,
    });
    if (error) throw new Error(error.message);
    return { created: true };
  });

/** Let the user change their promotional email consent later. */
export const setMarketingOptIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ marketing_opt_in: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string }).email ?? "";
    const now = new Date().toISOString();
    const { error } = await context.supabase.from("email_preferences").upsert(
      {
        user_id: context.userId,
        email,
        marketing_opt_in: data.marketing_opt_in,
        opted_in_at: data.marketing_opt_in ? now : null,
        opted_out_at: data.marketing_opt_in ? null : now,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

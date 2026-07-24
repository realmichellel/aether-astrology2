import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sunSignFor } from "./astrology";
import { z } from "zod";

const ProfileInput = z.object({
  full_name: z.string().min(1).max(120),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().optional().nullable(),
  birth_place: z.string().min(1).max(200),
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

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const sun = sunSignFor(data.birth_date);
    const { error } = await context.supabase.from("profiles").upsert(
      {
        user_id: context.userId,
        full_name: data.full_name,
        birth_date: data.birth_date,
        birth_time: data.birth_time || null,
        birth_place: data.birth_place,
        sun_sign: sun.name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, sun_sign: sun.name };
  });

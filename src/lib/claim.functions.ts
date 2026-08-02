import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

const ORACLE_PACK_PRICE_ID = "oracle_10_pack";
const ORACLE_PACK_QUESTIONS = 10;
const SYNASTRY_UNLOCK_PRICE_ID = "synastry_unlock";

type ClaimResult =
  | { status: "applied" | "already" | "pending" }
  | { status: "error"; error: string };

/**
 * Applies the entitlement for a completed checkout session, acting as the
 * signed-in user (RLS-scoped). This is a self-healing path so purchases still
 * land even if the Stripe webhook fails or is delayed.
 */
export const claimCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.sessionId)) throw new Error("Invalid session id");
    return data;
  })
  .handler(async ({ data, context }): Promise<ClaimResult> => {
    const { supabase, userId } = context;
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);

      if (session.metadata?.["userId"] !== userId) {
        return { status: "error", error: "This purchase belongs to another account." };
      }
      if (session.payment_status === "unpaid") return { status: "pending" };

      // Idempotency guard: unique on session_id.
      const { error: claimError } = await supabase.from("processed_payments").insert({
        user_id: userId,
        session_id: session.id,
        price_id: session.metadata?.["priceId"] ?? null,
      });
      if (claimError) {
        // Duplicate key -> another call (or the webhook) already applied it.
        if (claimError.code === "23505") return { status: "already" };
        return { status: "error", error: claimError.message };
      }

      const priceId = session.metadata?.["priceId"];

      if (priceId === ORACLE_PACK_PRICE_ID) {
        const { data: existing, error: readError } = await supabase
          .from("oracle_credits")
          .select("credits")
          .eq("user_id", userId)
          .maybeSingle();
        if (readError) return { status: "error", error: readError.message };

        if (!existing) {
          const { error } = await supabase.from("oracle_credits").insert({
            user_id: userId,
            credits: ORACLE_PACK_QUESTIONS,
            last_weekly_grant: new Date().toISOString().slice(0, 10),
          });
          if (error) return { status: "error", error: error.message };
        } else {
          const { error } = await supabase
            .from("oracle_credits")
            .update({
              credits: (existing.credits as number) + ORACLE_PACK_QUESTIONS,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          if (error) return { status: "error", error: error.message };
        }
        return { status: "applied" };
      }

      if (priceId === SYNASTRY_UNLOCK_PRICE_ID) {
        const reportId = session.metadata?.["reportId"];
        if (!reportId) return { status: "error", error: "Missing report reference." };
        const { error } = await supabase
          .from("synastry_reports")
          .update({ unlocked: true })
          .eq("user_id", userId)
          .eq("id", reportId);
        if (error) return { status: "error", error: error.message };
        return { status: "applied" };
      }

      return { status: "error", error: "Unknown purchase type." };
    } catch (error) {
      return { status: "error", error: getStripeErrorMessage(error) };
    }
  });

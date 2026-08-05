import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

const ORACLE_PACK_PRICE_ID = "oracle_10_pack";
const ORACLE_PACK_QUESTIONS = 10;
const SYNASTRY_UNLOCK_PRICE_ID = "synastry_unlock";

async function grantOracleCredits(userId: string, amount: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing, error: readError } = await supabaseAdmin
    .from("oracle_credits")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw new Error(`Could not read Oracle credits: ${readError.message}`);

  if (!existing) {
    const { error } = await supabaseAdmin
      .from("oracle_credits")
      .insert({ user_id: userId, credits: amount, last_weekly_grant: today });
    if (error) throw new Error(`Could not create Oracle credits: ${error.message}`);
    return;
  }

  const { error } = await supabaseAdmin
    .from("oracle_credits")
    .update({
      credits: (existing.credits as number) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error(`Could not grant Oracle credits: ${error.message}`);
}

async function unlockSynastryReport(userId: string, reportId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("synastry_reports")
    .update({ unlocked: true })
    .eq("user_id", userId)
    .eq("id", reportId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Could not unlock synastry report: ${error.message}`);
  if (!data) throw new Error("Could not unlock synastry report: report not found");
}

async function handleEvent(event: { type: string; data: { object: any } }) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // `no_payment_required` (100%-off promo) still fulfills; only `unpaid` waits.
      if (session.payment_status === "unpaid") break;
      if (session.status !== "complete") break;
      const userId = session.metadata?.userId;
      const priceId = session.metadata?.priceId;
      if (!userId) {
        // Sessions created outside the app (e.g. Stripe dashboard) carry no
        // user. Nothing to fulfill — acknowledge instead of retrying forever.
        console.error("Checkout session without userId metadata:", session.id);
        break;
      }
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: claimError } = await supabaseAdmin.from("processed_payments").insert({
        user_id: userId,
        session_id: session.id,
        price_id: priceId ?? null,
      });
      if (claimError) {
        // Already applied (by an earlier delivery or the client-side claim).
        if (claimError.code === "23505") break;
        throw new Error(`Could not record payment: ${claimError.message}`);
      }
      try {
        if (priceId === ORACLE_PACK_PRICE_ID) {
          await grantOracleCredits(userId, ORACLE_PACK_QUESTIONS);
        } else if (priceId === SYNASTRY_UNLOCK_PRICE_ID && session.metadata?.reportId) {
          await unlockSynastryReport(userId, session.metadata.reportId);
        }
      } catch (grantError) {
        // Release the idempotency lock so Stripe's retry can apply the grant
        // instead of the purchase being silently swallowed.
        await supabaseAdmin.from("processed_payments").delete().eq("session_id", session.id);
        throw grantError;
      }
      break;
    }
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }

        let event: { type: string; data: { object: any } };
        try {
          event = await verifyWebhook(request, rawEnv as StripeEnv);
        } catch (e) {
          // Signature/config problem — retrying cannot help, but Stripe must
          // still be told the request was rejected.
          console.error("Webhook verification failed:", e);
          return new Response("Webhook signature verification failed", { status: 400 });
        }

        try {
          await handleEvent(event);
          return Response.json({ received: true });
        } catch (e) {
          // Transient fulfillment failure — 500 so Stripe retries.
          console.error(`Webhook handling failed for ${event.type}:`, e);
          return new Response("Webhook handler error", { status: 500 });
        }
      },
    },
  },
});


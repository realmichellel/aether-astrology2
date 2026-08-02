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

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status === "unpaid") break;
      const userId = session.metadata?.userId;
      const priceId = session.metadata?.priceId;
      if (!userId) {
        console.error("Checkout session without userId metadata");
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
      if (priceId === ORACLE_PACK_PRICE_ID) {
        await grantOracleCredits(userId, ORACLE_PACK_QUESTIONS);
      } else if (priceId === SYNASTRY_UNLOCK_PRICE_ID && session.metadata?.reportId) {
        await unlockSynastryReport(userId, session.metadata.reportId);
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
        try {
          await handleWebhook(request, rawEnv as StripeEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});

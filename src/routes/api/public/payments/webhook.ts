import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

const ORACLE_PACK_PRICE_ID = "oracle_10_pack";
const ORACLE_PACK_QUESTIONS = 10;

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function grantOracleCredits(userId: string, amount: number) {
  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("oracle_credits")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("oracle_credits")
      .insert({ user_id: userId, credits: amount, last_weekly_grant: today });
    return;
  }

  await supabase
    .from("oracle_credits")
    .update({
      credits: (existing.credits as number) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
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
      if (priceId === ORACLE_PACK_PRICE_ID) {
        await grantOracleCredits(userId, ORACLE_PACK_QUESTIONS);
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

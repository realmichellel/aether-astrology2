import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppNav } from "@/components/AppNav";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { ORACLE_PACK_PRICE_ID } from "@/lib/stripe";
import { listChat, sendChat, getOracleCredits } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "The Oracle — Aether" },
      { name: "description", content: "Converse with Aether, your personal astrologer." },
    ],
  }),
  component: ChatPage,
});

type Message = { id: string; role: string; content: string; created_at: string };

function ChatPage() {
  const fetchMessages = useServerFn(listChat);
  const send = useServerFn(sendChat);
  const fetchCredits = useServerFn(getOracleCredits);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [nextFree, setNextFree] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [settling, setSettling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshCredits = useCallback(async () => {
    const c = await fetchCredits();
    setCredits(c.credits);
    setNextFree(c.next_free_at);
    return c.credits;
  }, [fetchCredits]);

  useEffect(() => {
    fetchMessages().then((m) => setMessages(m as Message[]));
    refreshCredits();
  }, [fetchMessages, refreshCredits]);

  // After returning from checkout, poll briefly while the purchase settles.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    window.history.replaceState({}, "", window.location.pathname);
    setSettling(true);
    let tries = 0;
    const before = credits;
    const timer = setInterval(async () => {
      tries += 1;
      const now = await refreshCredits();
      if ((before !== null && now > before) || tries >= 10) {
        clearInterval(timer);
        setSettling(false);
      }
    }, 2000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);




  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    if (credits !== null && credits <= 0) return;
    setInput("");
    const optimistic: Message = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setPending(true);
    try {
      const res = await send({ data: { content: text } });
      if (typeof res?.credits === "number") setCredits(res.credits);
      const fresh = await fetchMessages();
      setMessages(fresh as Message[]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
      textareaRef.current?.focus();
    }
  }

  const out = credits !== null && credits <= 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PaymentTestModeBanner />
      <AppNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-8 py-10 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full border border-accent/30 grid place-items-center text-accent text-xl italic font-serif">
              A
            </div>
            <div>
              <div className="text-sm font-medium">The Oracle</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                AI astrological synthesis
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Questions left
              </div>
              <div className="font-serif italic text-2xl text-accent">
                {credits === null ? "—" : credits}
              </div>
              {nextFree && (
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  Free question{" "}
                  {new Date(nextFree).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => setCheckoutOpen(true)}
              className="border border-accent/40 text-accent px-5 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-accent/10 transition-colors"
            >
              Add 10 questions — $3.99
            </button>
          </div>
        </div>

        {settling && (
          <div className="border border-accent/30 bg-surface p-4 mb-8 text-[10px] uppercase tracking-[0.2em] text-accent text-center">
            Confirming your purchase…
          </div>
        )}

        {checkoutOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-10">
              <div className="flex items-baseline justify-between mb-6">
                <h3 className="font-serif italic text-3xl">Ten questions</h3>
                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
                >
                  Close
                </button>
              </div>
              <StripeEmbeddedCheckout
                priceId={ORACLE_PACK_PRICE_ID}
                returnUrl={`${window.location.origin}/chat?checkout=success`}
              />
            </div>
          </div>
        )}

        {out && (
          <div className="border border-accent/40 bg-surface p-8 mb-8 text-center">
            <div className="text-[10px] uppercase tracking-widest text-accent mb-3">
              The Oracle rests
            </div>
            <h3 className="font-serif italic text-3xl mb-3">Out of questions</h3>
            <p className="text-sm text-stone-400 mb-6 max-w-md mx-auto leading-relaxed">
              Ten more questions for <span className="text-accent">$3.99</span>. One free question
              arrives each week regardless.
            </p>
            <button
              onClick={() => setCheckoutOpen(true)}
              className="bg-accent text-primary-foreground py-3 px-10 font-serif italic text-lg hover:bg-stone-100 transition-colors"
            >
              Add 10 questions
            </button>
          </div>
        )}




        <div
          ref={scrollRef}
          className="flex-1 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-6 border border-border p-6 bg-surface/40"
        >
          {messages.length === 0 && !pending && (
            <div className="h-full flex items-center justify-center text-center py-16">
              <div>
                <p className="font-serif italic text-2xl text-stone-400 mb-2">
                  What would you like to know?
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  A decision · a dream · a pattern you've noticed
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] p-4 bg-accent/10 border border-accent/20 text-sm leading-relaxed text-accent whitespace-pre-wrap"
                    : "max-w-[85%] text-sm leading-relaxed text-stone-200 whitespace-pre-wrap"
                }
              >
                {m.content}
              </div>
            </div>
          ))}

          {pending && (
            <div className="text-sm italic text-stone-500 animate-pulse">Consulting the sky…</div>
          )}
        </div>

        <form onSubmit={submit} className="mt-6 flex items-end gap-4 border-t border-border pt-6">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder={out ? "Out of questions…" : "Ask the stars…"}
            rows={2}
            className="flex-1 bg-transparent text-sm focus:outline-none italic resize-none placeholder:text-muted-foreground"
            disabled={pending || out}
          />
          <button
            type="submit"
            disabled={!input.trim() || pending || out}
            className="text-accent uppercase text-[10px] font-bold tracking-widest px-4 py-2 border border-accent/30 hover:bg-accent/10 transition-colors disabled:opacity-30"
          >
            Send
          </button>

        </form>
      </main>
    </div>
  );
}

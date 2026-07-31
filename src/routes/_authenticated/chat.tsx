import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppNav } from "@/components/AppNav";
import {
  listChat,
  sendChat,
  getOracleCredits,
  purchaseOracleCredits,
} from "@/lib/chat.functions";

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
  const buyCredits = useServerFn(purchaseOracleCredits);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [nextFree, setNextFree] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchMessages().then((m) => setMessages(m as Message[]));
    fetchCredits().then((c) => {
      setCredits(c.credits);
      setNextFree(c.next_free_at);
    });
  }, [fetchMessages, fetchCredits]);

  async function purchase() {
    const c = await buyCredits();
    setCredits(c.credits);
    setNextFree(c.next_free_at);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
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
      await send({ data: { content: text } });
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-8 py-10 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
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
            placeholder="Ask the stars…"
            rows={2}
            className="flex-1 bg-transparent text-sm focus:outline-none italic resize-none placeholder:text-muted-foreground"
            disabled={pending}
          />
          <button
            type="submit"
            disabled={!input.trim() || pending}
            className="text-accent uppercase text-[10px] font-bold tracking-widest px-4 py-2 border border-accent/30 hover:bg-accent/10 transition-colors disabled:opacity-30"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

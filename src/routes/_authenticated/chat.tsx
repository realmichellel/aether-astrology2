import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listChat, sendChat } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Astrologer — Ephemeris" },
      { name: "description", content: "Chat with your conversational astrologer, aware of your chart and journal." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id?: string; role: "user" | "assistant"; content: string };

function ChatPage() {
  const load = useServerFn(listChat);
  const send = useServerFn(sendChat);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    load().then((m) => setMessages(m as Msg[]));
    inputRef.current?.focus();
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const r = await send({ data: { content: text } });
      setMessages((m) => [...m, { role: "assistant", content: r.content }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: err instanceof Error ? err.message : "Silence." }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-eyebrow text-muted-foreground hover:text-gold">← Today</Link>
          <span className="text-eyebrow">The Astrologer</span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-10">
          {messages.length === 0 && !busy && (
            <p className="font-serif text-xl text-muted-foreground">Ask about the shape of your day, a person, a decision. The astrologer is listening.</p>
          )}
          <ul className="space-y-8">
            {messages.map((m, i) => (
              <li key={m.id ?? i}>
                <p className="text-eyebrow">{m.role === "user" ? "You" : "Astrologer"}</p>
                <p className={`mt-2 whitespace-pre-wrap ${m.role === "assistant" ? "font-serif text-lg text-foreground" : "text-foreground"}`}>{m.content}</p>
              </li>
            ))}
            {busy && (
              <li>
                <p className="text-eyebrow">Astrologer</p>
                <p className="mt-2 font-serif text-lg text-gold-muted">Listening to the sky…</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      <form onSubmit={onSend} className="border-t border-border">
        <div className="mx-auto flex max-w-2xl items-end gap-3 px-6 py-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(e as unknown as React.FormEvent);
              }
            }}
            rows={1}
            placeholder="Ask the astrologer"
            className="flex-1 resize-none border-b border-border bg-transparent py-2 text-foreground outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:border-gold hover:text-gold disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

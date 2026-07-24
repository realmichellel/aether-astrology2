import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listJournal, addJournal } from "@/lib/journal.functions";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Ephemeris" },
      { name: "description", content: "Log your moods and life events. The astrologer will read them with the sky." },
    ],
  }),
  component: JournalPage,
});

const MOODS = ["Bright", "Steady", "Restless", "Heavy", "Anxious", "Tender", "Angry", "Curious"];

type Entry = { id: string; entry_date: string; mood: string | null; content: string; created_at: string };

function JournalPage() {
  const load = useServerFn(listJournal);
  const add = useServerFn(addJournal);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState(MOODS[0]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await load();
    setEntries(data as Entry[]);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    try {
      await add({ data: { mood, content: content.trim() } });
      setContent("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-eyebrow text-muted-foreground hover:text-gold">← Today</Link>
          <span className="text-eyebrow">Journal</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <form onSubmit={onSubmit} className="border border-border p-6">
          <p className="text-eyebrow">How does today feel?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMood(m)}
                className={`border px-3 py-1 text-xs uppercase tracking-widest transition ${
                  mood === m ? "border-gold text-gold" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="A moment, a person, a thought…"
            className="mt-6 w-full resize-none border-b border-border bg-transparent py-2 text-foreground outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy || !content.trim()}
            className="mt-4 border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:border-gold hover:text-gold disabled:opacity-40"
          >
            {busy ? "Recording…" : "Record"}
          </button>
        </form>

        <section className="mt-12 space-y-8">
          {entries.length === 0 && (
            <p className="font-serif text-lg text-muted-foreground">No entries yet. The blank sky waits.</p>
          )}
          {entries.map((e) => (
            <article key={e.id} className="border-t border-border pt-6">
              <div className="flex items-baseline justify-between">
                <p className="text-eyebrow">{new Date(e.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                {e.mood && <p className="font-serif text-sm text-gold">{e.mood}</p>}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-foreground">{e.content}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

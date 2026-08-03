import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppNav } from "@/components/AppNav";
import { listJournal, addJournal } from "@/lib/journal.functions";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Chronicles — Aether" },
      {
        name: "description",
        content:
          "Log the moods and moments of your days. Aether reads your chronicles as context for every daily reading it writes.",
      },
      { property: "og:title", content: "Chronicles — Aether" },
      {
        property: "og:description",
        content: "Your record of moods and moments, read back into every daily astrological reading.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),

  component: JournalPage,
});

const MOODS = ["Bright", "Steady", "Restless", "Heavy", "Tender", "Clear", "Clouded"];

type Entry = { id: string; entry_date: string; mood: string | null; content: string; created_at: string };

function JournalPage() {
  const load = useServerFn(listJournal);
  const add = useServerFn(addJournal);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState<string>(MOODS[0]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await load();
    setEntries(data as Entry[]);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!content.trim() || busy) return;
    setBusy(true);
    try {
      await add({ data: { mood, content: content.trim() } });
      setContent("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-4xl mx-auto px-5 py-8 sm:px-8 sm:py-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Chronicles</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-light leading-tight mb-2">
          Where the <span className="italic">days go.</span>
        </h1>
        <p className="text-sm sm:text-base text-stone-400 max-w-lg mb-12">
          Note a mood, a dream, a decision. Recent entries feed into your daily reading and the Oracle's
          replies.
        </p>

        <form onSubmit={submit} className="border border-border p-6 bg-surface mb-16 space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Mood
            </div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    setMood(m);
                    setCustomMood("");
                  }}
                  className={`text-[10px] uppercase tracking-[0.2em] px-3 py-2 border transition-colors ${
                    mood === m
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
              <input
                type="text"
                value={customMood}
                maxLength={40}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomMood(v);
                  if (v.trim()) setMood(v.trim());
                  else setMood(MOODS[0]);
                }}
                placeholder="Your own"
                className={`text-[10px] uppercase tracking-[0.2em] px-3 py-2 border bg-transparent w-28 focus:outline-none transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-stone-600 ${
                  customMood.trim()
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground focus:border-accent"
                }`}
              />
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened, what did it feel like, what were you thinking about…"
            rows={5}
            required
            className="w-full bg-transparent border-b border-border py-2 focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-stone-600"
          />

          {error && (
            <p className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/40 px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy || !content.trim()}
              className="bg-accent text-primary-foreground py-3 px-8 font-serif italic text-lg hover:bg-stone-100 transition-colors disabled:opacity-40"
            >
              {busy ? "Recording…" : "Record entry"}
            </button>
          </div>
        </form>

        <div className="space-y-8">
          {entries.length === 0 && (
            <p className="text-stone-500 italic">Your chronicle is empty. Write the first entry.</p>
          )}
          {entries.map((e) => (
            <article key={e.id} className="border-b border-border pb-8">
              <div className="flex items-baseline gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                <span>
                  {new Date(e.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {e.mood && <span className="text-accent">{e.mood}</span>}
              </div>
              <p className="text-stone-400 leading-relaxed whitespace-pre-wrap">{e.content}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

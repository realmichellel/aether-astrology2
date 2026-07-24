import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppNav } from "@/components/AppNav";
import { getProfile } from "@/lib/profile.functions";
import { getDailyReading } from "@/lib/reading.functions";
import { listJournal } from "@/lib/journal.functions";
import { ZODIAC } from "@/lib/astrology";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Today — Aeterna" },
      { name: "description", content: "Your daily reading and recent chronicle." },
    ],
  }),
  component: Dashboard,
});

type Entry = { id: string; entry_date: string; mood: string | null; content: string; created_at: string };

function Dashboard() {
  const navigate = useNavigate();
  const loadProfile = useServerFn(getProfile);
  const loadReading = useServerFn(getDailyReading);
  const loadEntries = useServerFn(listJournal);

  const [profile, setProfile] = useState<any>(null);
  const [reading, setReading] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (!p) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setProfile(p);
      try {
        const [r, e] = await Promise.all([loadReading(), loadEntries()]);
        setReading(r.content);
        setEntries(e as Entry[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reading.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProfile, loadReading, loadEntries, navigate]);

  const glyph = ZODIAC.find((z) => z.name === profile?.sun_sign)?.symbol ?? "✷";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-6xl mx-auto px-8 py-12">
        <section className="mb-16 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-4">{today}</p>
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-tight">
              {profile?.full_name ? (
                <>
                  Welcome back, <span className="italic">{profile.full_name}.</span>
                </>
              ) : (
                <>The sky <span className="italic">over you.</span></>
              )}
            </h1>
          </div>
          {profile && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Sun in
              </div>
              <div className="font-serif italic text-2xl text-accent">
                <span className="mr-2">{glyph}</span>
                {profile.sun_sign}
              </div>
            </div>
          )}
        </section>

        <section className="mb-24">
          <div className="p-10 bg-surface border border-border">
            <div className="text-[10px] uppercase tracking-widest text-accent mb-6">
              Today's resonance
            </div>

            {loading ? (
              <div className="font-serif italic text-3xl text-stone-500">
                Consulting the ephemeris…
              </div>
            ) : error ? (
              <div className="text-destructive-foreground">{error}</div>
            ) : (
              <p className="font-serif text-2xl md:text-3xl font-light leading-snug italic text-stone-200 whitespace-pre-wrap">
                {reading}
              </p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <Link
            to="/chat"
            className="group border border-border p-1 hover:border-accent/40 transition-colors"
          >
            <div className="bg-surface p-8 h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-full border border-accent/30 grid place-items-center text-accent text-xl italic font-serif">
                  A
                </div>
                <div>
                  <div className="text-sm font-medium">The Oracle</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Conversational astrologer
                  </div>
                </div>
              </div>
              <p className="text-stone-400 leading-relaxed max-w-md">
                Ask about a decision, a dream, a passing worry. The Oracle knows your chart and the
                current sky.
              </p>
              <div className="mt-8 text-[10px] uppercase tracking-[0.2em] text-accent">
                Begin a conversation →
              </div>
            </div>
          </Link>

          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-border pb-4">
              <h3 className="font-serif text-3xl italic">Chronicles</h3>
              <Link
                to="/journal"
                className="text-[10px] uppercase tracking-widest text-accent font-bold hover:text-stone-100"
              >
                All entries →
              </Link>
            </div>
            {entries.length === 0 ? (
              <Link
                to="/journal"
                className="block text-sm text-muted-foreground italic hover:text-accent transition-colors"
              >
                Log your first mood or moment to give Aeterna context.
              </Link>
            ) : (
              entries.slice(0, 4).map((e) => (
                <Link key={e.id} to="/journal" className="block group">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    <span>
                      {new Date(e.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {e.mood && <span>{e.mood}</span>}
                  </div>
                  <div className="text-lg font-serif italic text-stone-300 group-hover:text-accent transition-colors">
                    {e.content.length > 70 ? e.content.slice(0, 70) + "…" : e.content}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>© Aeterna</div>
          <div>An observatory for one</div>
        </div>
      </footer>
    </div>
  );
}

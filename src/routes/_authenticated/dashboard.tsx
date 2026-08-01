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
      { title: "Today — Aether" },
      {
        name: "description",
        content:
          "View today's personalized astrological reading and revisit your recent chronicles inside Aether, your quiet AI astrologer.",
      },
      { property: "og:title", content: "Today — Aether" },
      {
        property: "og:description",
        content:
          "Your daily reading, drawn from your natal chart, the current transits, and the notes you keep.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),

  component: Dashboard,
});

const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfS6G4VQxYjk0hqBJFzDyKKqllUHe7pAx_juHbBTt2NE4B2fA/viewform?usp=sharing&ouid=101457662040415223175";

type Entry = { id: string; entry_date: string; mood: string | null; content: string; created_at: string };
type Reading = { headline: string; body: string; dos: string[]; donts: string[] };


function Dashboard() {
  const navigate = useNavigate();
  const loadProfile = useServerFn(getProfile);
  const loadReading = useServerFn(getDailyReading);
  const loadEntries = useServerFn(listJournal);

  const [profile, setProfile] = useState<any>(null);
  const [reading, setReading] = useState<Reading | null>(null);
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
      <main className="max-w-6xl mx-auto px-5 py-8 sm:px-8 sm:py-12">
        <section className="mb-12 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-8 sm:mb-16 sm:flex sm:flex-wrap sm:justify-between sm:gap-6 sm:pb-10">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3 sm:mb-4">{today}</p>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light leading-tight">
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
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Sun in
              </div>
              <div className="font-serif italic text-xl sm:text-2xl text-accent whitespace-nowrap">
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
              <div className="font-serif italic text-2xl sm:text-3xl text-stone-500">
                Consulting the ephemeris…
              </div>
            ) : error ? (
              <div className="text-destructive-foreground">{error}</div>
            ) : reading ? (
              <>
                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-semibold leading-snug text-stone-100 mb-4">
                  {reading.headline}
                </h2>
                <p className="text-sm sm:text-base md:text-lg font-light leading-relaxed text-stone-400 mb-8">
                  {reading.body}
                </p>
                {(reading.dos.length > 0 || reading.donts.length > 0) && (
                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                        Do
                      </div>
                      <ul className="space-y-2">
                        {reading.dos.map((item, i) => (
                          <li key={i} className="font-serif text-base sm:text-lg md:text-xl text-stone-200">
                            {item}
                          </li>    
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                        Don't
                      </div>
                      <ul className="space-y-2">
                        {reading.donts.map((item, i) => (
                          <li key={i} className="font-serif text-base sm:text-lg md:text-xl text-stone-200">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : null}
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
              <h3 className="font-serif text-2xl sm:text-3xl italic">Chronicles</h3>
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
                Log your first mood or moment to give Aether context.
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
                  <div className="text-base sm:text-lg font-serif italic text-stone-300 group-hover:text-accent transition-colors">
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
          <div>© Aether</div>
          <div>An observatory for one</div>
        </div>
        <div className="max-w-6xl mx-auto px-8 mt-8">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-accent/40 text-accent py-2 px-6 text-[10px] uppercase tracking-[0.2em] hover:bg-accent/10 transition-colors"
          >
            Feedback
          </a>
        </div>
      </footer>
    </div>
  );
}

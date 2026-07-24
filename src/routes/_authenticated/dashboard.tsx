import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/profile.functions";
import { getDailyReading } from "@/lib/reading.functions";
import { supabase } from "@/integrations/supabase/client";
import { ZODIAC } from "@/lib/astrology";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Today — Ephemeris" },
      { name: "description", content: "Your personalized daily astrology reading, drawn from your chart and the sky today." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const loadProfile = useServerFn(getProfile);
  const loadReading = useServerFn(getDailyReading);
  const [profile, setProfile] = useState<any>(null);
  const [reading, setReading] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (!p) {
        navigate({ to: "/onboarding" });
        return;
      }
      setProfile(p);
      try {
        const r = await loadReading();
        setReading(r.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load reading");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProfile, loadReading, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const symbol = ZODIAC.find((z) => z.name === profile?.sun_sign)?.symbol ?? "✷";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen">
      <Nav onSignOut={signOut} />
      <main className="mx-auto max-w-2xl px-6 pb-32 pt-16">
        <p className="text-eyebrow">{today}</p>
        <div className="mt-6 flex items-baseline gap-4">
          <span className="font-serif text-6xl text-gold">{symbol}</span>
          <div>
            <p className="text-eyebrow">Sun in</p>
            <h1 className="text-display text-3xl">{profile?.sun_sign ?? "—"}</h1>
          </div>
        </div>

        <section className="mt-16 border-t border-border pt-10">
          <p className="text-eyebrow">Today's reading</p>
          {loading && <p className="mt-6 text-muted-foreground">Consulting the sky…</p>}
          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
          {reading && (
            <p className="mt-6 whitespace-pre-wrap font-serif text-xl leading-relaxed text-foreground">{reading}</p>
          )}
        </section>

        <section className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TileLink to="/chat" eyebrow="Conversational" title="Speak with the astrologer" />
          <TileLink to="/journal" eyebrow="Log" title="Record a mood or event" />
        </section>
      </main>
    </div>
  );
}

function Nav({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Link to="/dashboard" className="text-eyebrow text-foreground">Ephemeris</Link>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-widest">
          <Link to="/dashboard" className="text-muted-foreground hover:text-gold">Today</Link>
          <Link to="/chat" className="text-muted-foreground hover:text-gold">Chat</Link>
          <Link to="/journal" className="text-muted-foreground hover:text-gold">Journal</Link>
          <button onClick={onSignOut} className="text-muted-foreground hover:text-gold">Sign out</button>
        </nav>
      </div>
    </header>
  );
}

function TileLink({ to, eyebrow, title }: { to: string; eyebrow: string; title: string }) {
  return (
    <Link
      to={to}
      className="group block border border-border p-6 transition hover:border-gold"
    >
      <p className="text-eyebrow">{eyebrow}</p>
      <p className="mt-3 font-serif text-xl text-foreground group-hover:text-gold">{title} →</p>
    </Link>
  );
}

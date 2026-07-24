import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ephemeris — Minimalist AI Astrology" },
      { name: "description", content: "A minimalist astrology practice. Daily readings drawn from your birth chart, the sky today, and your own words." },
      { property: "og:title", content: "Ephemeris — Minimalist AI Astrology" },
      { property: "og:description", content: "Daily readings drawn from your birth chart, the sky today, and your own words." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return <div className="min-h-screen" />;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(200,170,90,0.08), transparent 50%), radial-gradient(circle at 80% 60%, rgba(200,170,90,0.05), transparent 50%)",
      }} />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-eyebrow text-foreground">Ephemeris</span>
        <Link to="/auth" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">Sign in</Link>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-24 pb-32">
        <p className="text-eyebrow">A minimalist astrology practice</p>
        <h1 className="text-display mt-8 text-5xl sm:text-7xl">
          The sky is a mirror.<br />
          <span className="text-gold">Read it daily.</span>
        </h1>
        <p className="mt-8 max-w-lg font-serif text-xl text-muted-foreground">
          Ephemeris draws your chart, tracks the planets, and reads them against what you're actually living.
          One paragraph a day. No horoscopes for millions.
        </p>

        <div className="mt-16 flex items-center gap-6">
          <Link
            to="/auth"
            className="border border-gold bg-gold px-6 py-3 text-sm font-medium"
            style={{ color: "var(--background)" }}
          >
            Begin with Google
          </Link>
          <span className="text-eyebrow">Free. Private. Quiet.</span>
        </div>

        <div className="mt-32 grid grid-cols-1 gap-10 border-t border-border pt-12 sm:grid-cols-3">
          <Feature n="I" title="Your chart" body="Enter your birth details. We draw the sky as it was." />
          <Feature n="II" title="Today's reading" body="A daily paragraph — chart, transits, and your own notes." />
          <Feature n="III" title="The astrologer" body="A conversational AI that remembers what you've told it." />
        </div>
      </section>
    </main>
  );
}

function Feature({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-serif text-3xl text-gold">{n}</p>
      <p className="mt-3 text-eyebrow">{title}</p>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

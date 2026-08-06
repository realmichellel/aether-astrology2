import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackFunnel } from "@/lib/birth-draft";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Aether — A quiet astrologer" },
      {
        name: "description",
        content:
          "A personal AI astrologer reading your natal chart, live planetary transits, and the journal you keep of your own life.",
      },
      { property: "og:title", content: "Aether — A quiet astrologer" },
      {
        property: "og:description",
        content:
          "A personal AI astrologer trained on your natal chart, real planetary transits, and your own chronicle.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aetherhoroscope.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://aetherhoroscope.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "Aether",
              url: "https://aetherhoroscope.com/",
              description:
                "A personal AI astrologer trained on your natal chart, real planetary transits, and your own chronicle.",
            },
            {
              "@type": "Organization",
              name: "Aether",
              url: "https://aetherhoroscope.com/",
              description:
                "Aether is an AI astrology service offering natal charts, daily readings, a conversational astrologer, and compatibility reports.",
            },
          ],
        }),
      },
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
    <div className="min-h-screen text-foreground selection:bg-accent/30 selection:text-primary-foreground">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <div className="text-xl font-serif italic tracking-widest text-gilded">AETHER</div>
        <Link
          to="/auth"
          className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-8 pt-32 pb-24">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-8">
          A personal astrologer
        </p>
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light leading-[1.05] mb-10 max-w-3xl">
          The sky keeps moving.
          <br />
          <span className="italic text-gilded">So do you.</span>
        </h1>
        <p className="max-w-xl text-base sm:text-lg text-stone-400 leading-relaxed mb-10">
          Your birth chart, today&rsquo;s transits, and the notes you keep about your own life — read
          together, once a day.
        </p>

        <div className="flex flex-wrap items-center gap-6">
          <Link
            to="/begin"
            onClick={() => trackFunnel("LandingCTA")}
            className="bg-accent text-primary-foreground py-4 px-10 font-serif italic text-lg hover:bg-stone-100 transition-colors"
          >
            Get your readings
          </Link>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Free to start · No card needed
          </span>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="text-accent">Join 5,000+ daily readers</span>
          <span>100% private &amp; encrypted</span>
        </div>

        <CompatibilityPeek />


        <h2 className="mt-32 border-t border-border pt-14 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          What Aether gives you
        </h2>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureBlock
            index="I"
            title="Natal chart"
            body="Enter your birth date, time, and city. Aether computes your chart and grounds every reading in it."
          />
          <FeatureBlock
            index="II"
            title="Daily reading"
            body="A short, specific reading each day, drawn from your chart, the current transits, and the notes you've been leaving yourself."
          />
          <FeatureBlock
            index="III"
            title="The Oracle"
            body="A conversational astrologer that remembers your placements. Ask it anything — a decision, a dream, a passing worry."
          />
          <FeatureBlock
            index="IV"
            title="Compatibility"
            body="Read another person's chart against your own. Attraction, friction, communication, and a cheat sheet for the two of you."
          />
        </div>

        <p className="mt-16 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Join 5,000+ daily readers · 100% private &amp; encrypted
        </p>
      </main>

      <footer className="py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>© Aether</div>
          <div>An observatory for one</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBlock({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3">{index}</div>
      <h3 className="font-serif italic text-2xl mb-3">{title}</h3>
      <p className="text-sm text-stone-400 leading-relaxed">{body}</p>
    </div>
  );
}

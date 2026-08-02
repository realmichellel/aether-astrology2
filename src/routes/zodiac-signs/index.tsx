import { createFileRoute, Link } from "@tanstack/react-router";
import { SIGN_CONTENT } from "@/lib/zodiac-content";

const URL = "https://aetherhoroscope.com/zodiac-signs";

export const Route = createFileRoute("/zodiac-signs/")({
  head: () => ({
    meta: [
      { title: "The 12 Zodiac Signs: Dates, Traits & Meanings — Aether" },
      {
        name: "description",
        content:
          "A clear guide to all 12 zodiac signs: dates, element, modality, ruling planet, strengths, and challenges for every placement.",
      },
      { property: "og:title", content: "The 12 Zodiac Signs: Dates, Traits & Meanings" },
      {
        property: "og:description",
        content:
          "Dates, elements, modalities, rulers, strengths and challenges for every zodiac sign, written plainly.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "The 12 Zodiac Signs",
          url: URL,
          description:
            "A guide to all 12 zodiac signs — dates, element, modality, ruling planet, strengths and challenges.",
          hasPart: SIGN_CONTENT.map((s) => ({
            "@type": "Article",
            headline: `${s.name} (${s.dates})`,
            url: `${URL}/${s.slug}`,
          })),
        }),
      },
    ],
  }),
  component: ZodiacIndex,
});

function ZodiacIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-5 sm:px-8 py-6 border-b border-border">
        <Link to="/" className="text-xl font-serif italic tracking-widest text-accent">
          AETHER
        </Link>
        <Link
          to="/auth"
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-16">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">A guide</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-light leading-tight mb-8">
          The twelve <span className="italic">zodiac signs.</span>
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-stone-400 leading-relaxed mb-14">
          Every sign is a 30° slice of the ecliptic, and every chart contains all twelve of them
          somewhere. Your Sun sign is only the loudest one. Below: dates, element, modality, ruling
          planet, and what each placement tends to look like in a life — the same material Aether
          reads when it writes your daily resonance from your Sun, Moon, and rising signs together.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border">
          {SIGN_CONTENT.map((s) => (
            <Link
              key={s.slug}
              to="/zodiac-signs/$slug"
              params={{ slug: s.slug }}
              className="bg-background p-6 hover:bg-surface transition-colors group"
            >
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-serif text-2xl italic group-hover:text-accent transition-colors">
                  <span className="mr-2 not-italic">{s.symbol}</span>
                  {s.name}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {s.element}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-accent mb-3">{s.dates}</div>
              <p className="text-sm text-stone-400 leading-relaxed">{s.tagline}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-10">
          <h2 className="font-serif text-2xl sm:text-3xl italic mb-4">Beyond the Sun sign</h2>
          <p className="max-w-2xl text-sm sm:text-base text-stone-400 leading-relaxed mb-8">
            A Sun sign is one placement out of dozens. Your Moon describes your interior weather and
            your rising sign describes the way you meet a room. Aether computes the full natal chart
            from your birth date, time, and city, then writes each day's reading from those
            placements, the current transits, and the notes you keep.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-accent text-primary-foreground py-4 px-10 font-serif italic text-lg hover:bg-stone-100 transition-colors"
          >
            Read your full chart
          </Link>
        </div>
      </main>

      <footer className="py-12 border-t border-border">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>© Aether</div>
          <div>An observatory for one</div>
        </div>
      </footer>
    </div>
  );
}

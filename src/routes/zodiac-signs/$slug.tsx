import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SIGN_CONTENT, signBySlug, type SignContent } from "@/lib/zodiac-content";
import { BirthdaySignLookup } from "@/components/BirthdaySignLookup";
import { SIGN_RANGES, neighbors, formatDay, elementMatches } from "@/lib/sign-lookup";

const BASE = "https://aetherhoroscope.com/zodiac-signs";

function faqFor(sign: SignContent) {
  const range = SIGN_RANGES[sign.slug];
  const { previous, next } = neighbors(sign.slug);
  const start = formatDay(range.start[0], range.start[1]);
  const end = formatDay(range.end[0], range.end[1]);
  const matches = elementMatches(sign).map((s) => s.name);
  return [
    {
      q: `What are the ${sign.name} dates?`,
      a: `${sign.name} dates are ${start} to ${end}. If you were born on or before ${formatDay(range.start[0], range.start[1] - 1 || 1)} you are ${previous.name}; if you were born after ${end} you are ${next.name}.`,
    },
    {
      q: `Is ${sign.name} a ${sign.element.toLowerCase()} sign?`,
      a: `Yes. ${sign.name} is a ${sign.modality.toLowerCase()} ${sign.element.toLowerCase()} sign ruled by ${sign.ruler}.`,
    },
    {
      q: `What signs are most compatible with ${sign.name}?`,
      a: `Traditionally ${sign.name} pairs easily with the other ${sign.element.toLowerCase()} signs and with ${sign.element === "Fire" || sign.element === "Air" ? "air and fire" : "earth and water"} signs generally — ${matches.slice(0, 5).join(", ")}. Real compatibility depends on the whole chart, not the Sun sign alone.`,
    },
    {
      q: `Do the ${sign.name} dates shift from year to year?`,
      a: `Slightly. The Sun enters ${sign.name} around ${start} each year, but the exact moment moves by up to a day depending on the year and your time zone. If your birthday falls on the boundary, your birth time and city settle it.`,
    },
  ];
}

export const Route = createFileRoute("/zodiac-signs/$slug")({
  loader: ({ params }) => {
    const sign = signBySlug(params.slug);
    if (!sign) throw notFound();
    return sign;
  },
  head: ({ params, loaderData }) => {
    const sign = loaderData as SignContent | undefined;
    if (!sign) return { meta: [{ title: "Zodiac sign — Aether" }] };
    const url = `${BASE}/${params.slug}`;
    const title = `${sign.name} Dates: ${sign.dates} — Aether`;
    const description = `${sign.name} dates are ${sign.dates}. A ${sign.modality.toLowerCase()} ${sign.element.toLowerCase()} sign ruled by ${sign.ruler} — traits, strengths, love and work.`;
    const faqs = faqFor(sign);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: `${sign.name}: traits, element and meaning` },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: `${sign.name}: traits, element and meaning`,
                description,
                url,
                about: { "@type": "Thing", name: `${sign.name} (zodiac sign)` },
                publisher: { "@type": "Organization", name: "Aether", url: "https://aetherhoroscope.com/" },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://aetherhoroscope.com/" },
                  { "@type": "ListItem", position: 2, name: "Zodiac signs", item: BASE },
                  { "@type": "ListItem", position: 3, name: sign.name, item: url },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ],
          }),
        },
      ],
    };
  },
  component: SignPage,
});

function SignPage() {
  const sign = Route.useLoaderData();
  const others = SIGN_CONTENT.filter((s) => s.slug !== sign.slug);

  return (
    <div className="min-h-screen text-foreground">
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

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <Link
          to="/zodiac-signs"
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors"
        >
          ← All zodiac signs
        </Link>

        <h1 className="font-serif text-4xl sm:text-6xl font-light leading-tight mt-8 mb-4">
          <span className="mr-3 text-accent">{sign.symbol}</span>
          <span className="italic">{sign.name}</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-10">{sign.dates}</p>

        <dl className="grid grid-cols-3 gap-px bg-border border border-border mb-12">
          {[
            ["Element", sign.element],
            ["Modality", sign.modality],
            ["Ruler", sign.ruler],
          ].map(([k, v]) => (
            <div key={k} className="bg-background p-4">
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{k}</dt>
              <dd className="font-serif italic text-lg sm:text-xl">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="text-base sm:text-lg font-light leading-relaxed text-stone-300 mb-12">
          {sign.intro}
        </p>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12 border-t border-border pt-10">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-accent mb-4">Strengths</h2>
            <ul className="space-y-2">
              {sign.strengths.map((s: string) => (
                <li key={s} className="font-serif text-lg text-stone-200">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-accent mb-4">Challenges</h2>
            <ul className="space-y-2">
              {sign.challenges.map((s: string) => (
                <li key={s} className="font-serif text-lg text-stone-200">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border pt-10 mb-12 space-y-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl italic mb-3">{sign.name} in love</h2>
            <p className="text-sm sm:text-base text-stone-400 leading-relaxed">{sign.inLove}</p>
          </div>
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl italic mb-3">{sign.name} at work</h2>
            <p className="text-sm sm:text-base text-stone-400 leading-relaxed">{sign.atWork}</p>
          </div>
        </section>

        <section className="border-t border-border pt-10 mb-14">
          <h2 className="font-serif text-2xl sm:text-3xl italic mb-3">
            How Aether reads {sign.name}
          </h2>
          <p className="text-sm sm:text-base text-stone-400 leading-relaxed mb-8">
            A Sun in {sign.name} is one voice in a much larger chart. Aether computes your Moon,
            rising sign, and the rest of your placements from your birth date, time, and city, then
            writes each day's resonance from those placements against the current transits — and
            from the moods and events you log in your chronicle. Where a generic {sign.name}{" "}
            horoscope generalizes across a twelfth of the world, your reading is drawn from your
            chart alone.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-accent text-primary-foreground py-4 px-10 font-serif italic text-lg hover:bg-stone-100 transition-colors"
          >
            Read your full chart
          </Link>
        </section>

        <section className="border-t border-border pt-10">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-accent mb-5">Other signs</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {others.map((s) => (
              <Link
                key={s.slug}
                to="/zodiac-signs/$slug"
                params={{ slug: s.slug }}
                className="font-serif italic text-lg text-stone-400 hover:text-accent transition-colors"
              >
                {s.symbol} {s.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>© Aether</div>
          <div>An observatory for one</div>
        </div>
      </footer>
    </div>
  );
}

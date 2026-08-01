import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getBirthChart } from "@/lib/profile.functions";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated/you")({
  head: () => ({
    meta: [
      { title: "You — Aether" },
      { name: "description", content: "Your full natal chart — every planet, sign, and house." },
    ],
  }),
  component: YouPage,
});

type ChartData = Awaited<ReturnType<typeof getBirthChart>>;

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
};

function YouPage() {
  const load = useServerFn(getBirthChart);
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [load]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-3xl mx-auto px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">Your natal chart</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-light leading-tight mb-4">
          The sky at <span className="italic">your arrival.</span>
        </h1>
        {data?.profile?.full_name && (
          <p className="text-stone-400 mb-12">
            {data.profile.full_name} · {data.profile.birth_date}
            {data.profile.birth_time ? ` · ${data.profile.birth_time}` : ""} · {data.profile.birth_place}
          </p>
        )}

        {loading ? (
          <p className="text-stone-500 italic">Reading the sky…</p>
        ) : !data?.chart ? (
          <p className="text-stone-500 italic">
            No chart yet. Add your birth details in Settings to see your full natal chart.
          </p>
        ) : (
          <ChartTable chart={data.chart} />
        )}

        <div className="mt-12">
          <Link
            to="/settings"
            className="inline-block border border-border py-3 px-8 font-serif italic text-lg hover:border-accent transition-colors"
          >
            Settings
          </Link>
        </div>
      </main>
    </div>
  );
}

function ChartTable({ chart }: { chart: NonNullable<NonNullable<ChartData>["chart"]> }) {
  const ascSign = chart.ascendant?.name;
  const mcSign = chart.midheaven?.name;

  const houseOf = (sign: string): number | null => {
    if (!chart.houses) return null;
    const h = chart.houses.find((h) => h.sign === sign);
    return h ? h.house : null;
  };

  const placements: Array<{ body: string; symbol: string; sign: string; house: number | null }> = [];

  if (ascSign) placements.push({ body: "Rising", symbol: "↑", sign: ascSign, house: 1 });
  if (mcSign) placements.push({ body: "Midheaven", symbol: "⊤", sign: mcSign, house: (chart.midheaven as any)?.house ?? 10 });

  for (const p of chart.planets) {
    placements.push({
      body: p.body,
      symbol: PLANET_SYMBOLS[p.body] ?? "•",
      sign: p.name,
      house: (p as any).house ?? houseOf(p.name),
    });
  }

  // Sort by house number
  placements.sort((a, b) => (a.house ?? 99) - (b.house ?? 99));

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="grid grid-cols-[1.2fr_2fr_1fr] text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
        <div className="px-6 py-2">Body</div>
        <div className="px-6 py-2 border-l border-border/40">Sign</div>
        <div className="px-6 py-2 text-right border-l border-border/40">House</div>
      </div>

      {/* Rows */}
      {placements.map((p, i) => {
        const prevItem = placements[i - 1];
        const nextItem = placements[i + 1];
        const isLastRow = i === placements.length - 1;

        // Check if values match adjacent rows
        const signMatchesPrevious = prevItem && prevItem.sign === p.sign;
        const houseMatchesPrevious = prevItem && prevItem.house === p.house;

        const signMatchesNext = nextItem && nextItem.sign === p.sign;
        const houseMatchesNext = nextItem && nextItem.house === p.house;

        // Show border only on the last row of a duplicate group
        const showSignBorder = isLastRow || !signMatchesNext;
        const showHouseBorder = isLastRow || !houseMatchesNext;

        return (
          <div key={i} className="grid grid-cols-[1.2fr_2fr_1fr] items-stretch">
            {/* Body Column: Always shown, no horizontal border */}
            <div className="flex items-center gap-3 px-6 py-2.5">
              <span className="text-accent text-base w-5">{p.symbol}</span>
              <span className="text-[11px] uppercase tracking-[0.2em]">{p.body}</span>
            </div>

            {/* Sign Column: Only show text if it's NOT a repeat of the row above */}
            <div
              className={`font-serif italic text-lg px-6 py-2.5 flex items-center border-l border-border/40 ${
                showSignBorder ? "border-b border-border/40" : ""
              }`}
            >
              {signMatchesPrevious ? "" : p.sign}
            </div>

            {/* House Column: Only show text if it's NOT a repeat of the row above */}
            <div
              className={`text-right font-serif text-xl text-stone-400 px-6 py-2.5 flex items-center justify-end border-l border-border/40 ${
                showHouseBorder ? "border-b border-border/40" : ""
              }`}
            >
              {houseMatchesPrevious ? "" : (p.house ?? "—")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

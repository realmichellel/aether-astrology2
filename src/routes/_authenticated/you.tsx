import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getBirthChart } from "@/lib/profile.functions";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated/you")({
  head: () => ({
    meta: [
      { title: "You — Aeterna" },
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
      <main className="max-w-3xl mx-auto px-8 py-20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">Your natal chart</p>
        <h1 className="font-serif text-5xl font-light leading-tight mb-4">
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

  // Build a row per placement (Ascendant, Midheaven, then planets), each mapped to its house.
  const placements: Array<{ body: string; symbol: string; sign: string; house: number | null }> = [];

  const houseOf = (sign: string): number | null => {
    if (!chart.houses) return null;
    const h = chart.houses.find((h) => h.sign === sign);
    return h ? h.house : null;
  };

  if (ascSign) placements.push({ body: "Rising", symbol: "↑", sign: ascSign, house: 1 });
  if (mcSign) placements.push({ body: "Midheaven", symbol: "⊤", sign: mcSign, house: houseOf(mcSign) });
  for (const p of chart.planets) {
    placements.push({
      body: p.body,
      symbol: PLANET_SYMBOLS[p.body] ?? "•",
      sign: p.name,
      house: houseOf(p.name),
    });
  }

  return (
    <div className="border border-border">
      <div className="grid grid-cols-[1fr_2fr_1fr] text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border px-6 py-3">
        <div>Body</div>
        <div>Sign</div>
        <div className="text-right">House</div>
      </div>
      {placements.map((p, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_2fr_1fr] items-center px-6 py-4 border-b border-border/50 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <span className="text-accent text-lg w-5">{p.symbol}</span>
            <span className="text-[11px] uppercase tracking-[0.2em]">{p.body}</span>
          </div>
          <div className="font-serif italic text-xl">{p.sign}</div>
          <div className="text-right font-serif text-lg text-stone-400">
            {p.house ?? "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

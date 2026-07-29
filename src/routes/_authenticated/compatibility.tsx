import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppNav } from "@/components/AppNav";
import { generateCompatibility } from "@/lib/compatibility.functions";

export const Route = createFileRoute("/_authenticated/compatibility")({
  head: () => ({
    meta: [
      { title: "Synastry — Aether" },
      { name: "description", content: "A synastry report between your chart and another's." },
    ],
  }),
  component: CompatibilityPage,
});

type Placements = {
  name: string;
  sun: string;
  moon: string;
  rising: string;
  venus: string;
  mars: string;
  mercury: string;
};

type Report = {
  overall_score: number;
  dynamic_summary: string;
  emotional_bond: { stars: number; text: string };
  chemistry_and_attraction: { stars: number; text: string };
  communication_style: string;
  potential_friction_points: string[];
  super_powers: string[];
  crush_cheat_sheet: {
    green_flags: string[];
    red_flags: string[];
    how_to_give_them_butterflies: string;
  };
};

function CompatibilityPage() {
  const run = useServerFn(generateCompatibility);
  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ report: Report; person1: Placements; person2: Placements } | null>(
    null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await run({ data: form });
      setResult({
        report: JSON.parse(r.reportJson) as Report,
        person1: r.person1,
        person2: r.person2,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-4xl mx-auto px-8 py-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Synastry</p>
        <h1 className="font-serif text-5xl font-light leading-tight mb-4">
          Two charts, <span className="italic">one sky.</span>
        </h1>
        <p className="text-stone-400 max-w-lg mb-12">
          Enter another person's birth details. Aether will read their chart against yours and
          return a synastry report — attraction, friction, and everything the sky says about you two.
        </p>

        <form onSubmit={submit} className="border border-border bg-surface p-6 space-y-6 mb-16">
          <Field
            label="Their name"
            value={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
            placeholder="Who are we reading?"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Birth date"
              type="date"
              value={form.birth_date}
              onChange={(v) => setForm({ ...form, birth_date: v })}
              required
            />
            <Field
              label="Birth time"
              type="time"
              value={form.birth_time}
              onChange={(v) => setForm({ ...form, birth_time: v })}
              required
            />
          </div>
          <Field
            label="City of birth"
            value={form.birth_place}
            onChange={(v) => setForm({ ...form, birth_place: v })}
            placeholder="e.g. Lisbon, Portugal"
            required
          />

          {error && (
            <p className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/40 px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="bg-accent text-primary-foreground py-3 px-8 font-serif italic text-lg hover:bg-stone-100 transition-colors disabled:opacity-40"
            >
              {busy ? "Reading the two skies…" : "Generate synastry"}
            </button>
          </div>
        </form>

        {result && <ReportView data={result} />}
      </main>
    </div>
  );
}

function ReportView({
  data,
}: {
  data: { report: Report; person1: Placements; person2: Placements };
}) {
  const { report, person1, person2 } = data;
  return (
    <div className="space-y-12">
      <section className="border border-border p-10 bg-surface text-center">
        <div className="text-[10px] uppercase tracking-widest text-accent mb-6">
          Overall resonance
        </div>
        <div className="font-serif text-7xl italic text-accent mb-4">{report.overall_score}%</div>
        <p className="font-serif italic text-2xl text-stone-200 max-w-2xl mx-auto">
          {report.dynamic_summary}
        </p>
        <div className="flex justify-center gap-12 mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <div>
            <div className="text-accent mb-1">{person1.name}</div>
            <div>☉ {person1.sun} · ☾ {person1.moon} · ↑ {person1.rising}</div>
          </div>
          <div>
            <div className="text-accent mb-1">{person2.name}</div>
            <div>☉ {person2.sun} · ☾ {person2.moon} · ↑ {person2.rising}</div>
          </div>
        </div>
      </section>

      <Block title="Emotional bond" stars={report.emotional_bond?.stars}>
        {report.emotional_bond?.text}
      </Block>
      <Block title="Chemistry & attraction" stars={report.chemistry_and_attraction?.stars}>
        {report.chemistry_and_attraction?.text}
      </Block>
      <Block title="Communication style">{report.communication_style}</Block>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ListBlock title="Potential friction" items={report.potential_friction_points} />
        <ListBlock title="Super powers" items={report.super_powers} />
      </div>

      <section className="border border-border bg-surface p-10">
        <div className="text-[10px] uppercase tracking-widest text-accent mb-6">
          Crush cheat sheet
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
              Green flags
            </div>
            <ul className="space-y-2 text-stone-300">
              {report.crush_cheat_sheet?.green_flags?.map((g, i) => (
                <li key={i} className="font-serif italic">· {g}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-rose-400/80 mb-2">
              Red flags
            </div>
            <ul className="space-y-2 text-stone-300">
              {report.crush_cheat_sheet?.red_flags?.map((r, i) => (
                <li key={i} className="font-serif italic">· {r}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-accent mb-3">
            How to give them butterflies
          </div>
          <p className="font-serif italic text-xl text-stone-200 leading-relaxed">
            {report.crush_cheat_sheet?.how_to_give_them_butterflies}
          </p>
        </div>
      </section>
    </div>
  );
}

function Block({
  title,
  stars,
  children,
}: {
  title: string;
  stars?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-surface p-10">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-[10px] uppercase tracking-widest text-accent">{title}</div>
        {typeof stars === "number" && <Stars n={stars} />}
      </div>
      <p className="text-stone-300 leading-relaxed">{children}</p>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border border-border bg-surface p-8">
      <div className="text-[10px] uppercase tracking-widest text-accent mb-4">{title}</div>
      <ul className="space-y-3 text-stone-300 font-serif italic text-lg">
        {items?.map((it, i) => <li key={i}>· {it}</li>)}
      </ul>
    </section>
  );
}

function Stars({ n }: { n: number }) {
  const full = Math.round(Math.max(0, Math.min(5, n)));
  return (
    <div className="text-accent tracking-widest text-lg">
      {"★".repeat(full)}
      <span className="text-stone-700">{"★".repeat(5 - full)}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border-b border-border py-2 focus:outline-none focus:border-accent transition-colors [color-scheme:dark]"
      />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppNav } from "@/components/AppNav";
import {
  generateCompatibility,
  listSynastryReports,
  getSynastryReport,
} from "@/lib/compatibility.functions";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { SYNASTRY_UNLOCK_PRICE_ID } from "@/lib/stripe";

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
  communication_style: { stars: number; text: string };
  potential_friction_points: string[];
  super_powers: string[];
  crush_cheat_sheet: {
    green_flags: string[];
    red_flags: string[];
    how_to_give_them_butterflies: string;
  };
};

type HistoryItem = {
  id: string;
  partner_name: string;
  unlocked: boolean;
  created_at: string;
  overall_score: number;
};

type Loaded = {
  id: string;
  report: Report;
  person1: Placements;
  person2: Placements;
  unlocked: boolean;
};

function CompatibilityPage() {
  const run = useServerFn(generateCompatibility);
  const listAll = useServerFn(listSynastryReports);
  const loadOne = useServerFn(getSynastryReport);

  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [active, setActive] = useState<Loaded | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [settlementNotice, setSettlementNotice] = useState<string | null>(null);

  async function refreshHistory() {
    const items = await listAll();
    setHistory(items as HistoryItem[]);
  }

  useEffect(() => {
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await run({ data: form });
      setActive({
        id: r.id,
        report: r.report as Report,
        person1: r.person1,
        person2: r.person2,
        unlocked: r.unlocked,
      });
      setShowForm(false);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function openReport(id: string) {
    setError(null);
    const r = await loadOne({ data: { id } });
    setActive({
      id: r.id,
      report: r.report as Report,
      person1: r.person1,
      person2: r.person2,
      unlocked: r.unlocked,
    });
    setShowForm(false);
  }

  function unlock() {
    if (!active) return;
    setCheckoutId(active.id);
  }

  // After returning from checkout, claim the purchase directly (self-healing if
  // the Stripe webhook fails), then poll until the unlock is visible.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("report");
    const sessionId = params.get("session_id");
    if (params.get("checkout") !== "success" || !reportId) return;
    window.history.replaceState({}, "", window.location.pathname);
    setSettling(true);
    setCheckoutId(null);
    let tries = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (sessionId) {
      void claim({ data: { sessionId, environment: getStripeEnvironment() } }).catch(() => {});
    }

    const poll = async () => {
      tries += 1;
      try {
        const r = await loadOne({ data: { id: reportId } });
        if (cancelled) return;
        if (r.unlocked) {
          setSettling(false);
          setSettlementNotice("Purchase confirmed. Your full reading is unlocked.");
          setActive({
            id: r.id,
            report: r.report as Report,
            person1: r.person1,
            person2: r.person2,
            unlocked: true,
          });
          setShowForm(false);
          await refreshHistory();
          return;
        }
      } catch {
        // Retry transient failures without leaving the confirmation UI stuck.
      }
      if (tries >= 30) {
        setSettling(false);
        setSettlementNotice("Payment received. Refresh shortly if the full reading is still updating.");
        return;
      }
      timer = setTimeout(poll, 2000);
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <AppNav />
      {settling && (
        <div className="border-b border-accent/30 bg-surface px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-accent">
          Confirming your purchase…
        </div>
      )}
      {settlementNotice && !settling && (
        <div className="border-b border-accent/30 bg-surface px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-accent">
          {settlementNotice}
        </div>
      )}
      {checkoutId && (
        <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="font-serif italic text-3xl">Unlock the full reading</h3>
              <button
                onClick={() => setCheckoutId(null)}
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
              >
                Close
              </button>
            </div>
            <StripeEmbeddedCheckout
              priceId={SYNASTRY_UNLOCK_PRICE_ID}
              reportId={checkoutId}
              returnUrl={`${window.location.origin}/compatibility?checkout=success&report=${checkoutId}`}
            />
          </div>
        </div>
      )}
      <main className="max-w-6xl mx-auto px-5 py-8 sm:px-8 sm:py-12 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Synastry</p>
          <h1 className="font-serif text-3xl sm:text-5xl font-light leading-tight mb-4">
            Two charts, <span className="italic">one sky.</span>
          </h1>
          <p className="text-stone-400 max-w-lg mb-10">
            Enter another person's birth details. Aether will read their chart against yours and
            return a synastry report — attraction, friction, and everything the sky says about you two.
          </p>

          {showForm ? (
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
          ) : (
            <button
              onClick={() => {
                setActive(null);
                setShowForm(true);
                setForm({ full_name: "", birth_date: "", birth_time: "", birth_place: "" });
              }}
              className="text-[10px] uppercase tracking-[0.2em] text-accent mb-8 hover:text-stone-100"
            >
              ← New reading
            </button>
          )}

          {active && <ReportView data={active} onUnlock={unlock} />}
        </div>

        <aside className="md:border-l md:border-border md:pl-8">
          <div className="text-[10px] uppercase tracking-widest text-accent mb-4">Past readings</div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nothing yet.</p>
          ) : (
            <ul className="space-y-4">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => openReport(h.id)}
                    className={`text-left w-full group ${
                      active?.id === h.id ? "text-accent" : "text-stone-300 hover:text-accent"
                    }`}
                  >
                    <div className="font-serif italic text-lg">{h.partner_name}</div>
                    <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                      <span>
                        {new Date(h.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        {h.overall_score}% · {h.unlocked ? "unlocked" : "locked"}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>
    </div>
  );
}

function ReportView({ data, onUnlock }: { data: Loaded; onUnlock: () => void }) {
  const { report, person1, person2, unlocked } = data;
  return (
    <div className="space-y-12">
      <section className="border border-border p-10 bg-surface text-center">
        <div className="text-[10px] uppercase tracking-widest text-accent mb-6">
          Overall resonance
        </div>
        <div className="font-serif text-7xl italic text-accent mb-4">{report.overall_score}%</div>
        <p className="font-serif italic text-lg sm:text-2xl text-stone-200 max-w-2xl mx-auto">
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

      {!unlocked && <UnlockCard onUnlock={onUnlock} />}

      <Block title="Emotional bond" stars={report.emotional_bond?.stars} locked={!unlocked}>
        {report.emotional_bond?.text}
      </Block>
      <Block
        title="Chemistry & attraction"
        stars={report.chemistry_and_attraction?.stars}
        locked={!unlocked}
      >
        {report.chemistry_and_attraction?.text}
      </Block>
      <Block
        title="Communication style"
        stars={report.communication_style?.stars}
        locked={!unlocked}
      >
        {report.communication_style?.text}
      </Block>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ListBlock
          title="Potential friction"
          items={report.potential_friction_points}
          locked={!unlocked}
        />
        <ListBlock title="Super powers" items={report.super_powers} locked={!unlocked} />
      </div>

      <section className="border border-border bg-surface p-10">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light mb-8">Crush cheat sheet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80 mb-3">
              Green flags
            </div>
            <Veil locked={!unlocked}>
              <ul className="space-y-3 text-[15px] leading-relaxed text-stone-300">
                {report.crush_cheat_sheet?.green_flags?.map((g, i) => (
                  <li key={i} className="pl-4 border-l border-border">{g}</li>
                ))}
              </ul>
            </Veil>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-rose-400/80 mb-3">
              Red flags
            </div>
            <Veil locked={!unlocked}>
              <ul className="space-y-3 text-[15px] leading-relaxed text-stone-300">
                {report.crush_cheat_sheet?.red_flags?.map((r, i) => (
                  <li key={i} className="pl-4 border-l border-border">{r}</li>
                ))}
              </ul>
            </Veil>
          </div>
        </div>
        <div className="pt-8 border-t border-border">
          <div className="text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
            How to give them butterflies
          </div>
          <Veil locked={!unlocked}>
            <p className="text-sm sm:text-base leading-[1.85] text-stone-300 max-w-2xl">
              {report.crush_cheat_sheet?.how_to_give_them_butterflies}
            </p>
          </Veil>
        </div>
      </section>
    </div>
  );
}

/** Blurs only the body content, so section titles stay readable while locked. */
function Veil({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-[6px] select-none pointer-events-none opacity-70">{children}</div>
      <div className="absolute inset-0" aria-hidden />
    </div>
  );
}

function UnlockCard({ onUnlock }: { onUnlock: () => void }) {
  return (
    <section className="border border-accent/40 bg-surface p-8 text-center">
      <div className="text-[10px] uppercase tracking-widest text-accent mb-3">
        The rest is written
      </div>
      <h3 className="font-serif italic text-3xl mb-3">Unlock the full reading</h3>
      <p className="text-sm text-stone-400 mb-6 leading-relaxed max-w-md mx-auto">
        Emotional bond, chemistry, communication, friction, super powers, and the crush cheat sheet
        — all yours for <span className="text-accent">$3.99</span>.
      </p>
      <button
        onClick={onUnlock}
        className="bg-accent text-primary-foreground py-3 px-10 font-serif italic text-lg hover:bg-stone-100 transition-colors"
      >
        Unlock — $3.99
      </button>
    </section>
  );
}


function Block({
  title,
  stars,
  locked,
  children,
}: {
  title: string;
  stars?: number;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-surface p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-border">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light leading-none">{title}</h2>
        {typeof stars === "number" &&
          (locked ? (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Locked
            </span>
          ) : (
            <Stars n={stars} />
          ))}
      </div>
      <Veil locked={!!locked}>
        <p className="text-sm sm:text-base leading-[1.85] text-stone-300 max-w-2xl">
          {children}
        </p>
      </Veil>
    </section>
  );
}

function ListBlock({
  title,
  items,
  locked,
}: {
  title: string;
  items: string[];
  locked?: boolean;
}) {
  return (
    <section className="border border-border bg-surface p-10 h-full">
      <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-light mb-6 pb-5 border-b border-border">
        {title}
      </h2>
      <Veil locked={!!locked}>
        <ul className="space-y-4 text-[15px] leading-relaxed text-stone-300">
          {items?.map((it, i) => (
            <li key={i} className="pl-4 border-l border-border">{it}</li>
          ))}
        </ul>
      </Veil>
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

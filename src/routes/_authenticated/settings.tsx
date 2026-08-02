import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, saveProfile } from "@/lib/profile.functions";
import { getEmailPreferences, setMarketingOptIn } from "@/lib/consent.functions";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Aether" },
      { name: "description", content: "Review or correct the birth details Aether reads your chart from." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const load = useServerFn(getProfile);
  const save = useServerFn(saveProfile);
  const loadPrefs = useServerFn(getEmailPreferences);
  const savePrefs = useServerFn(setMarketingOptIn);

  const [form, setForm] = useState({ full_name: "", birth_date: "", birth_time: "", birth_place: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [marketingSaved, setMarketingSaved] = useState(false);

  useEffect(() => {
    load().then((p) => {
      if (p) {
        setForm({
          full_name: p.full_name ?? "",
          birth_date: p.birth_date ?? "",
          birth_time: p.birth_time ?? "",
          birth_place: p.birth_place ?? "",
        });
      }
      setLoading(false);
    });
  }, [load]);

  useEffect(() => {
    loadPrefs()
      .then((prefs) => setMarketing(Boolean(prefs?.marketing_opt_in)))
      .catch(() => undefined);
  }, [loadPrefs]);

  async function toggleMarketing(next: boolean) {
    setMarketing(next);
    setMarketingSaved(false);
    try {
      await savePrefs({ data: { marketing_opt_in: next } });
      setMarketingSaved(true);
    } catch {
      setMarketing(!next);
    }
  }


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await save({ data: form });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-2xl mx-auto px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">Your natal configuration</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-light leading-tight mb-4">
          Correct the record, <span className="italic">if the sky was wrong.</span>
        </h1>
        <p className="text-stone-400 mb-12 max-w-lg">
          Everything Aether reads — your sun, moon, rising, and every reading since — is computed
          from what's below. Change it, and your chart recalculates from here on.
        </p>

        {loading ? (
          <p className="text-stone-500 italic">Loading your details…</p>
        ) : (
          <form onSubmit={submit} className="space-y-8">
            <Field
              label="Name"
              value={form.full_name}
              onChange={(v) => setForm({ ...form, full_name: v })}
              placeholder="What should Aether call you?"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field
                label="Birth date"
                value={form.birth_date}
                onChange={(v) => setForm({ ...form, birth_date: v })}
                type="date"
                required
              />
              <Field
                label="Birth time"
                value={form.birth_time}
                onChange={(v) => setForm({ ...form, birth_time: v })}
                type="time"
              />
            </div>
            <Field
              label="City of birth"
              value={form.birth_place}
              onChange={(v) => setForm({ ...form, birth_place: v })}
              placeholder="e.g. Casablanca, Morocco"
              required
            />

            {error && (
              <p className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/40 px-4 py-2">
                {error}
              </p>
            )}
            {saved && !error && (
              <p className="text-sm text-accent border border-accent/30 bg-accent/5 px-4 py-2">
                Saved. Your chart has been recalculated.
              </p>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={busy}
                className="bg-accent text-primary-foreground py-4 px-10 font-serif italic text-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                {busy ? "Recalculating…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/you" })}
                className="border border-border py-4 px-10 font-serif italic text-lg hover:border-accent transition-colors"
              >
                Back to chart
              </button>
            </div>
          </form>
        )}

        <section className="mt-16 pt-10 border-t border-border">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Email</p>
          <label className="flex items-start gap-3 text-xs sm:text-sm font-light leading-relaxed text-stone-400 cursor-pointer">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => toggleMarketing(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[#C2A378]"
            />
            <span>Send me promotional offers and astrology updates by email.</span>
          </label>
          {marketingSaved && (
            <p className="text-xs text-accent mt-3">Preference saved.</p>
          )}
        </section>
      </main>

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

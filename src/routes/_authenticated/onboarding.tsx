import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, saveProfile } from "@/lib/profile.functions";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Your birth chart — Aeterna" },
      { name: "description", content: "Tell Aeterna when and where you were born." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const load = useServerFn(getProfile);
  const save = useServerFn(saveProfile);

  const [form, setForm] = useState({ full_name: "", birth_date: "", birth_time: "", birth_place: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load().then((p) => {
      if (p) navigate({ to: "/dashboard", replace: true });
    });
  }, [load, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await save({ data: { ...form, birth_time: form.birth_time || null } });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-2xl mx-auto px-8 py-20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">The natal configuration</p>
        <h1 className="font-serif text-5xl font-light leading-tight mb-4">
          When and where <span className="italic">did you arrive?</span>
        </h1>
        <p className="text-stone-400 mb-12 max-w-lg">
          The sky at the moment of your birth is the map Aeterna reads from. Be as precise as you can —
          the time in particular shapes your ascendant.
        </p>

        <form onSubmit={submit} className="space-y-8">
          <Field
            label="Name"
            value={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
            placeholder="What should Aeterna call you?"
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
              label="Birth time (optional)"
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

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-accent text-primary-foreground py-4 font-serif italic text-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            {busy ? "Reading the sky…" : "Calculate alignment"}
          </button>
        </form>
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

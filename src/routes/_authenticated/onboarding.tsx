import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, saveProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Your birth chart — Ephemeris" },
      { name: "description", content: "Enter your birth information to generate your personal astrology chart." },
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
      if (p) navigate({ to: "/dashboard" });
    });
  }, [load, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await save({ data: { ...form, birth_time: form.birth_time || null } });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-eyebrow">Step one</p>
      <h1 className="text-display mt-4 text-4xl">Where the sky was when you arrived.</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        The chart is built from these four things. Be as precise as you can.
      </p>

      <form onSubmit={onSubmit} className="mt-12 space-y-8">
        <Field label="Name">
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Date of birth">
          <input required type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
        </Field>
        <Field label="Time of birth (optional)">
          <input type="time" value={form.birth_time} onChange={(e) => setForm({ ...form, birth_time: e.target.value })} />
        </Field>
        <Field label="Place of birth">
          <input required placeholder="City, Country" value={form.birth_place} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} />
        </Field>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full border border-gold bg-gold px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          style={{ color: "var(--background)" }}
        >
          {busy ? "Drawing your chart…" : "Draw my chart"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-eyebrow">{label}</span>
      <div className="mt-3 [&_input]:w-full [&_input]:border-0 [&_input]:border-b [&_input]:border-border [&_input]:bg-transparent [&_input]:pb-2 [&_input]:text-lg [&_input]:text-foreground [&_input]:outline-none [&_input:focus]:border-gold">
        {children}
      </div>
    </label>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, saveProfile } from "@/lib/profile.functions";
import { CityCombobox } from "@/components/CityCombobox";

import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Aether" },
      { name: "description", content: "Review or correct the birth details Aether reads your chart from." },
      { property: "og:title", content: "Settings — Aether" },
      {
        property: "og:description",
        content: "Review or correct the birth details Aether reads your chart from.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },

    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const load = useServerFn(getProfile);
  const save = useServerFn(saveProfile);

  const [form, setForm] = useState({ full_name: "", birth_date: "", birth_time: "", birth_place: "" });
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load().then((p) => {
      if (p) {
        setForm({
          full_name: p.full_name ?? "",
          birth_date: p.birth_date ?? "",
          birth_time: p.birth_time ?? "",
          birth_place: p.birth_place ?? "",
        });
        if (p.birth_lat != null && p.birth_lng != null) {
          setCoords({ lat: Number(p.birth_lat), lon: Number(p.birth_lng) });
        }
      }
      setLoading(false);
    });
  }, [load]);



  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!coords) {
      setError("Choose your city of birth from the dropdown list.");
      return;
    }
    setBusy(true);
    try {
      await save({ data: { ...form, birth_lat: coords.lat, birth_lng: coords.lon } });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground">
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
            <CityCombobox
              value={form.birth_place}
              onSelect={(o) => {
                setForm((f) => ({ ...f, birth_place: o?.label ?? "" }));
                setCoords(o ? { lat: o.lat, lon: o.lon } : null);
              }}
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

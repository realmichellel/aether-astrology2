import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, saveProfile } from "@/lib/profile.functions";
import { AppNav } from "@/components/AppNav";
import { CityCombobox } from "@/components/CityCombobox";
import { trackPixel } from "@/lib/meta-pixel";
import { readBirthDraft, clearBirthDraft, trackFunnel } from "@/lib/birth-draft";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Your birth chart — Aether" },
      {
        name: "description",
        content:
          "Enter your birth date, time, and city so Aether can calculate your full natal chart and begin your daily readings.",
      },
      { property: "og:title", content: "Your birth chart — Aether" },
      {
        property: "og:description",
        content: "Tell Aether when and where you arrived, and it will compute your natal chart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),

  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const load = useServerFn(getProfile);
  const save = useServerFn(saveProfile);

  const [form, setForm] = useState({ full_name: "", birth_date: "", birth_time: "", birth_place: "" });
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    load().then(async (p) => {
      if (!active) return;
      if (p) {
        clearBirthDraft();
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      // Birth details entered before signing up: write them straight through
      // so nobody types their chart twice.
      const draft = readBirthDraft();
      if (!draft) return;
      setBusy(true);
      setForm({
        full_name: draft.full_name,
        birth_date: draft.birth_date,
        birth_time: draft.birth_time,
        birth_place: draft.birth_place,
      });
      setCoords({ lat: draft.birth_lat, lon: draft.birth_lng });
      try {
        await save({
          data: {
            full_name: draft.full_name,
            birth_date: draft.birth_date,
            birth_time: draft.birth_time,
            birth_place: draft.birth_place,
            birth_lat: draft.birth_lat,
            birth_lng: draft.birth_lng,
          },
        });
        clearBirthDraft();
        trackPixel("CompleteRegistration", { content_name: "natal_chart_created" });
        trackFunnel("ChartCreated", { source: "pre_signup_draft" });
        navigate({ to: "/dashboard", replace: true });
      } catch {
        // Fall back to the form, already filled in with what they gave us.
        clearBirthDraft();
        if (active) setBusy(false);
      }
    });
    return () => {
      active = false;
    };
  }, [load, save, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!coords) {
      setError("Choose your city of birth from the dropdown list.");
      return;
    }
    setBusy(true);
    try {
      await save({ data: { ...form, birth_lat: coords.lat, birth_lng: coords.lon } });
      trackPixel("CompleteRegistration", { content_name: "natal_chart_created" });
      trackFunnel("ChartCreated", { source: "onboarding_form" });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground">
      <AppNav />
      <main className="max-w-2xl mx-auto px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">The natal configuration</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-light leading-tight mb-4">
          When and where <span className="italic">did you arrive?</span>
        </h1>
        <p className="text-stone-400 mb-12 max-w-lg">
          The sky at the moment of your birth is the map Aether reads from. All three fields below
          are required — the exact time in particular is what fixes your rising sign and houses; an
          approximate time will place them in the wrong sign.
        </p>

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
              required
            />
          </div>
          <CityCombobox
            value={form.birth_place}
            onSelect={(o) => {
              setForm((f) => ({ ...f, birth_place: o?.label ?? "" }));
              setCoords(o ? { lat: o.lat, lon: o.lon } : null);
            }}
          />

          <p className="text-xs text-muted-foreground -mt-2">
            Don't know your exact birth time? Check your birth certificate or ask family — it's the
            one detail we can't approximate our way around.
          </p>

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
            {busy ? "Building your chart…" : "Calculate alignment"}
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
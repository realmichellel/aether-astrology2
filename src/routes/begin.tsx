import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useId } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CityCombobox } from "@/components/CityCombobox";
import { saveBirthDraft, trackFunnel } from "@/lib/birth-draft";

export const Route = createFileRoute("/begin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your birth chart — Aether" },
      {
        name: "description",
        content:
          "Enter your birth date, time, and city. Aether calculates your natal chart and reads it every day.",
      },
      { property: "og:title", content: "Your birth chart — Aether" },
      {
        property: "og:description",
        content: "Tell Aether when and where you arrived, and it will map your sky.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aetherhoroscope.com/begin" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://aetherhoroscope.com/begin" }],
  }),
  component: Begin,
});

function Begin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    trackFunnel("BirthFormViewed");
    // Already signed in? The chart belongs on their account, not here.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  function edit(patch: Partial<typeof form>) {
    if (!touched) {
      setTouched(true);
      trackFunnel("BirthFormStarted");
    }
    setForm((f) => ({ ...f, ...patch }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!coords) {
      setError("Choose your city of birth from the dropdown list.");
      return;
    }
    saveBirthDraft({ ...form, birth_lat: coords.lat, birth_lng: coords.lon });
    trackFunnel("BirthFormSubmitted");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen text-foreground">
      <nav className="flex items-center justify-between px-6 sm:px-8 py-6 border-b border-border">
        <Link to="/" className="text-xl font-serif italic tracking-widest text-gilded">
          AETHER
        </Link>
        <Link
          to="/auth"
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
          Step one of two — no account needed yet
        </p>
        <h1 className="font-serif text-2xl sm:text-5xl font-light leading-tight mb-4">
          When and where <span className="italic">did you arrive?</span>
        </h1>
        <p className="text-sm sm:text-base text-stone-400 mb-10 max-w-lg">
          The sky at the moment of your birth is the map Aether reads from. The exact time is what
          fixes your rising sign and houses.
        </p>

        <form onSubmit={submit} className="space-y-8">
          <Field
            label="Name"
            value={form.full_name}
            onChange={(v) => edit({ full_name: v })}
            placeholder="What should Aether call you?"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field
              label="Birth date"
              value={form.birth_date}
              onChange={(v) => edit({ birth_date: v })}
              type="date"
              required
            />
            <Field
              label="Birth time"
              value={form.birth_time}
              onChange={(v) => edit({ birth_time: v })}
              type="time"
              required
            />
          </div>
          <CityCombobox
            value={form.birth_place}
            onSelect={(o) => {
              edit({ birth_place: o?.label ?? "" });
              setCoords(o ? { lat: o.lat, lon: o.lon } : null);
            }}
          />

          {error && (
            <p className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/40 px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-accent text-primary-foreground py-4 font-serif italic text-lg hover:bg-stone-100 transition-colors"
          >
            Reveal my chart
          </button>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
            100% private &amp; encrypted · Free to start
          </p>
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
  const fieldId = useId();
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block"
      >
        {label}
      </label>
      <input
        id={fieldId}
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

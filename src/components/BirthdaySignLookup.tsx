import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MONTHS, daysInMonth, signForDate, formatDay } from "@/lib/sign-lookup";

/** Public, no-account birthday → Sun sign lookup. */
export function BirthdaySignLookup({ heading = "What's my zodiac sign?" }: { heading?: string }) {
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [result, setResult] = useState<ReturnType<typeof signForDate> | null>(null);

  const maxDay = daysInMonth(month);
  const safeDay = Math.min(day, maxDay);

  return (
    <section className="border border-border p-6 sm:p-8">
      <h2 className="font-serif text-2xl sm:text-3xl italic mb-2">{heading}</h2>
      <p className="text-sm text-stone-400 leading-relaxed mb-6">
        Enter the day you were born and we'll name the Sun sign that holds it.
      </p>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(signForDate(month, safeDay) ?? null);
        }}
      >
        <div>
          <label
            htmlFor="lookup-month"
            className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2"
          >
            Month
          </label>
          <select
            id="lookup-month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-background border border-border px-3 py-2 text-sm font-serif"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="lookup-day"
            className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2"
          >
            Day
          </label>
          <select
            id="lookup-day"
            value={safeDay}
            onChange={(e) => setDay(Number(e.target.value))}
            className="bg-background border border-border px-3 py-2 text-sm font-serif"
          >
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-accent text-primary-foreground px-6 py-2.5 font-serif italic text-base hover:bg-stone-100 transition-colors"
        >
          Find my sign
        </button>
      </form>

      {result && (
        <div className="mt-6 border-t border-border pt-6" aria-live="polite">
          <p className="text-sm text-stone-400 mb-1">
            Born {formatDay(month, safeDay)}, your Sun sign is
          </p>
          <p className="font-serif text-3xl italic mb-3">
            <span className="mr-2 not-italic text-accent">{result.symbol}</span>
            {result.name}
          </p>
          <p className="text-sm text-stone-400 leading-relaxed mb-4">{result.tagline}</p>
          <Link
            to="/zodiac-signs/$slug"
            params={{ slug: result.slug }}
            className="text-sm text-accent underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Read the full {result.name} guide
          </Link>
        </div>
      )}
    </section>
  );
}

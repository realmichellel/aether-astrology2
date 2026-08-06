import { useEffect, useId, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchCities, type CityOption } from "@/lib/places.functions";

export function CityCombobox({
  value,
  onSelect,
  label = "City of birth",
}: {
  value: string;
  onSelect: (option: CityOption | null) => void;
  label?: string;
}) {
  const search = useServerFn(searchCities);
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const confirmed = useRef(value);
  const inputId = useId();

  useEffect(() => {
    setQuery(value);
    confirmed.current = value;
  }, [value]);

  useEffect(() => {
    if (!open || query.trim().length < 2 || query === confirmed.current) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await search({ data: { q: query.trim() } });
        if (!cancelled) setOptions(res);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, search]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <label
        htmlFor={inputId}
        className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={query}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onSelect(null);
        }}
        placeholder="Start typing a city — e.g. Casablanca"
        className="w-full bg-transparent border-b border-border py-2 focus:outline-none focus:border-accent transition-colors [color-scheme:dark]"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {query && query === confirmed.current
          ? "Location confirmed."
          : "Choose a city from the list — Aether needs exact coordinates."}
      </p>

      {open && (loading || options.length > 0) && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-auto border border-border bg-background shadow-lg">
          {loading && <li className="px-4 py-3 text-xs text-muted-foreground italic">Searching…</li>}
          {options.map((o) => (
            <li key={`${o.label}-${o.lat}-${o.lon}`}>
              <button
                type="button"
                onClick={() => {
                  confirmed.current = o.label;
                  setQuery(o.label);
                  setOpen(false);
                  setOptions([]);
                  onSelect(o);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-accent/10 hover:text-accent transition-colors"
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

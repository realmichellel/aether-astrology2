import type { PlanetPlacement } from "./birth-chart";

export type AspectNature = "harmonious" | "challenging" | "neutral";

export interface AspectHit {
  body1: string;
  body2: string;
  aspect: string;
  orb: number;
  nature: AspectNature;
}

const ASPECTS: { name: string; angle: number; orb: number; nature: AspectNature }[] = [
  { name: "conjunction", angle: 0, orb: 8, nature: "neutral" },
  { name: "sextile", angle: 60, orb: 5, nature: "harmonious" },
  { name: "square", angle: 90, orb: 7, nature: "challenging" },
  { name: "trine", angle: 120, orb: 7, nature: "harmonious" },
  { name: "opposition", angle: 180, orb: 8, nature: "challenging" },
];

const RELEVANT = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

function separation(a: number, b: number) {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/** Cross-chart aspects between person 1's and person 2's planets. */
export function computeAspects(p1: PlanetPlacement[], p2: PlanetPlacement[]): AspectHit[] {
  const hits: AspectHit[] = [];
  for (const a of p1.filter((p) => RELEVANT.includes(p.body))) {
    for (const b of p2.filter((p) => RELEVANT.includes(p.body))) {
      const sep = separation(a.longitude, b.longitude);
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) {
          hits.push({ body1: a.body, body2: b.body, aspect: asp.name, orb, nature: asp.nature });
          break;
        }
      }
    }
  }
  return hits.sort((x, y) => x.orb - y.orb);
}

/** Rough 0-100 compatibility baseline from cross-chart aspects. */
export function scoreFromAspects(hits: AspectHit[]): number {
  let score = 50;
  for (const h of hits) {
    const weight = Math.max(0, 1 - h.orb / 8);
    if (h.nature === "harmonious") score += 5 * weight;
    if (h.nature === "challenging") score -= 4 * weight;
    if (h.nature === "neutral") score += 1.5 * weight;
  }
  return Math.round(Math.max(5, Math.min(98, score)));
}

// Category → which body pairs count toward it. A hit only "belongs" to a
// category if both bodies are in its list.
const CATEGORY_BODIES = {
  emotional_bond: ["Sun", "Moon"],
  chemistry_and_attraction: ["Venus", "Mars"],
  communication_style: ["Mercury", "Moon", "Sun"],
} as const;

export type SynastryCategory = keyof typeof CATEGORY_BODIES;

export function aspectsForCategory(hits: AspectHit[], category: SynastryCategory): AspectHit[] {
  const bodies = CATEGORY_BODIES[category];
  return hits.filter((h) => bodies.includes(h.body1 as any) && bodies.includes(h.body2 as any));
}

/** Same weighting as scoreFromAspects, rescaled to a 0-5 star baseline. */
export function starsFromAspects(hits: AspectHit[]): number {
  let score = 50;
  for (const h of hits) {
    const weight = Math.max(0, 1 - h.orb / 8);
    if (h.nature === "harmonious") score += 8 * weight;
    if (h.nature === "challenging") score -= 7 * weight;
    if (h.nature === "neutral") score += 2 * weight;
  }
  const clamped = Math.max(5, Math.min(98, score));
  return Math.round((clamped / 100) * 5 * 2) / 2; // nearest 0.5
}

function describeCategoryAspects(hits: AspectHit[]): string {
  if (hits.length === 0) return "No notable aspects in this domain — largely neutral, low-signal.";
  return hits
    .slice(0, 5)
    .map((a) => `${a.body1}-${a.body2} ${a.aspect} (orb ${a.orb.toFixed(1)}°, ${a.nature})`)
    .join("; ");
}

export function buildCategoryContext(allHits: AspectHit[], category: SynastryCategory) {
  const hits = aspectsForCategory(allHits, category);
  return {
    summary: describeCategoryAspects(hits),
    baselineStars: starsFromAspects(hits),
  };
}

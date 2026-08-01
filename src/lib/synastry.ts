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

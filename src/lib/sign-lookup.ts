import { SIGN_CONTENT, type SignContent } from "@/lib/zodiac-content";

/** Tropical Sun-sign date ranges, keyed by slug. [startMonth, startDay] (1-indexed month). */
export const SIGN_RANGES: Record<string, { start: [number, number]; end: [number, number] }> = {
  aries: { start: [3, 21], end: [4, 19] },
  taurus: { start: [4, 20], end: [5, 20] },
  gemini: { start: [5, 21], end: [6, 20] },
  cancer: { start: [6, 21], end: [7, 22] },
  leo: { start: [7, 23], end: [8, 22] },
  virgo: { start: [8, 23], end: [9, 22] },
  libra: { start: [9, 23], end: [10, 22] },
  scorpio: { start: [10, 23], end: [11, 21] },
  sagittarius: { start: [11, 22], end: [12, 21] },
  capricorn: { start: [12, 22], end: [1, 19] },
  aquarius: { start: [1, 20], end: [2, 18] },
  pisces: { start: [2, 19], end: [3, 20] },
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function daysInMonth(month: number): number {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

/** Returns the Sun sign for a month/day (1-indexed month). */
export function signForDate(month: number, day: number): SignContent | undefined {
  const slug = Object.keys(SIGN_RANGES).find((key) => {
    const { start, end } = SIGN_RANGES[key];
    if (start[0] === end[0]) return month === start[0] && day >= start[1] && day <= end[1];
    // normal case: range spans two consecutive months
    if (month === start[0]) return day >= start[1];
    if (month === end[0]) return day <= end[1];
    return false;
  });
  return slug ? SIGN_CONTENT.find((s) => s.slug === slug) : undefined;
}

export function neighbors(slug: string): { previous: SignContent; next: SignContent } {
  const order = Object.keys(SIGN_RANGES);
  const i = order.indexOf(slug);
  const prevSlug = order[(i - 1 + order.length) % order.length];
  const nextSlug = order[(i + 1) % order.length];
  return {
    previous: SIGN_CONTENT.find((s) => s.slug === prevSlug)!,
    next: SIGN_CONTENT.find((s) => s.slug === nextSlug)!,
  };
}

export function formatDay(month: number, day: number) {
  return `${MONTHS[month - 1]} ${day}`;
}

/** Element-based traditional compatibility, computed rather than authored. */
export function elementMatches(sign: SignContent): SignContent[] {
  const compatible: Record<SignContent["element"], SignContent["element"][]> = {
    Fire: ["Fire", "Air"],
    Air: ["Air", "Fire"],
    Earth: ["Earth", "Water"],
    Water: ["Water", "Earth"],
  };
  const allowed = compatible[sign.element];
  return SIGN_CONTENT.filter((s) => s.slug !== sign.slug && allowed.includes(s.element));
}

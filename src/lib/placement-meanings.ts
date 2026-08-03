// Human-readable meaning for each planet + sign combination, composed from a
// planet's domain and a sign's temperament. Deterministic (no AI cost, no
// latency) and consistent with the placements shown in the chart table.

interface PlanetMeaning {
  significance: string; // 2-3 words
  domain: string; // "the way you take up space in a room"
  best: string;
  strain: string;
}

export const PLANET_MEANINGS: Record<string, PlanetMeaning> = {
  Sun: {
    significance: "Ego & identity",
    domain: "the core of who you are and what you're quietly trying to become",
    best: "you lead with a sense of self that doesn't need permission",
    strain: "the same self-definition hardens into something you have to defend",
  },
  Moon: {
    significance: "Emotion & instinct",
    domain: "your inner weather — how you feel things before you've explained them",
    best: "you can name what you need and let people meet you there",
    strain: "your needs go underground and resurface as mood",
  },
  Mercury: {
    significance: "Mind & communication",
    domain: "how you think, gather information, and put it into words",
    best: "your thinking is quick, honest, and genuinely useful to others",
    strain: "the mind outruns the moment and turns conversation into strategy",
  },
  Venus: {
    significance: "Love & values",
    domain: "what you find beautiful, what you want from closeness, and how you show affection",
    best: "you give warmth freely and know what you're worth",
    strain: "you overgive, or wait to be chosen rather than choosing",
  },
  Mars: {
    significance: "Drive & desire",
    domain: "how you pursue what you want, and what your anger looks like",
    best: "your effort is direct and lands where you aim it",
    strain: "the drive scatters, or turns inward as frustration",
  },
  Jupiter: {
    significance: "Growth & belief",
    domain: "where life tends to open up for you and what you place your faith in",
    best: "you take generous risks and they tend to pay you back",
    strain: "optimism outpaces the plan and promises get expensive",
  },
  Saturn: {
    significance: "Structure & limits",
    domain: "the area of life that asks for patience before it gives anything back",
    best: "you build something slow that genuinely holds",
    strain: "the inner critic mistakes fear for discipline",
  },
  Uranus: {
    significance: "Change & rebellion",
    domain: "where you break your own patterns and refuse an inherited script",
    best: "you make room for a version of your life nobody handed you",
    strain: "disruption becomes reflex, and you leave before it's time",
  },
  Neptune: {
    significance: "Dreams & intuition",
    domain: "your imagination, your compassion, and the places you'd rather not look at directly",
    best: "you sense what's unsaid and turn it into art, empathy, or faith",
    strain: "the story you tell about a person or a plan replaces the fact of it",
  },
  Pluto: {
    significance: "Power & transformation",
    domain: "what you're built to outgrow — the part of life that keeps rebuilding you",
    best: "you survive the rebuild and come back with something unshakeable",
    strain: "control becomes the substitute for trust",
  },
  Rising: {
    significance: "Persona & first impression",
    domain: "the doorway people walk through to reach you — your instinctive first move",
    best: "the way you come across matches who you actually are",
    strain: "the mask gets convincing enough that even you believe it",
  },
  Midheaven: {
    significance: "Vocation & reputation",
    domain: "the direction of your public life and what people credit you with",
    best: "your work looks like you, not like an imitation of someone else's path",
    strain: "you chase recognition down a road you never chose",
  },
};

interface SignMeaning {
  tone: string; // "warm, proud and theatrical"
  approach: string; // "wants to be witnessed"
  element: string;
}

export const SIGN_MEANINGS: Record<string, SignMeaning> = {
  Aries: { tone: "direct, impatient and courageous", approach: "moves first and thinks on the way", element: "fire" },
  Taurus: { tone: "steady, sensual and stubborn", approach: "builds slowly and refuses to be rushed", element: "earth" },
  Gemini: { tone: "curious, quick and restless", approach: "circles a thing from every angle before settling", element: "air" },
  Cancer: { tone: "protective, tidal and deeply loyal", approach: "leads with care and remembers everything", element: "water" },
  Leo: { tone: "warm, proud and theatrical", approach: "wants to be seen clearly and loved out loud", element: "fire" },
  Virgo: { tone: "precise, useful and quietly anxious", approach: "improves what's in front of it rather than announcing it", element: "earth" },
  Libra: { tone: "gracious, weighing and relational", approach: "measures itself against other people", element: "air" },
  Scorpio: { tone: "intense, private and all-or-nothing", approach: "goes to the bottom of a thing or leaves it alone", element: "water" },
  Sagittarius: { tone: "expansive, blunt and hungry for meaning", approach: "keeps the horizon further out than the present", element: "fire" },
  Capricorn: { tone: "disciplined, self-contained and long-sighted", approach: "trades comfort now for standing later", element: "earth" },
  Aquarius: { tone: "detached, principled and contrarian", approach: "steps back far enough to see the system", element: "air" },
  Pisces: { tone: "porous, imaginative and forgiving", approach: "dissolves the line between itself and everything else", element: "water" },
};

export interface PlacementInsight {
  body: string;
  sign: string;
  house: number | null;
  significance: string;
  text: string;
}

export function placementInsight(body: string, sign: string, house: number | null): PlacementInsight | null {
  const planet = PLANET_MEANINGS[body];
  const s = SIGN_MEANINGS[sign];
  if (!planet || !s) return null;

  const subject = body === "Rising" ? "Your rising sign" : body === "Midheaven" ? "Your Midheaven" : `Your ${body}`;
  const houseLine = house
    ? ` It sits in your ${ordinal(house)} house, so this plays out most visibly in that corner of your life.`
    : "";

  const text =
    `${subject} governs ${planet.domain}. In ${sign} it runs ${s.tone} — a ${s.element} signature that ${s.approach}.` +
    houseLine +
    ` At its best, ${planet.best}. Under pressure, ${planet.strain}.`;

  return { body, sign, house, significance: planet.significance, text };
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

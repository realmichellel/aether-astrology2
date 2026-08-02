export interface SignContent {
  slug: string;
  name: string;
  symbol: string;
  dates: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  modality: "Cardinal" | "Fixed" | "Mutable";
  ruler: string;
  tagline: string;
  intro: string;
  strengths: string[];
  challenges: string[];
  inLove: string;
  atWork: string;
}

export const SIGN_CONTENT: SignContent[] = [
  {
    slug: "aries",
    name: "Aries",
    symbol: "♈",
    dates: "March 21 – April 19",
    element: "Fire",
    modality: "Cardinal",
    ruler: "Mars",
    tagline: "The first spark.",
    intro:
      "Aries is the opening degree of the zodiac — the impulse before the plan. Ruled by Mars and cardinal by modality, Aries energy initiates: it starts the conversation, takes the first step, says the thing everyone else is circling. People with strong Aries placements tend to think by moving, and to trust the version of an idea that arrives fastest.",
    strengths: ["Decisive under pressure", "Physically courageous", "Direct, unlayered honesty", "Starts things others only discuss"],
    challenges: ["Impatience with slow processes", "Heat that arrives before context", "Losing interest after the beginning"],
    inLove:
      "Aries pursues plainly and dislikes strategy in romance. The relationships that last are the ones where directness is met with directness rather than managed.",
    atWork:
      "Aries does its best work at the front of a project — launches, pitches, crises. Long maintenance phases drain it; pairing with a fixed sign usually solves that.",
  },
  {
    slug: "taurus",
    name: "Taurus",
    symbol: "♉",
    dates: "April 20 – May 20",
    element: "Earth",
    modality: "Fixed",
    ruler: "Venus",
    tagline: "The slow yes.",
    intro:
      "Taurus is Venus grounded in earth: pleasure made durable. Fixed by modality, Taurus builds slowly and rarely reverses a decision once it's settled. Strong Taurus placements tend toward a steady body clock, a strong aesthetic sense, and a deep suspicion of anything that asks them to hurry.",
    strengths: ["Extraordinary follow-through", "Calm in other people's chaos", "Sensory intelligence — taste, touch, sound", "Loyal past convenience"],
    challenges: ["Digs in when change is warranted", "Comfort mistaken for contentment", "Slow to voice a grievance, then absolute about it"],
    inLove:
      "Taurus loves through consistency: the same coffee, the same seat, the same person. It reads reliability as romance and unpredictability as risk.",
    atWork:
      "Taurus is the sign that finishes. It's least effective when asked to pivot weekly and most effective owning something that compounds over years.",
  },
  {
    slug: "gemini",
    name: "Gemini",
    symbol: "♊",
    dates: "May 21 – June 20",
    element: "Air",
    modality: "Mutable",
    ruler: "Mercury",
    tagline: "Two of everything.",
    intro:
      "Gemini is Mercury in air — thought as motion. Mutable and dual, Gemini holds contradictory positions comfortably and finds a single fixed identity slightly suffocating. Strong Gemini placements read quickly, talk to strangers easily, and metabolize information as a form of nourishment.",
    strengths: ["Fast, flexible intelligence", "Talks to anyone", "Sees the counterargument instantly", "Genuinely curious rather than performatively so"],
    challenges: ["Scattered attention across too many threads", "Talking past the feeling", "Restlessness read as inconstancy"],
    inLove:
      "Gemini falls for a mind first. Long silences read as distance; a partner who keeps talking keeps Gemini present.",
    atWork:
      "Gemini excels where variety is the job — writing, sales, teaching, anything requiring rapid translation between audiences.",
  },
  {
    slug: "cancer",
    name: "Cancer",
    symbol: "♋",
    dates: "June 21 – July 22",
    element: "Water",
    modality: "Cardinal",
    ruler: "The Moon",
    tagline: "Memory with a shell.",
    intro:
      "Cancer is the Moon's own sign: tidal, protective, and long-memoried. Cardinal water initiates through care — Cancer is the one who notices what's missing in a room and quietly supplies it. Strong Cancer placements feel weather changes in a relationship days before anyone names them.",
    strengths: ["Emotional accuracy", "Fierce protection of chosen people", "Builds homes anywhere", "Remembers what mattered"],
    challenges: ["Withdrawing instead of stating a need", "Holding an old injury past its usefulness", "Caretaking as a way of avoiding being cared for"],
    inLove:
      "Cancer commits early and privately. It needs to be chosen out loud; assumed security is not the same as expressed security.",
    atWork:
      "Cancer builds team cohesion others don't notice until it's gone. It struggles most in environments that treat feeling as noise.",
  },
  {
    slug: "leo",
    name: "Leo",
    symbol: "♌",
    dates: "July 23 – August 22",
    element: "Fire",
    modality: "Fixed",
    ruler: "The Sun",
    tagline: "Warmth as a discipline.",
    intro:
      "Leo is the Sun's sign — not vanity but radiance, the steady output of heat. Fixed fire sustains rather than ignites. Strong Leo placements are generous by default, allergic to smallness, and unusually loyal to the people who witnessed them before they were impressive.",
    strengths: ["Generous with attention and credit", "Steady creative output", "Natural at leading a room", "Encourages other people upward"],
    challenges: ["Pride that blocks a correction", "Needing recognition to feel real", "Dramatizing a small slight"],
    inLove:
      "Leo loves out loud and expects the same. Understated affection is often received as absence of affection.",
    atWork:
      "Leo does its best work when its name is on it. Anonymous grinding tends to dim it; visible ownership tends to double its output.",
  },
  {
    slug: "virgo",
    name: "Virgo",
    symbol: "♍",
    dates: "August 23 – September 22",
    element: "Earth",
    modality: "Mutable",
    ruler: "Mercury",
    tagline: "Care in the details.",
    intro:
      "Virgo is Mercury in earth: analysis in service of something working. Mutable and precise, Virgo improves what already exists rather than inventing from nothing. Strong Virgo placements notice the one wrong detail immediately — a gift and a burden in equal measure.",
    strengths: ["Precision without fuss", "Practical, useful help", "Systems thinking", "Quietly reliable"],
    challenges: ["Self-criticism disguised as standards", "Fixing people who didn't ask", "Anxiety when nothing is controllable"],
    inLove:
      "Virgo loves through service — the fixed thing, the remembered detail, the logistics handled. It rarely announces the effort.",
    atWork:
      "Virgo is the quality layer of any team. It suffers where vagueness is a culture and thrives where craft is measurable.",
  },
  {
    slug: "libra",
    name: "Libra",
    symbol: "♎",
    dates: "September 23 – October 22",
    element: "Air",
    modality: "Cardinal",
    ruler: "Venus",
    tagline: "Weight on both sides.",
    intro:
      "Libra is Venus in air: relation as an art form. Cardinal by modality, Libra initiates through connection — the introduction, the truce, the balanced proposal. Strong Libra placements are physically uncomfortable in unresolved tension and will work hard to metabolize it.",
    strengths: ["Reads a room instantly", "Genuine fairness", "Diplomatic without dishonesty", "Aesthetic clarity"],
    challenges: ["Deciding late to keep options open", "Peacekeeping at the cost of self-honesty", "Defining itself through a partner"],
    inLove:
      "Libra is at its best in partnership and at its worst when partnership becomes identity. It needs a relationship with room in it.",
    atWork:
      "Libra excels at negotiation, design, and any role that requires holding several stakeholders in view at once.",
  },
  {
    slug: "scorpio",
    name: "Scorpio",
    symbol: "♏",
    dates: "October 23 – November 21",
    element: "Water",
    modality: "Fixed",
    ruler: "Mars and Pluto",
    tagline: "All the way down.",
    intro:
      "Scorpio is fixed water — feeling with pressure behind it. Traditionally ruled by Mars, modernly by Pluto, Scorpio is drawn to what's hidden: the subtext, the motive, the thing under the thing. Strong Scorpio placements are rarely casual about anything they've decided to care about.",
    strengths: ["Perceptive past the surface", "Unshakeable once committed", "Comfortable with other people's darkness", "Capable of total reinvention"],
    challenges: ["Control as a substitute for trust", "Silence used as force", "Cutting off rather than repairing"],
    inLove:
      "Scorpio wants depth or nothing. Half-intimacy reads as insult; full disclosure, offered freely, disarms it completely.",
    atWork:
      "Scorpio is unmatched at research, strategy, and crisis work — anywhere the real problem is not the stated one.",
  },
  {
    slug: "sagittarius",
    name: "Sagittarius",
    symbol: "♐",
    dates: "November 22 – December 21",
    element: "Fire",
    modality: "Mutable",
    ruler: "Jupiter",
    tagline: "The longer view.",
    intro:
      "Sagittarius is Jupiter in fire: meaning-seeking, expansive, allergic to small rooms. Mutable fire moves — geographically, intellectually, philosophically. Strong Sagittarius placements need a horizon; without one, they manufacture restlessness.",
    strengths: ["Optimism with stamina", "Tells the truth even when costly", "Learns constantly", "Makes other people braver"],
    challenges: ["Bluntness without timing", "Promising more than the calendar allows", "Leaving before the difficult middle"],
    inLove:
      "Sagittarius stays where it isn't fenced. Freedom offered voluntarily produces more loyalty than any constraint.",
    atWork:
      "Sagittarius is a natural at teaching, strategy, and growth roles — anything where the question is where this could go.",
  },
  {
    slug: "capricorn",
    name: "Capricorn",
    symbol: "♑",
    dates: "December 22 – January 19",
    element: "Earth",
    modality: "Cardinal",
    ruler: "Saturn",
    tagline: "Time as an ally.",
    intro:
      "Capricorn is Saturn in earth: structure, patience, and the long climb. Cardinal earth initiates by building. Strong Capricorn placements are often described as older when young and lighter as they age — Saturn's arc rewards the ones who kept going.",
    strengths: ["Extraordinary discipline", "Realistic about cost and time", "Dry, precise humor", "Carries responsibility without announcing it"],
    challenges: ["Self-worth tied to output", "Emotional reserve read as coldness", "Delaying rest until it's forced"],
    inLove:
      "Capricorn shows love through commitment and provision. It rarely says it and almost always means it.",
    atWork:
      "Capricorn is the sign of institutions — it builds things that outlast the enthusiasm that started them.",
  },
  {
    slug: "aquarius",
    name: "Aquarius",
    symbol: "♒",
    dates: "January 20 – February 18",
    element: "Air",
    modality: "Fixed",
    ruler: "Saturn and Uranus",
    tagline: "A step outside.",
    intro:
      "Aquarius is fixed air: a settled position held at a distance. Traditionally Saturn-ruled, modernly Uranian, Aquarius combines structural thinking with a refusal to inherit assumptions. Strong Aquarius placements are principled, group-oriented, and quietly immovable.",
    strengths: ["Original thinking", "Loyal to ideas and to people", "Unbothered by consensus", "Sees the system, not just the incident"],
    challenges: ["Detachment during emotional moments", "Contrarianism as reflex", "Abstract when specificity is needed"],
    inLove:
      "Aquarius bonds through friendship first. It needs a partner who reads independence as respect rather than distance.",
    atWork:
      "Aquarius belongs where the model needs rethinking — research, technology, organizing, anything with a stale default.",
  },
  {
    slug: "pisces",
    name: "Pisces",
    symbol: "♓",
    dates: "February 19 – March 20",
    element: "Water",
    modality: "Mutable",
    ruler: "Jupiter and Neptune",
    tagline: "No hard edges.",
    intro:
      "Pisces is the last sign — mutable water, where the boundaries between selves thin out. Jupiter-ruled traditionally and Neptunian modernly, Pisces perceives atmospherically rather than analytically. Strong Pisces placements absorb the mood of a room and often mistake it for their own.",
    strengths: ["Deep empathy", "Creative and image-rich thinking", "Forgiving without keeping score", "Comfortable with ambiguity"],
    challenges: ["Porous boundaries", "Escaping rather than confronting", "Idealizing people past the evidence"],
    inLove:
      "Pisces loves completely and can lose its outline doing it. The healthiest version keeps one thing that belongs only to itself.",
    atWork:
      "Pisces thrives in creative, therapeutic, and imaginative work, and struggles most under rigid metrics.",
  },
];

export function signBySlug(slug: string): SignContent | undefined {
  return SIGN_CONTENT.find((s) => s.slug === slug);
}

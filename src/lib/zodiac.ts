// src/lib/zodiac.ts
//
// Maps an ecliptic longitude (0-360°, tropical zodiac, 0° = Aries point) to a
// zodiac sign. This is separate from astrology.ts's `sunSignFor`, which maps
// a *calendar date* to a sign via a fixed date-range table — that's fine for
// the Sun (whose longitude tracks the calendar almost exactly) but every
// other body needs its actual computed longitude.
import { ZODIAC } from "./astrology";

const SIGNS_BY_LONGITUDE = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export interface SignPlacement {
  name: string;
  symbol: string;
  degreeInSign: number; // 0-30
  longitude: number; // normalized 0-360
}

export function signFromEclipticLongitude(longitudeDeg: number): SignPlacement {
  const lon = ((longitudeDeg % 360) + 360) % 360;
  const index = Math.floor(lon / 30);
  const name = SIGNS_BY_LONGITUDE[index];
  const symbol = ZODIAC.find((z) => z.name === name)?.symbol ?? "";
  return { name, symbol, degreeInSign: lon - index * 30, longitude: lon };
}
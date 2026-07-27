// src/lib/birth-chart.ts
//
// Requires: npm install astronomy-engine
//
// Computes geocentric ecliptic (tropical) positions for the Sun through
// Pluto, plus the Ascendant, Midheaven, and Whole-Sign houses.
//
// House system note: Whole Sign houses (house 1 = the ascendant's entire
// sign, then one house per subsequent sign) is the oldest and simplest house
// system and a defensible default. If you want Placidus, Koch, Equal, etc.
// instead, only the `houses` block below needs to change — Placidus in
// particular requires iteratively solving for cusps and is a fair bit more
// code; happy to add it if you want it.
import * as Astronomy from "astronomy-engine";
import { signFromEclipticLongitude, type SignPlacement } from "./zodiac";

export interface PlanetPlacement extends SignPlacement {
  body: string;
}

export interface BirthChart {
  ascendant: SignPlacement | null; // null if birth time unknown
  midheaven: SignPlacement | null;
  planets: PlanetPlacement[];
  houses: { house: number; sign: string; cuspLongitude: number }[] | null;
}

export interface BirthChartInput {
  utcDate: Date;
  latitude: number;
  longitude: number;
  /** Set false if birth time is unknown — ascendant/MC/houses are skipped
   *  rather than computed from a guessed time, since they're wrong roughly
   *  as often as they'd be right. */
  timeIsKnown: boolean;
}

const PLANET_BODIES: Array<[string, Astronomy.Body]> = [
  ["Sun", Astronomy.Body.Sun],
  ["Moon", Astronomy.Body.Moon],
  ["Mercury", Astronomy.Body.Mercury],
  ["Venus", Astronomy.Body.Venus],
  ["Mars", Astronomy.Body.Mars],
  ["Jupiter", Astronomy.Body.Jupiter],
  ["Saturn", Astronomy.Body.Saturn],
  ["Uranus", Astronomy.Body.Uranus],
  ["Neptune", Astronomy.Body.Neptune],
  ["Pluto", Astronomy.Body.Pluto],
];

// Mean obliquity of the ecliptic (Meeus 22.2). Accurate to a fraction of an
// arcsecond within a few centuries of J2000 — irrelevant at the sign level.
function meanObliquityDeg(time: Astronomy.AstroTime): number {
  const T = time.tt / 36525; // Julian centuries since J2000.0
  return 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

/**
 * Ascendant + Midheaven ecliptic longitudes from Local Sidereal Time,
 * geographic latitude, and the ecliptic's obliquity (standard formulas — see
 * e.g. Meeus, or astro.com's documentation of the same). `longitudeDeg` is
 * the birth place's longitude, east-positive.
 */
function ascendantMidheaven(time: Astronomy.AstroTime, latitudeDeg: number, longitudeDeg: number) {
  const gstHours = Astronomy.SiderealTime(time); // Greenwich sidereal time, in hours
  const lstHours = (((gstHours + longitudeDeg / 15) % 24) + 24) % 24;
  const ramc = lstHours * 15; // Right ascension of the Midheaven, in degrees

  const eps = meanObliquityDeg(time);
  const ramcR = toRad(ramc);
  const epsR = toRad(eps);
  const latR = toRad(latitudeDeg);

  const midheavenLongitude =
    (toDeg(Math.atan2(Math.sin(ramcR), Math.cos(ramcR) * Math.cos(epsR))) + 360) % 360;

  const ascY = Math.cos(ramcR);
  const ascX = -(Math.sin(epsR) * Math.tan(latR) + Math.cos(epsR) * Math.sin(ramcR));
  const ascendantLongitude = (toDeg(Math.atan2(ascY, ascX)) + 360) % 360;

  return { ascendantLongitude, midheavenLongitude };
}

export function computeBirthChart({
  utcDate,
  latitude,
  longitude,
  timeIsKnown,
}: BirthChartInput): BirthChart {
  const time = Astronomy.MakeTime(utcDate);

  const planets: PlanetPlacement[] = PLANET_BODIES.map(([body, astroBody]) => {
    const vector = Astronomy.GeoVector(astroBody, time, true);
    const ecliptic = Astronomy.Ecliptic(vector);
    return { body, ...signFromEclipticLongitude(ecliptic.elon) };
  });

  if (!timeIsKnown) {
    return { ascendant: null, midheaven: null, planets, houses: null };
  }

  const { ascendantLongitude, midheavenLongitude } = ascendantMidheaven(time, latitude, longitude);
  const ascendant = signFromEclipticLongitude(ascendantLongitude);
  const midheaven = signFromEclipticLongitude(midheavenLongitude);

  const ascSignIndex = Math.floor(ascendantLongitude / 30);
  const houses = Array.from({ length: 12 }, (_, i) => {
    const signIndex = (ascSignIndex + i) % 12;
    const cuspLongitude = signIndex * 30;
    return { house: i + 1, cuspLongitude, sign: signFromEclipticLongitude(cuspLongitude).name };
  });

  return { ascendant, midheaven, planets, houses };
}
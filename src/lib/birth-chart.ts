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
  house?: number | null;
}

export interface BirthChart {
  ascendant: (SignPlacement & { house?: number }) | null; // null if birth time unknown
  midheaven: (SignPlacement & { house?: number }) | null;
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

  return { ascendantLongitude, midheavenLongitude, ramc };
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

  const { ascendantLongitude, midheavenLongitude, ramc } = ascendantMidheaven(
    time,
    latitude,
    longitude,
  );
  const eps = meanObliquityDeg(time);

  const cusps = placidusCusps(ramc, eps, latitude, ascendantLongitude, midheavenLongitude);

  const houses = cusps.map((cuspLongitude, i) => ({
    house: i + 1,
    cuspLongitude,
    sign: signFromEclipticLongitude(cuspLongitude).name,
  }));

  const ascendant = { ...signFromEclipticLongitude(ascendantLongitude), house: 1 };
  const midheaven = { ...signFromEclipticLongitude(midheavenLongitude), house: 10 };

  for (const p of planets) {
    p.house = houseForLongitude(p.longitude, cusps);
  }

  return { ascendant, midheaven, planets, houses };
}

/** Which house a given ecliptic longitude falls in, given 12 ordered cusps. */
function houseForLongitude(longitude: number, cusps: number[]): number {
  const lon = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = (((end - start) % 360) + 360) % 360;
    const offset = (((lon - start) % 360) + 360) % 360;
    if (offset < span) return i + 1;
  }
  return 1;
}

/**
 * Placidus house cusps.
 *
 * Placidus divides each body's diurnal and nocturnal semi-arcs into three
 * equal parts in *time*, rather than dividing the ecliptic or the equator in
 * space. Cusps 10 (MC) and 1 (Asc) are exact; 11, 12, 2, 3 are found by
 * iterating on the ascensional difference until the hour angle of the
 * candidate ecliptic point matches the required fraction of its own semi-arc.
 * The remaining six cusps are the exact oppositions.
 *
 * Placidus is undefined inside the polar circles (a point can have no rising
 * time at all); there we fall back to whole-sign cusps from the ascendant so
 * the chart still renders rather than producing NaNs.
 */
function placidusCusps(
  ramc: number,
  epsDeg: number,
  latDeg: number,
  ascLongitude: number,
  mcLongitude: number,
): number[] {
  const epsR = toRad(epsDeg);
  const latR = toRad(latDeg);

  if (Math.abs(latDeg) >= 66) return wholeSignFallback(ascLongitude);

  // Ecliptic longitude of the point on the ecliptic with the given right ascension.
  const lonFromRA = (raDeg: number) => {
    const raR = toRad(raDeg);
    return (toDeg(Math.atan2(Math.sin(raR), Math.cos(raR) * Math.cos(epsR))) + 360) % 360;
  };

  // offsetDeg: base RA offset from RAMC; adFactor: multiple of the ascensional
  // difference to add (derived from the semi-arc thirds).
  const solve = (offsetDeg: number, adFactor: number): number | null => {
    let ra = ramc + offsetDeg;
    let lon = lonFromRA(ra);
    for (let i = 0; i < 30; i++) {
      const decl = Math.asin(Math.sin(epsR) * Math.sin(toRad(lon)));
      const t = Math.tan(latR) * Math.tan(decl);
      if (Math.abs(t) > 1) return null; // circumpolar — Placidus undefined here
      const ad = toDeg(Math.asin(t));
      const next = ramc + offsetDeg + adFactor * ad;
      const nextLon = lonFromRA(next);
      const converged = Math.abs(((nextLon - lon + 540) % 360) - 180) < 1e-9;
      ra = next;
      lon = nextLon;
      if (converged) break;
    }
    return lon;
  };

  const c11 = solve(30, 1 / 3);
  const c12 = solve(60, 2 / 3);
  const c2 = solve(120, 2 / 3);
  const c3 = solve(150, 1 / 3);

  if (c11 == null || c12 == null || c2 == null || c3 == null) {
    return wholeSignFallback(ascLongitude);
  }

  const norm = (d: number) => ((d % 360) + 360) % 360;
  return [
    norm(ascLongitude),
    norm(c2),
    norm(c3),
    norm(mcLongitude + 180),
    norm(c11 + 180),
    norm(c12 + 180),
    norm(ascLongitude + 180),
    norm(c2 + 180),
    norm(c3 + 180),
    norm(mcLongitude),
    norm(c11),
    norm(c12),
  ];
}

function wholeSignFallback(ascLongitude: number): number[] {
  const ascSignIndex = Math.floor((((ascLongitude % 360) + 360) % 360) / 30);
  return Array.from({ length: 12 }, (_, i) => ((ascSignIndex + i) % 12) * 30);
}
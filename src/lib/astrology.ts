export const ZODIAC = [
  { name: "Capricorn", symbol: "♑", from: [12, 22], to: [1, 19] },
  { name: "Aquarius", symbol: "♒", from: [1, 20], to: [2, 18] },
  { name: "Pisces", symbol: "♓", from: [2, 19], to: [3, 20] },
  { name: "Aries", symbol: "♈", from: [3, 21], to: [4, 19] },
  { name: "Taurus", symbol: "♉", from: [4, 20], to: [5, 20] },
  { name: "Gemini", symbol: "♊", from: [5, 21], to: [6, 20] },
  { name: "Cancer", symbol: "♋", from: [6, 21], to: [7, 22] },
  { name: "Leo", symbol: "♌", from: [7, 23], to: [8, 22] },
  { name: "Virgo", symbol: "♍", from: [8, 23], to: [9, 22] },
  { name: "Libra", symbol: "♎", from: [9, 23], to: [10, 22] },
  { name: "Scorpio", symbol: "♏", from: [10, 23], to: [11, 21] },
  { name: "Sagittarius", symbol: "♐", from: [11, 22], to: [12, 21] },
];

export function sunSignFor(birthDate: string): { name: string; symbol: string } {
  const [, m, d] = birthDate.split("-").map(Number);
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm === tm) {
      if (m === fm && d >= fd && d <= td) return { name: z.name, symbol: z.symbol };
    } else {
      if ((m === fm && d >= fd) || (m === tm && d <= td)) return { name: z.name, symbol: z.symbol };
    }
  }
  return { name: "Capricorn", symbol: "♑" };
}

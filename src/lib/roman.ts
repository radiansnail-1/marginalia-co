// Roman numeral util. toRoman(2026) === "MMXXVI".
const PAIRS: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  let num = Math.floor(n);
  let out = "";
  for (const [v, s] of PAIRS) {
    while (num >= v) {
      out += s;
      num -= v;
    }
  }
  return out;
}

export function timeOfDayCaveat(hour: number = new Date().getHours()): string {
  if (hour < 6) return "late, by lamplight.";
  if (hour < 12) return "early light.";
  if (hour < 17) return "afternoon hush.";
  if (hour < 21) return "a quiet evening.";
  return "late, by lamplight.";
}

// Hash a string to a stable palette index.
export function paletteIndex(seed: string, paletteSize: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % paletteSize;
}

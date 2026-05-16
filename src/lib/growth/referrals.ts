const CODE_MAX = 32;
const CODE_MIN = 4;

export function normalizeReferralCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, CODE_MAX)
    .replace(/^-+|-+$/g, "");
}

export function isValidReferralCode(input: string): boolean {
  const code = normalizeReferralCode(input);
  return code.length >= CODE_MIN && /^[A-Z0-9][A-Z0-9-]{3,31}$/.test(code);
}

export function referralCodeFromName(name: string | null | undefined, fallbackId: string): string {
  const base = normalizeReferralCode(name || "READER").split("-")[0] || "READER";
  const suffix = normalizeReferralCode(fallbackId.replaceAll("-", "")).slice(0, 5) || "ROOM";
  return normalizeReferralCode(`${base}-${suffix}`);
}

export function referralShareText(code: string): string {
  const safeCode = normalizeReferralCode(code);
  return `I made a tiny reading room in Marginalia & Co. Use code ${safeCode} and the Librarian will start your first shelf.`;
}

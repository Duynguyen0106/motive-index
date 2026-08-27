/** Canonical site URL for metadata, sitemap, and OG tags. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "Motive Index";

export const DEFAULT_DESCRIPTION =
  "Educational archive of historical crime cases with forensic psychological analysis—evidence, confidence, and explicit unknowns.";

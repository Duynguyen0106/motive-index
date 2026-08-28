/**
 * Detect homepage/section-root URLs that do not take users to case-specific content.
 */

const NEWS_HOME_DOMAINS = new Set([
  "nytimes.com",
  "www.nytimes.com",
  "kansas.com",
  "www.kansas.com",
  "jsonline.com",
  "www.jsonline.com",
  "latimes.com",
  "www.latimes.com",
  "sfchronicle.com",
  "www.sfchronicle.com",
  "bbc.co.uk",
  "www.bbc.co.uk",
  "derstandard.at",
  "www.derstandard.at",
  "bangkokpost.com",
  "www.bangkokpost.com",
  "kommersant.ru",
  "www.kommersant.ru",
  "ntv.ru",
  "www.ntv.ru",
  "xinhuanet.com",
  "www.xinhuanet.com",
  "spiegel.de",
  "www.spiegel.de",
  "lefigaro.fr",
  "www.lefigaro.fr",
  "thehindu.com",
  "www.thehindu.com",
  "newsweek.pl",
  "www.newsweek.pl",
  "dn.se",
  "www.dn.se",
  "asahi.com",
  "www.asahi.com",
  "repubblica.it",
  "www.repubblica.it",
  "elpais.com",
  "www.elpais.com",
  "ukrinform.ua",
  "www.ukrinform.ua",
  "ria.ru",
  "ria.ru",
  "kompas.com",
  "www.kompas.com",
  "globo.com",
  "g1.globo.com",
  "eltiempo.com",
  "www.eltiempo.com",
  "dawn.com",
  "www.dawn.com",
  "deccanherald.com",
  "www.deccanherald.com",
  "mainichi.jp",
  "www.mainichi.jp",
  "nrc.nl",
  "www.nrc.nl",
  "yna.co.kr",
  "www.yna.co.kr",
  "hs.fi",
  "www.hs.fi",
  "nrk.no",
  "www.nrk.no",
  "lalibre.be",
  "www.lalibre.be",
  "adevarul.ro",
  "www.adevarul.ro",
  "hurriyet.com.tr",
  "www.hurriyet.com.tr",
  "sme.sk",
  "www.sme.sk",
  "blic.rs",
  "www.blic.rs",
  "idnes.cz",
  "www.idnes.cz",
  "prothomalo.com",
  "www.prothomalo.com",
  "hamshahrionline.ir",
  "www.hamshahrionline.ir",
  "dantri.com.vn",
  "dantri.com.vn",
  "tovima.gr",
  "www.tovima.gr",
  "haaretz.co.il",
  "www.haaretz.co.il",
]);

/** Section landing pages that are not case-specific. */
const GENERIC_SECTION_SEGMENTS = new Set([
  "history",
  "news",
  "world",
  "sport",
  "archive",
  "learn",
  "about",
  "search",
]);

function hostnameMatchesNewsHome(hostname: string): boolean {
  return NEWS_HOME_DOMAINS.has(hostname) || NEWS_HOME_DOMAINS.has(hostname.replace(/^www\./, "www."));
}

/** True when the URL is a site/section root, not a document about a specific case. */
export function isHomepageOnlyUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url.trim());
    const path = u.pathname.replace(/\/$/, "");
    const segs = path.split("/").filter(Boolean);

    if (segs.length === 0) return true;

    if (u.hostname.includes("vault.fbi.gov")) return false;
    if (u.hostname.includes("fbi.gov")) return segs.length <= 1 && !u.search;
    if (u.hostname.includes("wikipedia.org")) return false;
    if (u.hostname.includes("nationalarchives.gov.uk")) return false;
    if (u.hostname.endsWith(".gov") && segs.length >= 2) return false;

    if (segs.length === 1 && GENERIC_SECTION_SEGMENTS.has(segs[0]!.toLowerCase())) {
      return true;
    }

    if (hostnameMatchesNewsHome(u.hostname) && segs.length <= 1 && !u.search) {
      return true;
    }

    if (
      u.hostname.includes("oklahomacitynationalmemorial.org") &&
      segs.length <= 1 &&
      !u.search
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

/** Verified cases need at least one primary ref with a direct, non-homepage URL. */
export function isDirectSourceUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  return !isHomepageOnlyUrl(url);
}

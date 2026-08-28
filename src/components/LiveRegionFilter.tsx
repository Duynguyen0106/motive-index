"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { COUNTRY_LABELS, type CountryCode } from "@/lib/country";
import { parseNewsFilter } from "@/lib/newsFeedUtils";

type Props = {
  country: CountryCode | "";
  countryOptions: CountryCode[];
};

function liveUrl(country: string, newsFilter: string): string {
  const p = new URLSearchParams();
  if (country) p.set("country", country);
  if (newsFilter && newsFilter !== "all") p.set("newsFilter", newsFilter);
  const qs = p.toString();
  return qs ? `/live?${qs}` : "/live";
}

export function LiveRegionFilter({ country, countryOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newsFilter = parseNewsFilter(searchParams.get("newsFilter"));

  return (
    <div className="live-region-filter flex flex-wrap items-center gap-2 text-sm">
      <label className="flex min-h-[44px] flex-1 items-center gap-2 sm:flex-none">
        <span className="text-[var(--muted)]">Region</span>
        <select
          name="country"
          defaultValue={country}
          className="field min-h-[44px] flex-1 py-2 text-sm sm:min-w-[12rem]"
          onChange={(e) => {
            const value = e.target.value;
            router.push(liveUrl(value, newsFilter));
          }}
        >
          <option value="">All regions</option>
          {countryOptions.map((code) => (
            <option key={code} value={code}>
              {COUNTRY_LABELS[code]}
            </option>
          ))}
        </select>
      </label>
      {country ? (
        <Link
          href={liveUrl("", newsFilter)}
          className="text-link min-h-[44px] inline-flex items-center text-xs"
        >
          Clear filter
        </Link>
      ) : null}
    </div>
  );
}

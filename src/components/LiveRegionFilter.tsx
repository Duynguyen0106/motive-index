"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { COUNTRY_LABELS, type CountryCode } from "@/lib/country";

type Props = {
  country: CountryCode | "";
  countryOptions: CountryCode[];
};

export function LiveRegionFilter({ country, countryOptions }: Props) {
  const router = useRouter();

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
            router.push(value ? `/live?country=${value}` : "/live");
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
        <Link href="/live" className="text-link min-h-[44px] inline-flex items-center text-xs">
          Clear filter
        </Link>
      ) : null}
    </div>
  );
}

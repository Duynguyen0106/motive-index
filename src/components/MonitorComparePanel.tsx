"use client";

import Link from "next/link";
import { COUNTRY_LABELS } from "@/lib/country";
import type { MonitorCasePin } from "@/lib/geo";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

type Props = {
  pinA: MonitorCasePin;
  pinB: MonitorCasePin;
  onClose: () => void;
};

function CompareColumn({ pin, label }: { pin: MonitorCasePin; label: string }) {
  const tierLabel =
    pin.provenanceTier === "verified"
      ? "Verified"
      : pin.provenanceTier === "curated"
        ? "Curated"
        : pin.provenanceTier === "composite"
          ? "Teaching"
          : "Draft";

  return (
    <div className="monitor-compare-col">
      <p className="label mb-1">{label}</p>
      <h3 className="display text-base leading-tight">{pin.name}</h3>
      <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">{pin.subtitle}</p>
      <dl className="monitor-compare-facts mt-3">
        <div>
          <dt>Years</dt>
          <dd>
            {pin.yearStart}
            {pin.yearEnd ? `–${pin.yearEnd}` : ""}
          </dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>{COUNTRY_LABELS[pin.country]}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{pin.status}</dd>
        </div>
        <div>
          <dt>Categories</dt>
          <dd>{pin.crimeCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(", ")}</dd>
        </div>
        <div>
          <dt>Provenance</dt>
          <dd>{tierLabel}</dd>
        </div>
        <div>
          <dt>Pin accuracy</dt>
          <dd>
            {pin.coordAccuracy === "city"
              ? "City-level"
              : pin.coordAccuracy === "centroid"
                ? "Country estimate"
                : "Regional"}
          </dd>
        </div>
      </dl>
      <Link href={`/cases/${pin.slug}`} className="btn btn-ghost mt-3 block text-center text-xs">
        Open dossier →
      </Link>
    </div>
  );
}

export function MonitorComparePanel({ pinA, pinB, onClose }: Props) {
  const sameCountry = pinA.country === pinB.country;
  const sharedCategories = pinA.crimeCategories.filter((c) => pinB.crimeCategories.includes(c));
  const yearGap = Math.abs(pinA.yearStart - pinB.yearStart);

  return (
    <div className="monitor-compare-panel" role="dialog" aria-label="Compare dossiers">
      <div className="monitor-compare-header">
        <h2 className="display text-base">Case comparison</h2>
        <button type="button" className="monitor-case-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="monitor-compare-summary text-xs text-[var(--muted)]">
        {sameCountry ? "Same region · " : ""}
        {sharedCategories.length
          ? `Shared: ${sharedCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(", ")} · `
          : ""}
        {yearGap} years apart
      </p>
      <div className="monitor-compare-grid">
        <CompareColumn pin={pinA} label="Primary selection" />
        <CompareColumn pin={pinB} label="Comparison" />
      </div>
    </div>
  );
}

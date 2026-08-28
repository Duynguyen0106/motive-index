"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRY_LABELS } from "@/lib/country";
import type { CountryCode } from "@/lib/types";

type Props = {
  value: CountryCode | "";
  options: CountryCode[];
  onChange: (code: CountryCode | "") => void;
  placeholder?: string;
};

export function MonitorCountryPicker({
  value,
  options,
  onChange,
  placeholder = "All countries",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (code) =>
        COUNTRY_LABELS[code].toLowerCase().includes(q) || code.toLowerCase().includes(q),
    );
  }, [options, query]);

  const label = value ? COUNTRY_LABELS[value] : placeholder;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(code: CountryCode | "") {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="monitor-country-picker">
      <button
        type="button"
        className="monitor-country-picker-trigger field"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{label}</span>
        <span className="monitor-country-picker-caret" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div className="monitor-country-picker-menu">
          <input
            className="field monitor-country-picker-search"
            placeholder="Search countries…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="monitor-country-picker-list" role="listbox">
            <li>
              <button
                type="button"
                className={!value ? "is-active" : ""}
                onClick={() => pick("")}
              >
                {placeholder}
              </button>
            </li>
            {filtered.slice(0, 40).map((code) => (
              <li key={code}>
                <button
                  type="button"
                  className={value === code ? "is-active" : ""}
                  onClick={() => pick(code)}
                >
                  {COUNTRY_LABELS[code]}
                </button>
              </li>
            ))}
            {filtered.length > 40 ? (
              <li className="monitor-country-picker-hint">Type to narrow results</li>
            ) : null}
            {!filtered.length ? (
              <li className="monitor-country-picker-hint">No matches</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

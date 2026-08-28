"use client";

import {
  NEWS_FILTER_LABELS,
  type NewsFeedFilter,
} from "@/lib/newsFeedUtils";

type Props = {
  filter: NewsFeedFilter;
  onFilterChange: (filter: NewsFeedFilter) => void;
  counts: Record<NewsFeedFilter, number>;
  className?: string;
};

export function NewsFeedFilterBar({
  filter,
  onFilterChange,
  counts,
  className = "",
}: Props) {
  return (
    <div
      className={`monitor-news-filters ${className}`.trim()}
      role="toolbar"
      aria-label="Filter news"
    >
      {(Object.keys(NEWS_FILTER_LABELS) as NewsFeedFilter[]).map((key) => {
        const count = counts[key];
        if (!count && filter !== key) return null;
        return (
          <button
            key={key}
            type="button"
            className={`monitor-news-filter ${filter === key ? "is-active" : ""} ${key === "hot" && count ? "has-hot" : ""}`}
            onClick={() => onFilterChange(key)}
          >
            {NEWS_FILTER_LABELS[key]}
            <span className="monitor-news-filter-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

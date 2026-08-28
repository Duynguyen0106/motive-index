"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  /** Query param keys that trigger scroll reset when changed */
  keys?: string[];
};

export function PaginationScrollReset({ keys = ["page", "docPage"] }: Props) {
  const searchParams = useSearchParams();
  const prevRef = useRef("");

  const signature = keys.map((k) => searchParams.get(k) ?? "").join("|");

  useEffect(() => {
    if (prevRef.current && prevRef.current !== signature) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevRef.current = signature;
  }, [signature]);

  return null;
}

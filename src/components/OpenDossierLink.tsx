"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

type Props = {
  slug: string;
  className?: string;
  children: ReactNode;
};

export function dossierHref(slug: string): string {
  return `/cases/${encodeURIComponent(slug)}`;
}

/** Reliable dossier navigation — avoids Leaflet / map overlays swallowing Next.js Link clicks. */
export function OpenDossierLink({ slug, className, children }: Props) {
  const router = useRouter();
  const href = dossierHref(slug);

  function openDossier(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    router.push(href);
  }

  function blockMapPointer(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
  }

  return (
    <button
      type="button"
      className={className}
      onClick={openDossier}
      onMouseDown={blockMapPointer}
      onPointerDown={blockMapPointer}
    >
      {children}
    </button>
  );
}

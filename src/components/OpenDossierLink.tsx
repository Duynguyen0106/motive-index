"use client";

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
  const href = dossierHref(slug);

  function openDossier(e: MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation();
    e.preventDefault();
    window.location.assign(href);
  }

  return (
    <a href={href} className={className} onClick={openDossier}>
      {children}
    </a>
  );
}

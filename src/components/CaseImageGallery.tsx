"use client";

import { CaseImagePanel } from "@/components/CaseImagePanel";
import type { CaseImage } from "@/lib/types";

type Props = {
  images: CaseImage[];
};

export function CaseImageGallery({ images }: Props) {
  if (!images.length) return null;

  return (
    <section className="card p-6 md:p-8" aria-label="Dossier photographs">
      <h2 className="display text-2xl">Photographs</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Attributed public-record images — courthouses, memorials, and historical context preferred.
        Mugshots require click-to-reveal.
      </p>
      <div className="case-image-gallery mt-5">
        {images.map((image) => (
          <CaseImagePanel key={image.id} image={image} variant="gallery" />
        ))}
      </div>
    </section>
  );
}

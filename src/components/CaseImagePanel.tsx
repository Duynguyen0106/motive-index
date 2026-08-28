"use client";

import Image from "next/image";
import { useState } from "react";
import type { CaseImage } from "@/lib/types";

const KIND_LABELS: Record<CaseImage["kind"], string> = {
  context: "Context",
  location: "Location",
  portrait: "Portrait",
};

type Props = {
  image: CaseImage;
  /** Compact layout for archive cards; full layout for dossier headers. */
  variant?: "hero" | "thumb";
  priority?: boolean;
};

export function CaseImagePanel({ image, variant = "hero", priority = false }: Props) {
  const [revealed, setRevealed] = useState(!image.sensitive);
  const isThumb = variant === "thumb";

  return (
    <figure
      className={isThumb ? "case-image case-image-thumb" : "case-image case-image-hero"}
      data-kind={image.kind}
    >
      <div className="case-image-frame">
        {image.sensitive && !revealed ? (
          <button
            type="button"
            className="case-image-reveal"
            onClick={() => setRevealed(true)}
            aria-label={`Reveal ${KIND_LABELS[image.kind].toLowerCase()} photograph`}
          >
            <span className="case-image-reveal-icon" aria-hidden>
              ◫
            </span>
            <span className="case-image-reveal-title">Sensitive photograph</span>
            <span className="case-image-reveal-copy">
              Click to reveal a public-record {KIND_LABELS[image.kind].toLowerCase()} image. No
              crime-scene or victim imagery.
            </span>
          </button>
        ) : (
          <Image
            src={image.url}
            alt={image.alt}
            width={isThumb ? 320 : 640}
            height={isThumb ? 200 : 400}
            className="case-image-photo"
            sizes={isThumb ? "160px" : "(min-width: 768px) 320px, 100vw"}
            priority={priority}
          />
        )}
      </div>
      <figcaption className="case-image-caption">
        <span className="case-image-kind">{KIND_LABELS[image.kind]}</span>
        <span className="case-image-text">{image.caption}</span>
        <span className="case-image-credit">
          {image.attribution}
          {image.license ? ` · ${image.license}` : ""} · {image.source}
        </span>
      </figcaption>
    </figure>
  );
}

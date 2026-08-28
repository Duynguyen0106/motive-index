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
  /** hero = dossier header; thumb = featured card; gallery = overview grid; index = archive row */
  variant?: "hero" | "thumb" | "gallery" | "index";
  priority?: boolean;
  /** Hide caption (archive index rows). */
  hideCaption?: boolean;
};

const VARIANT_CLASS: Record<NonNullable<Props["variant"]>, string> = {
  hero: "case-image case-image-hero",
  thumb: "case-image case-image-thumb",
  gallery: "case-image case-image-gallery-item",
  index: "case-image case-image-index",
};

const VARIANT_SIZE: Record<NonNullable<Props["variant"]>, { w: number; h: number; sizes: string }> = {
  hero: { w: 640, h: 400, sizes: "(min-width: 768px) 320px, 100vw" },
  thumb: { w: 320, h: 200, sizes: "160px" },
  gallery: { w: 480, h: 320, sizes: "(min-width: 768px) 280px, 100vw" },
  index: { w: 96, h: 64, sizes: "64px" },
};

export function CaseImagePanel({
  image,
  variant = "hero",
  priority = false,
  hideCaption = false,
}: Props) {
  const [revealed, setRevealed] = useState(!image.sensitive);
  const isIndex = variant === "index";
  const { w, h, sizes } = VARIANT_SIZE[variant];

  return (
    <figure className={VARIANT_CLASS[variant]} data-kind={image.kind}>
      <div className="case-image-frame">
        {image.sensitive && !revealed ? (
          <button
            type="button"
            className="case-image-reveal"
            onClick={() => setRevealed(true)}
            aria-label={`Reveal ${KIND_LABELS[image.kind].toLowerCase()} photograph`}
          >
            {!isIndex ? (
              <>
                <span className="case-image-reveal-icon" aria-hidden>
                  ◫
                </span>
                <span className="case-image-reveal-title">Sensitive photograph</span>
                <span className="case-image-reveal-copy">
                  Click to reveal a public-record {KIND_LABELS[image.kind].toLowerCase()} image. No
                  crime-scene or victim imagery.
                </span>
              </>
            ) : (
              <span className="case-image-reveal-mini" aria-hidden>
                ◫
              </span>
            )}
          </button>
        ) : (
          <Image
            src={image.url}
            alt={image.alt}
            width={w}
            height={h}
            className="case-image-photo"
            sizes={sizes}
            priority={priority}
          />
        )}
      </div>
      {!hideCaption && !isIndex ? (
        <figcaption className="case-image-caption">
          <span className="case-image-kind">{KIND_LABELS[image.kind]}</span>
          <span className="case-image-text">{image.caption}</span>
          <span className="case-image-credit">
            {image.attribution}
            {image.license ? ` · ${image.license}` : ""} · {image.source}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}

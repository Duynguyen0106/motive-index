#!/usr/bin/env python3
"""Emit caseImageCatalogExtended.ts from generated JSON lookup results."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "src/data/caseImageCatalog.generated.json"
OUT_PATH = ROOT / "src/data/caseImageCatalogExtended.ts"

SLUG_LABELS: dict[str, str] = {
    "dean-corll": "Dean Corll",
    "richard-chase": "Richard Chase",
    "albert-fish": "Albert Fish",
    # fallback: slug to title case
}


def slug_title(slug: str) -> str:
    if slug in SLUG_LABELS:
        return SLUG_LABELS[slug]
    return slug.replace("-", " ").title()


def alt_text(slug: str, title: str, kind: str) -> str:
    name = slug_title(slug)
    if kind == "portrait":
        return f"Public-record photograph related to {name}"
    if kind == "location":
        return f"Location photograph for the {name} dossier jurisdiction"
    return f"Context photograph for the {name} dossier"


def caption(slug: str, title: str, kind: str) -> str:
    name = slug_title(slug)
    clean = re.sub(r"[_\.]", " ", title)
    clean = re.sub(r"\s+", " ", clean).strip()
    if kind == "portrait":
        return f"Public-record image associated with {name} ({clean})."
    if kind == "location":
        return f"Jurisdictional context for the {name} dossier ({clean})."
    return f"Historical or archival context for the {name} dossier ({clean})."


def emit_entry(slug: str, row: dict) -> str:
    img_id = f"img-{slug}"
    kind = row["kind"]
    sensitive = "true" if row.get("sensitive") else "false"
    title = row["title"]
    return f"""  "{slug}": [
    {{
      id: "{img_id}",
      url: "{row['url']}",
      alt: {json.dumps(alt_text(slug, title, kind))},
      caption: {json.dumps(caption(slug, title, kind))},
      kind: "{kind}",
      source: "Wikimedia Commons",
      attribution: {json.dumps(row.get('artist', 'Wikimedia Commons'))},
      license: {json.dumps(row.get('license', 'See Commons'))},
      sensitive: {sensitive},
    }},
  ],"""


def main() -> None:
    if not JSON_PATH.exists():
        raise SystemExit(f"Missing {JSON_PATH}; run build-case-image-catalog.py first")
    data = json.loads(JSON_PATH.read_text())
    lines = [
        'import type { CaseImage } from "@/lib/types";',
        "",
        "/** Auto-resolved Wikimedia Commons images (location/context/portrait fallbacks). */",
        "export const CASE_IMAGE_CATALOG_EXTENDED: Record<string, CaseImage[]> = {",
    ]
    for slug in sorted(data.keys()):
        lines.append(emit_entry(slug, data[slug]))
    lines.append("};")
    lines.append("")
    OUT_PATH.write_text("\n".join(lines))
    print(f"Wrote {len(data)} entries -> {OUT_PATH}")


if __name__ == "__main__":
    main()

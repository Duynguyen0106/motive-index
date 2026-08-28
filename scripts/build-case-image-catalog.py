#!/usr/bin/env python3
"""Resolve Wikimedia Commons images for case dossiers (build-time helper)."""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MotiveIndexBot/1.0 (educational archive builder)"

# slug -> ordered search queries (offender/context first, location fallback)
CASE_SEARCHES: dict[str, list[str]] = {
    "dean-corll": ["Houston Texas courthouse", "Harris County courthouse Houston"],
    "richard-chase": ["Richard Chase mugshot", "Sacramento California courthouse"],
    "albert-fish": ["Albert Fish mugshot", "Sing Sing prison New York"],
    "wayne-williams": ["Wayne Williams mugshot", "Atlanta Georgia courthouse"],
    "dorothea-puente": ["Dorothea Puente mugshot", "Sacramento California courthouse"],
    "paul-bernardo": ["Paul Bernardo mugshot", "Ontario courthouse Canada"],
    "clifford-olson": ["Clifford Olson mugshot", "British Columbia courthouse"],
    "ivan-milat": ["Ivan Milat mugshot", "New South Wales courthouse"],
    "martin-bryant": ["Port Arthur Tasmania memorial", "Hobart Tasmania courthouse"],
    "fred-west": ["Gloucester England cathedral", "Gloucester Crown Court"],
    "john-christie": ["10 Rillington Place London", "Old Bailey London"],
    "marc-dutroux": ["Charleroi Belgium courthouse", "Belgium palace justice Brussels"],
    "michel-fourniret": ["Palais de Justice Paris", "Charleroi Belgium courthouse"],
    "guy-georges": ["Palais de Justice Paris", "Paris courthouse"],
    "fritz-haarmann": ["Hanover Germany city hall", "Hanover Germany courthouse"],
    "beate-zschaepe": ["Munich courthouse", "NSU trial Munich"],
    "jack-unterweger": ["Vienna Austria courthouse", "Justizpalast Vienna"],
    "monster-of-florence": ["Florence Italy Palazzo Vecchio", "Florence Italy courthouse"],
    "willem-van-eijk": ["Amsterdam courthouse", "Paleis van Justitie Amsterdam"],
    "malcolm-macarthur": ["Four Courts Dublin", "Dublin Ireland courthouse"],
    "diogo-alves": ["Lisbon Portugal courthouse", "Arco da Rua Augusta Lisbon"],
    "moses-sithole": ["Johannesburg courthouse", "Pretoria High Court"],
    "andrei-chikatilo": ["Andrei Chikatilo mugshot", "Rostov-on-Don Russia"],
    "serhiy-tkach": ["Dnipro Ukraine city", "Ukraine courthouse"],
    "bela-kiss": ["Budapest Hungary parliament", "Budapest courthouse"],
    "tsutomu-miyazaki": ["Tokyo District Court", "Tokyo Japan courthouse"],
    "shoko-asahara": ["Tokyo subway sarin attack memorial", "Tokyo District Court"],
    "yoo-young-chul": ["Seoul South Korea courthouse", "Seoul Central District Court"],
    "yang-xinhai": ["Zhengzhou China city", "Henan China courthouse"],
    "surinder-koli": ["Noida India city", "Allahabad High Court"],
    "javed-iqbal-urdu": ["Lahore High Court", "Lahore Pakistan courthouse"],
    "saeed-hanaei-esfahan": ["Esfahan Iran Naqsh-e Jahan", "Isfahan Iran"],
    "charles-sobhraj": ["Bangkok Thailand courthouse", "Bangkok Grand Palace"],
    "adrian-lim": ["Singapore Supreme Court", "Toa Payoh Singapore"],
    "chen-chin-hsing": ["Taipei Taiwan courthouse", "Taipei city"],
    "pedro-lopez-colombia": ["Pedro Lopez mugshot Colombia", "Bogota Colombia courthouse"],
    "pedro-rodrigues-filho": ["Pedro Rodrigues Filho mugshot", "Sao Paulo Brazil courthouse"],
    "carlos-robledo-puch": ["Carlos Robledo Puch mugshot", "Buenos Aires courthouse"],
    "adolfo-constanzo": ["Matamoros Mexico city", "Tamaulipas Mexico courthouse"],
    "gracious-david-west": ["Port Harcourt Nigeria", "Lagos Nigeria courthouse"],
    "philip-onyancha": ["Nairobi Kenya courthouse", "Nairobi city Kenya"],
    "sture-bergwall": ["Stockholm Sweden courthouse", "Stockholm city hall"],
    "peter-lundin": ["Copenhagen Denmark courthouse", "Copenhagen city hall"],
    "lake-bodom": ["Lake Bodom Finland", "Espoo Finland lake"],
    "david-bain": ["Dunedin New Zealand courthouse", "Dunedin New Zealand"],
    "olga-heparnova": ["Prague Czech Republic courthouse", "Prague Old Town"],
    "mona-fandey": ["Kuala Lumpur courthouse", "Kuala Lumpur city"],
    "amrozi-nurhasyim": ["Bali bombing memorial", "Denpasar Bali Indonesia"],
    "yishai-schlissel-he": ["Jerusalem Israel courthouse", "Jerusalem Old City"],
    "ramadan-mansour": ["Cairo Egypt courthouse", "Cairo Egypt city"],
    "julio-perez-silva": ["Santiago Chile courthouse", "Santiago Chile city"],
    "abimael-guzman": ["Abimael Guzman mugshot", "Lima Peru courthouse"],
    "krzysztof-gawlik": ["Wroclaw Poland courthouse", "Wroclaw Poland city"],
    "werner-ferrari": ["Bern Switzerland courthouse", "Zurich Switzerland courthouse"],
    "le-thanh-van": ["Ho Chi Minh City courthouse", "Ho Chi Minh City Vietnam"],
    "juan-severino-mallari": ["Cebu Philippines courthouse", "Cebu City Philippines"],
    "ion-rimaru": ["Bucharest Romania courthouse", "Bucharest Romania"],
    "medeni-oztas": ["Ankara Turkey courthouse", "Ankara Turkey"],
    "dimitris-papageorgiou-el": ["Athens Greece courthouse", "Athens Greece"],
    "alexander-pichushkin": ["Alexander Pichushkin mugshot", "Moscow Russia courthouse"],
    "gao-chengyong": ["Baiyin China city", "Lanzhou China courthouse"],
    "niels-hoegel": ["Niels Hoegel mugshot", "Oldenburg Germany courthouse"],
    "henri-landru": ["Henri Landru mugshot", "Palais de Justice Paris"],
    "auto-shankar": ["Chennai India High Court", "Chennai India city"],
    "lucjan-staniak": ["Warsaw Poland courthouse", "Warsaw Poland"],
    "john-ausonius": ["John Ausonius mugshot", "Stockholm Sweden courthouse"],
    "akira-nishiguchi": ["Fukuoka Japan courthouse", "Fukuoka Japan city"],
    "donato-bilancia": ["Genoa Italy courthouse", "Liguria Italy coast"],
    "alcasser-girls": ["Valencia Spain courthouse", "Valencia Spain city"],
    "anatoly-onoprienko": ["Anatoly Onoprienko mugshot", "Dnipro Ukraine courthouse"],
    "mikhail-popkov": ["Angarsk Russia city", "Irkutsk Russia courthouse"],
    "ahmad-suradji": ["Medan Indonesia city", "North Sumatra Indonesia"],
    "tiago-henrique-rocha": ["Goiania Brazil courthouse", "Goiania Brazil"],
    "armin-meiwes": ["Armin Meiwes mugshot", "Kassel Germany courthouse"],
    "kaspars-petrovs": ["Riga Latvia courthouse", "Riga Latvia city"],
    "umesh-reddy": ["Bangalore India High Court", "Karnataka India courthouse"],
    "mamoru-takuma": ["Osaka Japan courthouse", "Ikeda Osaka Japan"],
    "richard-klinkhamer": ["Amsterdam Netherlands courthouse", "Amsterdam city"],
    "louay-al-taei": ["Baghdad Iraq courthouse", "Baghdad Iraq"],
    "kang-ho-sun": ["Suwon South Korea courthouse", "Seoul South Korea courthouse"],
    "somkid-pumpuang": ["Bangkok Thailand courthouse", "Sukhothai Thailand"],
    "juha-valjakkala": ["Helsinki Finland courthouse", "Mariehamn Aland Finland"],
    "arnfinn-nesset": ["Trondheim Norway courthouse", "Orkdal Norway"],
    "laszlo-pandy": ["Budapest Hungary courthouse", "Budapest Hungary"],
    "romulus-veres": ["Timisoara Romania courthouse", "Timisoara Romania"],
    "ozgur-dengiz": ["Ankara Turkey courthouse", "Ankara Turkey city"],
    "juraj-krajcik": ["Bratislava Slovakia courthouse", "Bratislava Slovakia"],
    "vlado-taneski": ["Skopje North Macedonia courthouse", "Kicevo Macedonia"],
    "petr-zelenka": ["Hradec Kralove Czech Republic courthouse", "Czech Republic courthouse"],
    "ershad-sikder": ["Dhaka Bangladesh courthouse", "Barisal Bangladesh"],
    "nguyen-tien-dung": ["Hanoi Vietnam courthouse", "Hanoi Vietnam city"],
}

PORTRAIT_HINTS = re.compile(
    r"mug\s*shot|mugshot|portrait|yearbook|booking|prison photo|department of corrections|fbi",
    re.I,
)
SKIP_EXT = re.compile(r"\.(pdf|djvu|svg|ogg|webm|tif|tiff)$", re.I)


def api(params: dict, retries: int = 5) -> dict:
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(2 ** attempt + 1)
                continue
            raise
    raise RuntimeError("unreachable")


def search_image(query: str) -> dict | None:
    data = api(
        {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srnamespace": "6",
            "srlimit": "8",
            "format": "json",
        }
    )
    for hit in data["query"]["search"]:
        title = hit["title"]
        if not title.startswith("File:"):
            continue
        filename = title[5:]
        if SKIP_EXT.search(filename):
            continue
        info = api(
            {
                "action": "query",
                "titles": title,
                "prop": "imageinfo",
                "iiprop": "url|extmetadata",
                "format": "json",
            }
        )
        page = next(iter(info["query"]["pages"].values()))
        if page.get("missing") == "":
            continue
        ii = page["imageinfo"][0]
        url = ii["url"].split("?")[0]
        meta = ii.get("extmetadata", {})
        artist = meta.get("Artist", {}).get("value", "")
        license_short = meta.get("LicenseShortName", {}).get("value", "See Commons")
        return {
            "title": filename,
            "url": url,
            "artist": re.sub(r"<[^>]+>", "", artist).strip() or "Wikimedia Commons",
            "license": license_short,
        }
    return None


def classify(query: str, title: str) -> tuple[str, bool]:
    text = f"{query} {title}"
    if PORTRAIT_HINTS.search(text):
        return "portrait", True
    if re.search(r"courthouse|court house|palace of justice|high court|district court|old bailey|justiz", text, re.I):
        return "location", False
    if re.search(r"memorial|monument|city hall|cathedral|cityscape|street|lake|moor", text, re.I):
        return "location", False
    return "context", False


def main() -> None:
    out = Path(__file__).resolve().parents[1] / "src/data/caseImageCatalog.generated.json"
    results: dict[str, dict] = {}
    if out.exists():
        results = json.loads(out.read_text())

    for slug, queries in CASE_SEARCHES.items():
        if slug in results:
            continue
        found = None
        used_query = ""
        for q in queries:
            found = search_image(q)
            if found:
                used_query = q
                break
            time.sleep(1.0)
        if not found:
            print(f"MISS {slug}")
            continue
        kind, sensitive = classify(used_query, found["title"])
        results[slug] = {
            "slug": slug,
            "query": used_query,
            "kind": kind,
            "sensitive": sensitive,
            **found,
        }
        out.write_text(json.dumps(results, indent=2, ensure_ascii=False))
        print(f"OK   {slug} <- {found['title'][:60]}")
        time.sleep(1.0)

    print(f"\nWrote {len(results)} entries -> {out}")


if __name__ == "__main__":
    main()

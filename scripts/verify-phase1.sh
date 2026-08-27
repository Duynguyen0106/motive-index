#!/usr/bin/env bash
# Phase-1 verification suite for Motive Index
set -u
BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
failures=()

check() {
  local name="$1"
  local ok="$2"
  if [[ "$ok" == "1" ]]; then
    echo "PASS  $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name"
    FAIL=$((FAIL + 1))
    failures+=("$name")
  fi
}

http_code() {
  curl -s -o /tmp/mi_body.txt -w "%{http_code}" "$1"
}

expect_200() {
  local name="$1"
  local url="$2"
  local code
  code=$(http_code "$url")
  if [[ "$code" == "200" ]]; then check "$name" 1; else check "$name [got $code]" 0; fi
}

expect_contains() {
  local name="$1"
  local url="$2"
  local needle="$3"
  local code
  code=$(http_code "$url")
  if [[ "$code" == "200" ]] && grep -q "$needle" /tmp/mi_body.txt; then
    check "$name" 1
  else
    check "$name [code=$code missing=$needle]" 0
  fi
}

echo "=== Motive Index verification @ $BASE ==="
echo

# Clean slate for deterministic checks
curl -s -X POST "$BASE/api/reset" >/dev/null || true

echo "-- Pages --"
expect_200 "GET /" "$BASE/"
expect_contains "Home brand" "$BASE/" "Motive Index"
expect_contains "Home featured dossier" "$BASE/" "Featured dossier"
expect_200 "GET /cases" "$BASE/cases"
expect_200 "GET /search" "$BASE/search"
expect_200 "GET /documents" "$BASE/documents"
expect_200 "GET /analyses" "$BASE/analyses"
expect_200 "GET /resources" "$BASE/resources"
expect_200 "GET /contribute" "$BASE/contribute"
expect_200 "GET /about" "$BASE/about"
expect_200 "GET /method" "$BASE/method"
expect_200 "GET /live" "$BASE/live"

echo
echo "-- Case dossiers & tabs --"
for slug in ted-bundy dennis-rader-btk ted-kaczynski aileen-wuornos zodiac-killer charles-manson harold-shipman contemporary-draft-example; do
  expect_200 "GET /cases/$slug" "$BASE/cases/$slug"
done
expect_contains "Tab story" "$BASE/cases/ted-bundy?tab=story" "Origins"
expect_contains "Tab overview content" "$BASE/cases/ted-bundy?tab=overview" "Legal outcome"
expect_contains "Tab timeline" "$BASE/cases/ted-bundy?tab=timeline" "Behavioral timeline"
expect_contains "Tab analysis" "$BASE/cases/ted-bundy?tab=analysis" "Psychological map"
expect_contains "Tab documents" "$BASE/cases/ted-bundy?tab=documents" "Document library"
expect_contains "Tab references" "$BASE/cases/ted-bundy?tab=references" "References"
expect_contains "Content warning present" "$BASE/cases/ted-bundy" "Content warning"
expect_contains "Psych factors tagged" "$BASE/cases/ted-bundy?tab=analysis" "Impression management"

echo
echo "-- Theories --"
for t in personality-psychology social-learning attachment-theory ideological-radicalization situational-opportunity group-influence; do
  expect_200 "GET /resources/theories/$t" "$BASE/resources/theories/$t"
done

echo
echo "-- Search filters --"
expect_contains "Filter power_control finds BTK" "$BASE/search?psychologicalFactor=power_control" "Dennis Rader"
expect_contains "Filter serial_murder" "$BASE/search?crimeCategory=serial_murder" "Ted Bundy"
expect_contains "Filter location California" "$BASE/search?location=California" "Zodiac"
expect_contains "Filter period 1974" "$BASE/search?period=1974" "Ted Bundy"
expect_contains "Filter offender female" "$BASE/search?offenderSex=female" "Aileen Wuornos"
expect_contains "Filter framework ideological" "$BASE/search?theoreticalFramework=ideological" "Ted Kaczynski"
expect_contains "Filter document manifesto" "$BASE/search?documentType=manifesto" "Industrial Society"
expect_contains "Filter q compartmentalization" "$BASE/search?q=compartmentalization" "Dennis Rader"
expect_contains "Filter status unsolved" "$BASE/search?status=unsolved" "Zodiac"

echo
echo "-- APIs --"
code=$(http_code "$BASE/api/cases")
if [[ "$code" == "200" ]] && grep -q '"slug":"ted-bundy"' /tmp/mi_body.txt; then check "GET /api/cases" 1; else check "GET /api/cases" 0; fi

code=$(http_code "$BASE/api/updates")
if [[ "$code" == "200" ]] && grep -q '"updates"' /tmp/mi_body.txt; then check "GET /api/updates" 1; else check "GET /api/updates" 0; fi

code=$(http_code "$BASE/api/ingest")
if [[ "$code" == "200" ]] && grep -q 'POST' /tmp/mi_body.txt; then check "GET /api/ingest usage" 1; else check "GET /api/ingest usage" 0; fi

# Ingest
ingest_body=$(curl -s -X POST "$BASE/api/ingest" -H 'content-type: application/json' \
  -d '{"headline":"Verification ingest case","summary":"Automated verification stub for phase-1 testing.","jurisdiction":"Test County","name":"Verification Ingest Case"}')
echo "$ingest_body" > /tmp/mi_ingest.json
if echo "$ingest_body" | grep -q '"slug":"verification-ingest-case"'; then
  check "POST /api/ingest creates case" 1
else
  # slug may get suffix if collision
  if echo "$ingest_body" | grep -q 'verification-ingest-case'; then check "POST /api/ingest creates case" 1
  else check "POST /api/ingest creates case" 0
  fi
fi
slug=$(python3 -c "import json;print(json.load(open('/tmp/mi_ingest.json'))['case']['slug'])" 2>/dev/null || true)
if [[ -n "${slug:-}" ]]; then
  expect_200 "Ingested case page" "$BASE/cases/$slug"
fi

# Analyze on a draft-friendly case (or force) so published seed stays intact
analyze_body=$(curl -s -X POST "$BASE/api/analyze" -H 'content-type: application/json' \
  -d '{"slug":"contemporary-draft-example"}')
if echo "$analyze_body" | grep -q '"slug":"contemporary-draft-example"'; then check "POST /api/analyze" 1; else check "POST /api/analyze" 0; fi

# Protect published analyses
code=$(curl -s -o /tmp/mi_body.txt -w "%{http_code}" -X POST "$BASE/api/analyze" -H 'content-type: application/json' -d '{"slug":"ted-bundy"}')
if [[ "$code" == "409" ]]; then check "POST /api/analyze protects published" 1; else check "POST /api/analyze protects published [got $code]" 0; fi

# Contribute
contrib_body=$(curl -s -X POST "$BASE/api/contribute" -H 'content-type: application/json' \
  -d '{"kind":"analysis","title":"Verification commentary draft","submitterName":"Test Bot","submitterRole":"Automated verifier","summary":"Phase-1 verification submission with public sources only."}')
if echo "$contrib_body" | grep -q '"status":"pending"'; then check "POST /api/contribute" 1; else check "POST /api/contribute" 0; fi

# Contribute invalid
code=$(curl -s -o /tmp/mi_body.txt -w "%{http_code}" -X POST "$BASE/api/contribute" -H 'content-type: application/json' -d '{"kind":"analysis"}')
if [[ "$code" == "400" ]]; then check "POST /api/contribute rejects bad body" 1; else check "POST /api/contribute rejects bad body [got $code]" 0; fi

# Analyze missing
code=$(curl -s -o /tmp/mi_body.txt -w "%{http_code}" -X POST "$BASE/api/analyze" -H 'content-type: application/json' -d '{"slug":"does-not-exist"}')
if [[ "$code" == "404" ]]; then check "POST /api/analyze 404 unknown slug" 1; else check "POST /api/analyze 404 unknown slug [got $code]" 0; fi

echo
echo "-- Nav / ethics copy --"
expect_contains "About ethics section" "$BASE/about" "Ethical"
expect_contains "About distress resources" "$BASE/about" "988"
expect_contains "Contribute form" "$BASE/contribute" "Submission form"
expect_contains "Glossary term" "$BASE/resources" "Modus operandi"
expect_contains "Documents library" "$BASE/documents" "Shipman Inquiry"

echo
echo "=== Results: $PASS passed, $FAIL failed ==="
if (( FAIL > 0 )); then
  echo "Failures:"
  for f in "${failures[@]}"; do echo "  - $f"; done
  exit 1
fi
exit 0

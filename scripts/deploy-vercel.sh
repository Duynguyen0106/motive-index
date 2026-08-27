#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN (https://vercel.com/account/settings/tokens)" >&2
  exit 1
fi

ENV_FILE="${ENV_FILE:-.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

# Ensure CRON_SECRET for production cron
if ! grep -q '^CRON_SECRET=' "$ENV_FILE"; then
  echo "CRON_SECRET=$(openssl rand -hex 32)" >> "$ENV_FILE"
fi

echo "Linking / creating Vercel project motive-index..."
npx vercel@latest link --yes --token "$VERCEL_TOKEN" --project motive-index 2>/dev/null \
  || npx vercel@latest link --yes --token "$VERCEL_TOKEN"

echo "Syncing env vars to Vercel (production)..."
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^# ]] && continue
  [[ "$line" != *"="* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  [[ -z "$key" || -z "$val" ]] && continue
  case "$key" in
    NEXT_PUBLIC_*|AUTH_*|ADMIN_*|SUPABASE_*|OPENAI_*|CRON_*|LIVE_*)
      printf '%s' "$val" | npx vercel@latest env add "$key" production --force --token "$VERCEL_TOKEN" >/dev/null
      ;;
  esac
done < "$ENV_FILE"

echo "Deploying production..."
npx vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"

#!/usr/bin/env bash
# Produce the same static HTML as `npm run build` (what GitHub Pages deploys), copy it
# into .preview-pages/, then optionally serve that folder.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

PREVIEW_DIR="${PREVIEW_DIR:-.preview-pages}"
SERVE=false
PORT="${PORT:-4173}"

usage() {
  echo "Usage: $0 [--serve]" >&2
  echo "  Writes static HTML to $PREVIEW_DIR/ (gitignored). --serve opens http://localhost:$PORT/" >&2
  echo "  Env: PORT, PREVIEW_DIR, BASE_URL, CADENCE_DOCS_URL" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --serve) SERVE=true; shift ;;
    -h | --help) usage ;;
    *) echo "Unknown option: $1" >&2; usage ;;
  esac
done

export BASE_URL="${BASE_URL:-/}"
export CADENCE_DOCS_URL="${CADENCE_DOCS_URL:-http://localhost:$PORT}"

npm ci
npm run build

rm -rf "$PREVIEW_DIR"
mkdir -p "$PREVIEW_DIR"
cp -a "$ROOT/build/." "$PREVIEW_DIR/"

echo "Static site (GitHub Pages–style output) copied to $ROOT/$PREVIEW_DIR/"

if [[ "$SERVE" == true ]]; then
  echo "Serving http://localhost:$PORT/"
  exec npx --yes serve -s "$PREVIEW_DIR" -l "$PORT"
fi

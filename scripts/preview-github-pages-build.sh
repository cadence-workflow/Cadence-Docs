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
  echo "  A BASE_URL such as /Cadence-Docs/ is kept in the path, as on a fork's GitHub Pages site." >&2
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

# The build's links and assets all start with BASE_URL, so serve it from that
# path, the way GitHub Pages serves a fork at /<repo>/. Docusaurus accepts the
# base URL with or without its surrounding slashes, so strip both here.
BASE_PATH="${BASE_URL#/}"
BASE_PATH="${BASE_PATH%/}"
SITE_DIR="$PREVIEW_DIR${BASE_PATH:+/$BASE_PATH}"

rm -rf "$PREVIEW_DIR"
mkdir -p "$SITE_DIR"
cp -a "$ROOT/build/." "$SITE_DIR/"
if [[ -n "$BASE_PATH" ]]; then
  # GitHub Pages answers a missing page under a project site with that
  # site's 404.html. serve only looks for 404.html in the folder it serves.
  cp "$SITE_DIR/404.html" "$PREVIEW_DIR/404.html"
fi

echo "Static site (GitHub Pages–style output) copied to $ROOT/$SITE_DIR/"

if [[ "$SERVE" == true ]]; then
  echo "Serving http://localhost:$PORT/${BASE_PATH:+$BASE_PATH/}"
  # No -s/--single: GitHub Pages is not a SPA host, so SPA-fallback would
  # mask redirect HTML files (e.g. /docs -> /docs/index.html) by rewriting
  # to the root index.html. Default serve behavior matches Pages: it serves
  # subdirectory index.html and falls back to 404.html.
  exec npx --yes serve "$PREVIEW_DIR" -l "$PORT"
fi

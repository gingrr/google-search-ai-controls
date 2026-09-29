#!/bin/sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 https://ORG.github.io/REPO EXTENSION_ID" >&2
  exit 2
fi

BASE_URL=${1%/}
EXTENSION_ID=$2

case "$BASE_URL" in
  https://*) ;;
  *) echo "GitHub Pages URL must start with https://" >&2; exit 2 ;;
esac

case "$EXTENSION_ID" in
  *[!a-p]*|???????????????????????????????|?????????????????????????????????*)
    echo "Extension ID must be exactly 32 letters in the range a-p." >&2
    exit 2
    ;;
esac

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
VERSION=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$ROOT/extension/manifest.json")

cat > "$ROOT/docs/updates.xml" <<XML
<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="$EXTENSION_ID">
    <updatecheck
      codebase="$BASE_URL/google-search-ai-controls.crx"
      version="$VERSION" />
  </app>
</gupdate>
XML

printf '%s\n' "$EXTENSION_ID" > "$ROOT/docs/extension-id.txt"
printf '%s\n' "$BASE_URL" > "$ROOT/docs/pages-base-url.txt"

echo "Configured GitHub Pages deployment:"
echo "  Extension ID: $EXTENSION_ID"
echo "  Update manifest: $BASE_URL/updates.xml"
echo "  CRX: $BASE_URL/google-search-ai-controls.crx"

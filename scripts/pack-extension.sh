#!/bin/sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 /path/to/signing-key.pem [chrome-or-chromium-binary]" >&2
  exit 2
fi

KEY=$1
CHROME=${2:-}
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
BUILD="$ROOT/build"
SRC="$ROOT/extension"
PACKDIR="$BUILD/google-search-ai-controls"

if [ ! -f "$KEY" ]; then
  echo "Signing key not found: $KEY" >&2
  exit 2
fi

if [ -z "$CHROME" ]; then
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$(command -v google-chrome 2>/dev/null || true)" \
    "$(command -v chromium 2>/dev/null || true)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      CHROME=$candidate
      break
    fi
  done
fi

if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  echo "Could not find Chrome/Chromium. Pass the browser binary as the second argument." >&2
  exit 2
fi

rm -rf "$PACKDIR" "$BUILD/google-search-ai-controls.crx"
mkdir -p "$BUILD"
cp -R "$SRC" "$PACKDIR"

"$CHROME" \
  --no-sandbox \
  --pack-extension="$PACKDIR" \
  --pack-extension-key="$KEY"

if [ ! -f "$BUILD/google-search-ai-controls.crx" ]; then
  echo "Chrome did not create the expected CRX package." >&2
  exit 1
fi

cp "$BUILD/google-search-ai-controls.crx" "$ROOT/docs/google-search-ai-controls.crx"
EXTENSION_ID=$("$ROOT/scripts/extension-id.py" "$KEY")
echo "$EXTENSION_ID" > "$ROOT/docs/extension-id.txt"

echo "Packed CRX: $ROOT/docs/google-search-ai-controls.crx"
echo "Extension ID: $EXTENSION_ID"

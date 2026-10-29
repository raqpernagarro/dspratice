#!/bin/bash
# Double-click this file in Finder to run the studio.
#
# A .command file is the macOS way to make a shell script double-clickable —
# Finder opens Terminal and runs it. Everything a first-time user needs
# happens here: dependency check, install, start, open the browser.

cd "$(dirname "$0")" || exit 1

echo ""
echo "  Nagarro Presentation Studio"
echo "  ---------------------------"
echo ""

# ---- Node ------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js is not installed."
  echo ""
  echo "  Install it once from https://nodejs.org (choose the LTS version),"
  echo "  then double-click this file again."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  Node.js $(node -v) is too old — version 18 or newer is required."
  echo "  Update it from https://nodejs.org, then try again."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

# ---- Dependencies ----------------------------------------------------------
# node_modules is not distributed (it is large and platform-specific), so the
# first run installs it. Later runs skip straight past this.
if [ ! -d node_modules ]; then
  echo "  First run — installing dependencies (a minute or two)..."
  echo ""
  npm install --omit=dev --no-audit --no-fund || {
    echo ""
    echo "  Install failed. Check your internet connection and try again."
    read -n 1 -s -r -p "  Press any key to close."
    exit 1
  }
  echo ""
fi

# Exporting renders each slide in a headless browser, which Playwright installs
# separately from npm. Without it the first Export failed with a terminal
# instruction the person was never told to run — for a feature the README
# advertises. Checked every launch, not only the first, because `npm install`
# does not restore it and an update can leave it missing.
if [ -d node_modules/playwright ] && ! node -e "require('playwright').chromium.executablePath()" >/dev/null 2>&1; then
  echo "  Setting up the browser used for PowerPoint and PDF export..."
  npx --yes playwright install chromium >/dev/null 2>&1 || {
    echo "  Could not install it. Everything works except exporting;"
    echo "  run 'npx playwright install chromium' to fix that later."
  }
  echo ""
fi

# ---- Already running? ------------------------------------------------------
# Opening the studio twice used to start a SECOND server on the next free port,
# pointed at the same product/data. Those two processes then raced each other's
# whole-file writes — the storage layer serialises writers within one process
# and cannot see across processes — so edits made in one window vanished when
# the other saved. Silently, with no error.
#
# So: find a studio that is already running and just open it. Two windows onto
# one server is fine; two servers onto one folder is not.
for TRY in $(seq 4600 4650); do
  if curl -s -o /dev/null --max-time 1 "http://localhost:$TRY/api/presentations"; then
    echo "  The studio is already running on port $TRY — opening it."
    open "http://localhost:$TRY"
    echo ""
    echo "  (This window can be closed. The studio keeps running in its own window.)"
    read -n 1 -s -r -p "  Press any key to close."
    exit 0
  fi
done

# ---- Port ------------------------------------------------------------------
# Nothing of ours is running, so take the first free port rather than failing on
# "address already in use" — something else may hold 4600.
PORT=4600
while lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 4650 ]; then
    echo "  Could not find a free port between 4600 and 4650."
    read -n 1 -s -r -p "  Press any key to close."
    exit 1
  fi
done

URL="http://localhost:$PORT"
echo "  Starting at $URL"
echo "  Leave this window open while you work. Close it to stop."
echo ""

# Give the server a moment to bind before the browser asks for the page.
( sleep 1.5; open "$URL" ) &

PORT=$PORT node product/application/server.js

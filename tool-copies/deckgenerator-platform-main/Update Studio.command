#!/bin/bash
# Double-click to pull the latest version and update dependencies.
#
# Your own work is never touched by this: presentations, users and sessions
# live in product/data/, which is deliberately not part of the repository.

cd "$(dirname "$0")" || exit 1

echo ""
echo "  Updating Nagarro Presentation Studio"
echo "  ------------------------------------"
echo ""

if ! command -v git >/dev/null 2>&1; then
  echo "  git is not installed, so this copy cannot update itself."
  echo "  Ask for a fresh copy of the folder instead."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

if [ ! -d .git ]; then
  echo "  This folder is a plain copy, not a clone, so there is nothing to"
  echo "  pull from. Ask for a fresh copy of the folder instead."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

# Refuse to clobber local edits rather than silently discarding them.
if [ -n "$(git status --porcelain)" ]; then
  echo "  You have local changes in this folder:"
  echo ""
  git status --short | sed 's/^/    /'
  echo ""
  echo "  Updating would overwrite them, so nothing has been changed."
  echo "  Move those files somewhere safe, then run this again."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

BEFORE=$(git rev-parse --short HEAD)

# --ff-only: take the new version as-is, never invent a merge commit.
if ! git pull --ff-only; then
  echo ""
  echo "  Could not update automatically — this copy has diverged from the"
  echo "  shared version. Ask for a fresh copy of the folder."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

AFTER=$(git rev-parse --short HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  echo ""
  echo "  Already up to date."
else
  echo ""
  echo "  Updated $BEFORE -> $AFTER. What changed:"
  git log --oneline "$BEFORE..$AFTER" | sed 's/^/    /'
  echo ""
  echo "  Updating dependencies..."
  npm install --omit=dev --no-audit --no-fund
fi

echo ""
echo "  Done. Double-click \"Start Studio\" to run it."
echo ""
read -n 1 -s -r -p "  Press any key to close."

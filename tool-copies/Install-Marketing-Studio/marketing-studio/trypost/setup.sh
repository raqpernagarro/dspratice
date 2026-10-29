#!/bin/sh
# First-time setup of the local TryPost: writes .env with fresh secrets (only if there is none yet),
# then builds the patched app and starts it. Safe to run again: an existing .env is kept.
#   sh trypost/setup.sh
set -e
cd "$(dirname "$0")"

for tool in docker openssl python3; do
    command -v "$tool" >/dev/null 2>&1 || { echo "setup: '$tool' is not installed (see INSTALL.md, step 1)" >&2; exit 1; }
done
docker info >/dev/null 2>&1 || { echo "setup: Docker is not running. Start it with: colima start" >&2; exit 1; }

if [ -f .env ]; then
    echo "setup: .env exists, keeping it"
else
    echo "setup: writing .env with fresh secrets"
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out "$tmp/private.pem" 2>/dev/null
    openssl pkey -in "$tmp/private.pem" -pubout -out "$tmp/public.pem"
    APP_KEY="base64:$(openssl rand -base64 32)" \
    DB_PASSWORD="$(openssl rand -hex 24)" \
    REVERB_APP_ID="$(od -An -N3 -tu4 /dev/urandom | tr -d ' ')" \
    REVERB_APP_KEY="$(openssl rand -hex 16)" \
    REVERB_APP_SECRET="$(openssl rand -hex 32)" \
    PRIVATE_PEM="$tmp/private.pem" PUBLIC_PEM="$tmp/public.pem" \
    python3 - <<'PY'
import os
from pathlib import Path

def pem(path):
    # One line in .env: newlines written as \n inside double quotes, which Docker Compose expands.
    return '"' + Path(path).read_text().strip().replace("\n", "\\n") + '"'

values = {
    "APP_KEY": os.environ["APP_KEY"],
    "DB_PASSWORD": os.environ["DB_PASSWORD"],
    "REVERB_APP_ID": os.environ["REVERB_APP_ID"],
    "REVERB_APP_KEY": os.environ["REVERB_APP_KEY"],
    "REVERB_APP_SECRET": os.environ["REVERB_APP_SECRET"],
    "PASSPORT_PRIVATE_KEY": pem(os.environ["PRIVATE_PEM"]),
    "PASSPORT_PUBLIC_KEY": pem(os.environ["PUBLIC_PEM"]),
}
lines = []
for line in Path(".env.example").read_text().splitlines():
    key = line.split("=", 1)[0]
    if key in values and line.endswith("=__GENERATED__"):
        line = key + "=" + values[key]
    lines.append(line)
Path(".env").write_text("\n".join(lines) + "\n")
PY
    chmod 600 .env
fi

echo "setup: building the app (the first build takes 5 to 15 minutes)"
docker compose -f compose.local.yaml build app
docker compose -f compose.local.yaml up -d

printf "setup: waiting for TryPost"
i=0
until curl -fsS -o /dev/null http://localhost:8000/login 2>/dev/null; do
    i=$((i + 1))
    [ "$i" -gt 90 ] && { echo; echo "setup: TryPost did not answer after 3 minutes. Check: docker compose -f trypost/compose.local.yaml logs app" >&2; exit 1; }
    printf "."; sleep 2
done
echo
echo "setup: TryPost is up at http://localhost:8000. Next: sh trypost/create-user.sh (INSTALL.md, step 4)."

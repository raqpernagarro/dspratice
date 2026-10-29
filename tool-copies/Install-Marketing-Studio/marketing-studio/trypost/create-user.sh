#!/bin/sh
# Creates your TryPost login and its workspace. Self-hosted TryPost has no sign-up page, so the first
# user is made here. Run once, after setup.sh. The account only exists on this Mac.
#   sh trypost/create-user.sh
set -e
cd "$(dirname "$0")"
COMPOSE_FILE="${COMPOSE_FILE:-compose.local.yaml}"
printf "Your name: "; read -r MS_NAME
printf "Your email (used only to sign in, nothing is sent): "; read -r MS_EMAIL
stty -echo 2>/dev/null || true; printf "Choose a password (8 characters or more): "; read -r MS_PASSWORD; stty echo 2>/dev/null || true; echo
MS_TIMEZONE="$(readlink /etc/localtime 2>/dev/null | sed 's#.*/zoneinfo/##')"
export MS_NAME MS_EMAIL MS_PASSWORD MS_TIMEZONE
docker compose -f "$COMPOSE_FILE" exec -T -e MS_NAME -e MS_EMAIL -e MS_PASSWORD -e MS_TIMEZONE app php artisan tinker --execute='
if (strlen((string) getenv("MS_PASSWORD")) < 8) { echo "The password needs 8 characters or more. Run the script again.".PHP_EOL; return; }
if (App\Models\User::where("email", getenv("MS_EMAIL"))->exists()) { echo "A user with that email already exists: sign in at http://localhost:8000".PHP_EOL; return; }
App\Actions\User\CreateUser::execute(["name" => getenv("MS_NAME"), "email" => getenv("MS_EMAIL"), "password" => getenv("MS_PASSWORD"), "email_verified_at" => now(), "timezone" => getenv("MS_TIMEZONE") ?: null]);
echo "Created. Sign in at http://localhost:8000 with that email and password.".PHP_EOL;
'

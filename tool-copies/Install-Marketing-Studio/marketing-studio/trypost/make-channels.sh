#!/bin/sh
# Creates the placeholder channels the drafts sit on: LinkedIn, Instagram, X, Viva Engage and Substack.
# Run once, after trypost/create-user.sh. Running it again changes nothing.
#   sh trypost/make-channels.sh
set -e
cd "$(dirname "$0")"
COMPOSE_FILE="${COMPOSE_FILE:-compose.local.yaml}"
docker compose -f "$COMPOSE_FILE" exec -T app sh -c 'mkdir -p storage/app/public/social-accounts && cp public/images/accounts/linkedin.png public/images/accounts/instagram.png public/images/accounts/viva-engage.png public/images/accounts/substack.png storage/app/public/social-accounts/ 2>/dev/null; cp public/images/accounts/x.png storage/app/public/social-accounts/x.png 2>/dev/null || true'
docker compose -f "$COMPOSE_FILE" exec -T app php artisan tinker --execute="
\$workspace = App\Models\Workspace::orderBy('created_at')->first();
if (! \$workspace) { echo 'No workspace yet: run sh trypost/create-user.sh first.'.PHP_EOL; return; }
foreach ([['linkedin', 'manual-linkedin', 'LinkedIn', 'linkedin.png'], ['instagram', 'manual-instagram', 'Instagram', 'instagram.png'], ['x', 'manual-x', 'X', 'x.png'], ['facebook', 'manual-facebook', 'Viva Engage', 'viva-engage.png'], ['mastodon', 'manual-mastodon', 'Substack', 'substack.png']] as [\$platform, \$username, \$name, \$avatar]) {
    if (App\Models\SocialAccount::where('username', \$username)->exists()) { echo 'exists '.\$username.PHP_EOL; continue; }
    \$row = new App\Models\SocialAccount();
    \$row->workspace_id = \$workspace->id;
    \$row->platform = \$platform;
    \$row->platform_user_id = \$username;
    \$row->username = \$username;
    \$row->display_name = \$name;
    \$row->avatar_url = 'social-accounts/'.\$avatar;
    \$row->access_token = 'manual-placeholder';
    \$row->status = 'disconnected';
    \$row->disconnected_at = now();
    \$row->timezone = 'UTC';
    \$row->save();
    echo 'created '.\$username.PHP_EOL;
}
"

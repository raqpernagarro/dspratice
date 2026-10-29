#!/bin/sh
# Installs the Claude CLI bridge as a login item, so TryPost's AI features work after every restart.
#   sh trypost/claude-bridge/install-launch-agent.sh
set -e
here="$(cd "$(dirname "$0")" && pwd)"
claude_dir="$(dirname "$(command -v claude 2>/dev/null || echo "$HOME/.local/bin/claude")")"
plist="$HOME/Library/LaunchAgents/com.marketing-studio.claude-bridge.plist"
mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s#__RUN_SH__#$here/run.sh#" -e "s#__PATH__#$claude_dir:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin#" \
    "$here/com.marketing-studio.claude-bridge.plist" > "$plist"
launchctl unload "$plist" 2>/dev/null || true
launchctl load "$plist"
sleep 2
curl -fsS http://127.0.0.1:8765/health && echo && echo "bridge: running, and it starts at every login"

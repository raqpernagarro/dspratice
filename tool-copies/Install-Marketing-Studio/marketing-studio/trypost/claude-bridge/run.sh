#!/bin/sh
# Starts the Claude CLI bridge TryPost's AI features talk to. Keep it running while you use TryPost.
# Logs go to trypost/claude-bridge/bridge.log (timings only, never prompts).
cd "$(dirname "$0")" || exit 1
exec /usr/bin/env python3 server.py --host 127.0.0.1 --port 8765 --model "${CLAUDE_BRIDGE_MODEL:-sonnet}" --key "${CLAUDE_BRIDGE_KEY:-local-claude-cli}" 2>>bridge.log

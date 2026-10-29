#!/usr/bin/env python3
"""An OpenAI-compatible chat endpoint on this Mac that answers through the Claude Code CLI.

TryPost's AI features speak the OpenAI chat protocol to any URL (`AI_TEXT_PROVIDER=openai-compatible`).
This server listens on the Mac's loopback, takes each chat request, runs `claude -p` with it and
returns the answer in the OpenAI shape, so TryPost uses the author's Claude Code login instead of an API key.

Usage:
    python3 trypost/claude-bridge/server.py [--host 127.0.0.1] [--port 8765] [--model sonnet] [--key local-claude-cli]

The container reaches it at http://host.docker.internal:8765/v1. Requests must carry the key as a
bearer token; the same value goes into TryPost's OPENAI_COMPATIBLE_API_KEY. The CLI must be logged
in (`claude` once, interactively); until then every completion answers with the CLI's own error.

Standard library only. Nothing is logged beyond timings and sizes: prompts and answers stay private.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DEFAULT_MODEL = "sonnet"
CLI_TIMEOUT = 240
MAX_BODY = 8 * 1024 * 1024


def log(message: str) -> None:
    sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S ") + message + "\n")
    sys.stderr.flush()


def flatten_messages(messages: list) -> tuple[str, str, list]:
    """Turn OpenAI messages into a system prompt, a conversation prompt and saved image paths."""
    system_parts: list[str] = []
    turns: list[str] = []
    images: list[str] = []
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")
        texts: list[str] = []
        if isinstance(content, str):
            texts.append(content)
        elif isinstance(content, list):
            for part in content:
                if not isinstance(part, dict):
                    continue
                kind = part.get("type")
                if kind == "text":
                    texts.append(str(part.get("text", "")))
                elif kind in ("image_url", "input_image"):
                    url = part.get("image_url", {})
                    url = url.get("url") if isinstance(url, dict) else url
                    path = save_image(str(url or ""))
                    if path:
                        images.append(path)
                        texts.append("[An image is saved at %s. Read it before answering.]" % path)
        text = "\n".join(t for t in texts if t)
        if role == "system":
            system_parts.append(text)
        elif role == "assistant":
            turns.append("Assistant: " + text)
        else:
            turns.append("User: " + text)
    return "\n\n".join(system_parts), "\n\n".join(turns), images


def save_image(url: str) -> str:
    """Save a data: URL image to a temp file and return its path; other URLs are left to the model."""
    if not url.startswith("data:"):
        return ""
    try:
        header, payload = url.split(",", 1)
        mime = header[5:].split(";")[0]
        ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif"}.get(mime, ".img")
        handle, path = tempfile.mkstemp(prefix="trypost-ai-", suffix=ext)
        with os.fdopen(handle, "wb") as fh:
            fh.write(base64.b64decode(payload))
        return path
    except Exception as error:  # noqa: BLE001
        log("image not saved: %s" % error)
        return ""


def run_claude(prompt: str, system: str, model: str, images: list, workdir: Path) -> dict:
    command = ["claude", "-p", prompt, "--output-format", "json", "--model", model]
    if system:
        command += ["--system-prompt", system]
    if images:
        command += ["--allowedTools", "Read"]
    env = {k: v for k, v in os.environ.items() if not k.startswith("CLAUDE")}
    started = time.time()
    try:
        done = subprocess.run(command, capture_output=True, text=True, timeout=CLI_TIMEOUT, cwd=str(workdir), env=env)
    except subprocess.TimeoutExpired:
        return {"error": "the Claude CLI took longer than %d seconds" % CLI_TIMEOUT, "status": 504}
    except FileNotFoundError:
        return {"error": "the claude command is not on this Mac's PATH", "status": 500}
    finally:
        for path in images:
            try:
                os.remove(path)
            except OSError:
                pass
    elapsed = time.time() - started
    try:
        data = json.loads(done.stdout)
    except ValueError:
        log("cli exit %d after %.1fs, no JSON" % (done.returncode, elapsed))
        return {"error": (done.stderr or done.stdout or "no output from the Claude CLI").strip()[:500], "status": 502}
    if data.get("is_error"):
        log("cli error after %.1fs" % elapsed)
        return {"error": str(data.get("result", "the Claude CLI reported an error"))[:500], "status": 502}
    usage = data.get("usage") or {}
    log("cli ok after %.1fs, %d characters" % (elapsed, len(str(data.get("result", "")))))
    return {
        "text": str(data.get("result", "")),
        "prompt_tokens": int(usage.get("input_tokens", 0) or 0) + int(usage.get("cache_read_input_tokens", 0) or 0),
        "completion_tokens": int(usage.get("output_tokens", 0) or 0),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "claude-bridge/1"
    key = "local-claude-cli"
    default_model = DEFAULT_MODEL
    workdir = Path(tempfile.gettempdir())

    def log_message(self, fmt, *args):  # quiet the default access log
        return

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status: int, message: str) -> None:
        self._send_json(status, {"error": {"message": message, "type": "bridge_error", "code": status}})

    def _authorised(self) -> bool:
        header = self.headers.get("Authorization", "")
        return header == "Bearer " + self.key

    def do_GET(self):  # noqa: N802
        if self.path.rstrip("/") in ("/v1/models", "/models"):
            if not self._authorised():
                return self._error(401, "wrong or missing bearer key")
            now = int(time.time())
            models = [{"id": name, "object": "model", "created": now, "owned_by": "claude-cli"} for name in (self.default_model, "sonnet", "opus", "haiku")]
            return self._send_json(200, {"object": "list", "data": models})
        if self.path.rstrip("/") in ("", "/health"):
            return self._send_json(200, {"ok": True, "model": self.default_model})
        return self._error(404, "not found")

    def do_POST(self):  # noqa: N802
        if self.path.rstrip("/") not in ("/v1/chat/completions", "/chat/completions"):
            return self._error(404, "not found")
        if not self._authorised():
            return self._error(401, "wrong or missing bearer key")
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0 or length > MAX_BODY:
            return self._error(400, "a JSON body is required")
        try:
            request = json.loads(self.rfile.read(length).decode("utf-8"))
        except ValueError:
            return self._error(400, "the body is not JSON")
        messages = request.get("messages") or []
        if not isinstance(messages, list) or not messages:
            return self._error(400, "messages is required")
        model = str(request.get("model") or self.default_model)
        system, prompt, images = flatten_messages(messages)
        if not prompt.strip():
            return self._error(400, "no text in messages")
        result = run_claude(prompt, system, model, images, self.workdir)
        if "error" in result:
            return self._error(int(result.get("status", 502)), result["error"])
        completion_id = "chatcmpl-" + uuid.uuid4().hex[:24]
        created = int(time.time())
        if request.get("stream"):
            return self._stream(completion_id, created, model, result["text"])
        payload = {
            "id": completion_id,
            "object": "chat.completion",
            "created": created,
            "model": model,
            "choices": [{"index": 0, "message": {"role": "assistant", "content": result["text"]}, "finish_reason": "stop"}],
            "usage": {
                "prompt_tokens": result["prompt_tokens"],
                "completion_tokens": result["completion_tokens"],
                "total_tokens": result["prompt_tokens"] + result["completion_tokens"],
            },
        }
        return self._send_json(200, payload)

    def _stream(self, completion_id: str, created: int, model: str, text: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        def chunk(delta: dict, finish=None) -> bytes:
            data = {"id": completion_id, "object": "chat.completion.chunk", "created": created, "model": model, "choices": [{"index": 0, "delta": delta, "finish_reason": finish}]}
            return ("data: " + json.dumps(data) + "\n\n").encode("utf-8")

        self.wfile.write(chunk({"role": "assistant", "content": ""}))
        self.wfile.write(chunk({"content": text}))
        self.wfile.write(chunk({}, "stop"))
        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--model", default=os.environ.get("CLAUDE_BRIDGE_MODEL", DEFAULT_MODEL))
    parser.add_argument("--key", default=os.environ.get("CLAUDE_BRIDGE_KEY", "local-claude-cli"))
    args = parser.parse_args(argv)
    Handler.key = args.key
    Handler.default_model = args.model
    workdir = Path(tempfile.gettempdir()) / "claude-bridge"
    workdir.mkdir(parents=True, exist_ok=True)
    Handler.workdir = workdir
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    log("claude-bridge listening on http://%s:%d/v1 with model %s" % (args.host, args.port, args.model))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())

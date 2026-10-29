#!/usr/bin/env python3
"""Static file server for the engine tree, with no caching.

NOTE: this is no longer how the product runs. `npm start` serves the files AND
the API from one Node process on one origin — use that. This script only
serves files, so on its own the product's pages load but every API call fails.

It is kept for the split setup (files here, API on its own port), which is
still useful when you want the engine tree on a stable URL. To make that work
it injects an `api-base` meta tag into every HTML page, pointing at the API
port — without it the pages would look for /api on THIS port, where there is
none. Pass the API port as the second argument:

    python3 serve.py 4599 4600     # files on 4599, API on 4600

The default `python -m http.server` lets the browser heuristically cache ES
modules and CSS without revalidating, so edits don't show up until a hard
refresh. This one sends no-store so every reload fetches fresh files.
"""
import io
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

API_BASE = ""
_HEAD = re.compile(rb"(<head[^>]*>)", re.IGNORECASE)


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if not (API_BASE and path.endswith(".html")):
            return super().send_head()
        try:
            with open(path, "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(404)
            return None
        # Only the first <head> — a page has one, and a global replace would
        # also rewrite any escaped markup further down.
        tag = b'<meta name="api-base" content="%s">' % API_BASE.encode()
        body, n = _HEAD.subn(lambda m: m.group(1) + tag, body, count=1)
        if not n:  # no <head> to inject into; serve it untouched
            return super().send_head()
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4599
    if len(sys.argv) > 2:
        API_BASE = f"http://localhost:{int(sys.argv[2])}"
        print(f"Serving files on {port}, pointing the UI at the API on {API_BASE}")
    else:
        print(f"Serving files on {port}. NOTE: no API port given, so API calls "
              f"will fail — run `npm start` instead, or pass the API port: "
              f"python3 serve.py {port} 4600")
    # Loopback only. This handler serves the repository root, so binding ""
    # (every interface, the previous behaviour) published credentials.json,
    # product/data/ and .git to the whole network for as long as it ran — and
    # the exporter starts it on every export, so that window was not rare.
    ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()

"""A small TryPost REST client on urllib, with an injectable transport so tests never touch the network."""
from __future__ import annotations

import json
import mimetypes
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path


class ApiError(Exception):
    def __init__(self, status: int, message: str, body=None):
        super().__init__("%s: %s" % (status, message))
        self.status = status
        self.message = message
        self.body = body


def load_env(path: Path) -> dict[str, str]:
    """Read KEY=value lines from a .env file; comments and blank lines are ignored, quotes stripped."""
    values: dict[str, str] = {}
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


def _urllib_transport(method: str, url: str, headers: dict, body: bytes | None) -> tuple[int, bytes]:
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


RATE_LIMIT_RETRIES = 5
DEFAULT_RETRY_WAIT = 61


def _retry_after(data: bytes) -> int:
    """Seconds to wait after a 429: the API's 'retry after N seconds' plus one, else a minute."""
    match = re.search(rb"retry after (\d+) seconds", data, re.I)
    return int(match.group(1)) + 1 if match else DEFAULT_RETRY_WAIT


class TryPostClient:
    def __init__(self, base_url: str, token: str, transport=None, sleep=None):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.transport = transport or _urllib_transport
        self.sleep = sleep or time.sleep

    def _request(self, method: str, path: str, params=None, json_body=None, raw: bytes | None = None, content_type: str | None = None):
        url = self.base_url + path
        if params:
            url += "?" + urllib.parse.urlencode(params, doseq=True)
        headers = {"Authorization": "Bearer " + self.token, "Accept": "application/json"}
        body = None
        if json_body is not None:
            body = json.dumps(json_body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif raw is not None:
            body = raw
            headers["Content-Type"] = content_type or "application/octet-stream"
        for attempt in range(RATE_LIMIT_RETRIES + 1):
            status, data = self.transport(method, url, headers, body)
            if status != 429 or attempt == RATE_LIMIT_RETRIES:
                break
            self.sleep(_retry_after(data))
        parsed = {}
        if data:
            try:
                parsed = json.loads(data.decode("utf-8"))
            except ValueError:
                parsed = {"raw": data.decode("utf-8", errors="replace")}
        if status >= 400:
            message = parsed.get("message") if isinstance(parsed, dict) else None
            raise ApiError(status, message or data.decode("utf-8", errors="replace") or "HTTP %s" % status, parsed)
        return parsed

    def get(self, path: str, params=None) -> dict:
        return self._request("GET", path, params=params)

    def post(self, path: str, json=None) -> dict:
        return self._request("POST", path, json_body=json if json is not None else {})

    def put(self, path: str, json) -> dict:
        return self._request("PUT", path, json_body=json)

    def delete(self, path: str) -> None:
        self._request("DELETE", path)
        return None

    def upload(self, file: Path, alt: str | None = None) -> str:
        """Upload one media file as multipart/form-data and return its single-use upload token."""
        file = Path(file)
        boundary = "----MarketingStudio" + uuid.uuid4().hex
        mime = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
        parts = [
            ("--%s\r\n" % boundary).encode()
            + ('Content-Disposition: form-data; name="media"; filename="%s"\r\n' % file.name).encode()
            + ("Content-Type: %s\r\n\r\n" % mime).encode()
            + file.read_bytes()
            + b"\r\n"
        ]
        if alt:
            parts.append(("--%s\r\n" % boundary).encode() + b'Content-Disposition: form-data; name="alt"\r\n\r\n' + alt.encode("utf-8") + b"\r\n")
        body = b"".join(parts) + ("--%s--\r\n" % boundary).encode()
        response = self._request("POST", "/api/uploads", raw=body, content_type="multipart/form-data; boundary=%s" % boundary)
        return response["upload_token"]

    def list_all(self, path: str, params=None) -> list[dict]:
        """Follow a paginated listing ({data, meta.current_page, meta.last_page}) to the end."""
        items: list[dict] = []
        page = 1
        while True:
            query = dict(params or {})
            query["page"] = page
            response = self.get(path, params=query)
            items.extend(response.get("data", []))
            meta = response.get("meta") or {}
            if page >= int(meta.get("last_page", page)):
                return items
            page += 1

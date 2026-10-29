"""Minimal stdlib YAML-subset frontmatter parser for Marketing Studio Content Objects (copied from Marketeer evals/lib).

Handles the subset our Content Objects actually use:
  key: scalar            -> str | int | float | bool | None
  key: "quoted scalar"
  key: [a, b, c]         -> list
  key: { k: v, k2: v2 }  -> dict (one level)

No external deps (the repo convention is stdlib-only), and no PyYAML even when it is
installed: PyYAML would turn dates into date objects, and the files keep them as strings.
"""
from __future__ import annotations


def split_frontmatter(text: str):
    """Return (frontmatter_str, body_str). frontmatter_str is '' if absent."""
    if not text.startswith("---"):
        return "", text
    # find the closing '---' on its own line; split on "\n" (not splitlines) so the
    # body keeps its trailing newline and files round-trip exactly
    lines = text.split("\n")
    if lines[0].strip() != "---":
        return "", text
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            fm = "\n".join(lines[1:i])
            body = "\n".join(lines[i + 1:])
            return fm, body
    return "", text  # no closing delimiter -> treat as no frontmatter


_ESCAPES = {"n": "\n", '"': '"', "\\": "\\"}


def _unescape(inner: str) -> str:
    """Undo the escapes `_scalar` writes inside double quotes: \\n, \\" and \\\\."""
    out, i = [], 0
    while i < len(inner):
        ch = inner[i]
        if ch == "\\" and i + 1 < len(inner) and inner[i + 1] in _ESCAPES:
            out.append(_ESCAPES[inner[i + 1]])
            i += 2
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def _coerce(scalar: str):
    s = scalar.strip()
    if s == "" or s.lower() in ("null", "~", "none"):
        return None
    if s.startswith('"') and s.endswith('"') and len(s) >= 2:
        return _unescape(s[1:-1])
    if s.startswith("'") and s.endswith("'") and len(s) >= 2:
        return s[1:-1]
    if s.lower() == "true":
        return True
    if s.lower() == "false":
        return False
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        pass
    return s


def _parse_inline_list(s: str):
    inner = s.strip()[1:-1].strip()
    if not inner:
        return []
    return [_coerce(p) for p in _split_top_level(inner)]


def _parse_inline_dict(s: str):
    inner = s.strip()[1:-1].strip()
    out = {}
    if not inner:
        return out
    for part in _split_top_level(inner):
        if ":" not in part:
            continue
        k, v = part.split(":", 1)
        out[k.strip()] = _coerce(v)
    return out


def _split_top_level(s: str):
    """Split on commas not nested in [] or {} and not inside double quotes."""
    parts, depth, cur, in_quotes, escaped = [], 0, "", False, False
    for ch in s:
        if in_quotes:
            cur += ch
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_quotes = False
            continue
        if ch == '"':
            in_quotes = True
        elif ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    return parts


def _parse_minimal(fm: str) -> dict:
    data = {}
    for raw in fm.splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        key, val = key.strip(), val.strip()
        if val.startswith("[") and val.endswith("]"):
            data[key] = _parse_inline_list(val)
        elif val.startswith("{") and val.endswith("}"):
            data[key] = _parse_inline_dict(val)
        else:
            data[key] = _coerce(val)
    return data


_NEEDS_QUOTES = (": ", "#", '"', ",", "[", "{", "]", "}")


def _scalar(value) -> str:
    """Render one scalar the way `_coerce` reads it back."""
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value)
    looks_like_other_type = _coerce(s) != s or not isinstance(_coerce(s), str)
    if (
        s == ""
        or "\n" in s
        or looks_like_other_type
        or s != s.strip()
        or s.startswith("'")
        or any(ch in s for ch in _NEEDS_QUOTES)
    ):
        return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'
    return s


def _value(value) -> str:
    if isinstance(value, list):
        return "[" + ", ".join(_scalar(v) for v in value) + "]"
    if isinstance(value, dict):
        if not value:
            return "{}"
        return "{ " + ", ".join("%s: %s" % (k, _scalar(v)) for k, v in value.items()) + " }"
    return _scalar(value)


def dump(meta: dict, body: str) -> str:
    """Render (meta, body) as a Content Object file: '---\\n<lines>\\n---\\n<body>'."""
    lines = ["%s: %s" % (key, _value(value)) for key, value in meta.items()]
    return "---\n" + "\n".join(lines) + ("\n" if lines else "") + "---\n" + body


def parse(text: str):
    """Parse a Content Object file's text -> (meta: dict, body: str)."""
    fm, body = split_frontmatter(text)
    if not fm:
        return {}, body
    # Always the minimal parser, never PyYAML: dates and datetimes must stay strings.
    return _parse_minimal(fm), body

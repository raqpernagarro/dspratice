"""An in-memory TryPost for tests. It answers the handful of endpoints the sync uses, shaped the way the
real API answered during the spike of 21 Oct 2026 (docs/research/spike-trypost-api.md): create, update and
note responses unwrapped; listings wrapped with data and meta; scheduled_at echoed back in UTC as
"YYYY-MM-DD HH:MM:SS"; upload tokens single use. Its clock is frozen so tests do not depend on today."""
from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlsplit

FROZEN_NOW = datetime(2026, 10, 21, 12, 0, tzinfo=timezone.utc)
PER_PAGE = 15
PLATFORM_CONTENT_TYPES = {"linkedin": "linkedin_post", "instagram": "instagram_feed", "x": "x_post", "facebook": "facebook_post",
                          "mastodon": "mastodon_post"}
# The manual channels, as Slice 0 and Slice 4 inserted them: Viva Engage borrows facebook and Substack borrows mastodon.
MANUAL_CHANNELS = (("linkedin", "Linkedin (manual)"), ("instagram", "Instagram (manual)"), ("x", "X (manual)"),
                   ("facebook", "Viva Engage (manual)"), ("mastodon", "Substack (manual)"))


def _uuid() -> str:
    return str(uuid.uuid4())


class FakeTryPost:
    def __init__(self, now: datetime = FROZEN_NOW):
        self.now = now
        self.accounts: dict[str, dict] = {}
        self.labels: dict[str, dict] = {}
        self.idea_stages: dict[str, dict] = {}
        self.ideas: dict[str, dict] = {}
        self.posts: dict[str, dict] = {}
        self.notes: dict[str, list[dict]] = {}
        self.uploads: dict[str, str] = {}
        self.consumed_uploads: set[str] = set()
        self.requests: list[tuple] = []
        self.last_headers: dict = {}
        self.fail_next_note = False  # when True, the next POST .../notes answers 500 once
        for platform, display_name in MANUAL_CHANNELS:
            id = _uuid()
            self.accounts[id] = {"id": id, "platform": platform, "display_name": display_name,
                                 "username": "manual-" + platform, "status": "disconnected", "timezone": "Europe/Lisbon"}
        # TryPost's default columns. "Unassigned" is not one of them: the board draws it for ideas with no stage (null).
        for position, name in enumerate(["To Do", "In Progress", "Done"]):
            id = _uuid()
            self.idea_stages[id] = {"id": id, "name": name, "position": position}

    # ----- helpers used by tests -----

    def add_label_to_post(self, post_id: str, name: str) -> None:
        label = next((l for l in self.labels.values() if l["name"] == name), None)
        if label is None:
            label = {"id": _uuid(), "name": name, "color": "#000000"}
            self.labels[label["id"]] = label
        post = self.posts[post_id]
        if not any(l["id"] == label["id"] for l in post["labels"]):
            post["labels"].append({"id": label["id"], "name": label["name"]})

    def move_idea(self, idea_id: str, stage_name: str) -> None:
        """What the author does when he drags a card to another column of the board; "Unassigned" is the built-in no-stage column."""
        if stage_name == "Unassigned":
            self._place_idea(self.ideas[idea_id], None)
            return
        stage = next(s for s in self.idea_stages.values() if s["name"] == stage_name)
        self._place_idea(self.ideas[idea_id], stage["id"])

    def delete_idea(self, idea_id: str) -> None:
        """What the author does when he deletes a card from the board."""
        del self.ideas[idea_id]

    # ----- transport -----

    def transport(self, method: str, url: str, headers: dict, body: bytes | None) -> tuple[int, bytes]:
        self.last_headers = dict(headers)
        parts = urlsplit(url)
        path, query = parts.path, parse_qs(parts.query)
        content_type = headers.get("Content-Type", "")
        payload = None
        filename = None
        if body and content_type.startswith("application/json"):
            payload = json.loads(body.decode("utf-8"))
        elif body and content_type.startswith("multipart/form-data"):
            m = re.search(rb'filename="([^"]+)"', body)
            filename = m.group(1).decode("utf-8") if m else None
        self.requests.append((method, path, payload))
        status, response = self._route(method, path, query, payload, filename)
        return status, (json.dumps(response).encode("utf-8") if response is not None else b"")

    # ----- routing -----

    def _route(self, method, path, query, payload, filename):
        def ok(data, status=200):
            return status, data

        def error(status, message):
            return status, {"message": message}

        if path == "/api/social-accounts" and method == "GET":
            return ok({"data": list(self.accounts.values())})
        if path == "/api/labels":
            if method == "GET":
                return ok({"data": list(self.labels.values())})
            if method == "POST":
                label = {"id": _uuid(), "name": payload["name"], "color": payload["color"]}
                self.labels[label["id"]] = label
                return ok(label, 201)
        if path == "/api/idea-stages":
            if method == "GET":
                return ok(list(self.idea_stages.values()))  # the real API returns a bare list here (probed 21 Oct 2026)
            if method == "POST":
                stage = {"id": _uuid(), "name": payload["name"], "position": len(self.idea_stages)}
                self.idea_stages[stage["id"]] = stage
                return ok(stage, 201)
        if path == "/api/ideas" and method == "GET":
            return ok(self._paginate(list(self.ideas.values()), query))
        if path == "/api/ideas" and method == "POST":
            if payload.get("idea_stage_id") is not None and payload["idea_stage_id"] not in self.idea_stages:
                return error(422, "The selected idea stage id is invalid.")  # null is valid: the idea sits in Unassigned
            idea = {"id": _uuid(), "idea_stage_id": payload.get("idea_stage_id"), "title": payload.get("title"),
                    "body": payload.get("body"), "position": self._next_position(payload.get("idea_stage_id")), "media": [],
                    "labels": self._labels_for(payload.get("label_ids", []))}
            self.ideas[idea["id"]] = idea
            return ok(idea, 201)
        m = re.fullmatch(r"/api/ideas/([^/]+)/move", path)
        if m and method == "PUT":
            idea = self.ideas.get(m.group(1))
            if idea is None:
                return error(404, "No query results for model [App\\Models\\Idea].")
            return self._move_idea(idea, payload)
        m = re.fullmatch(r"/api/ideas/([^/]+)", path)
        if m:
            idea = self.ideas.get(m.group(1))
            if idea is None:
                return error(404, "No query results for model [App\\Models\\Idea].")
            if method == "GET":
                return ok(idea)
            if method == "PUT":
                for key in ("title", "body"):
                    if key in payload:
                        idea[key] = payload[key]
                if "idea_stage_id" in payload and payload["idea_stage_id"] != idea["idea_stage_id"]:
                    self._place_idea(idea, payload["idea_stage_id"])  # the real API appends it to the end of the new stage
                if "label_ids" in payload:
                    idea["labels"] = self._labels_for(payload["label_ids"])
                return ok(idea)
            if method == "DELETE":
                del self.ideas[idea["id"]]
                return 204, None
        if path == "/api/uploads" and method == "POST":
            if filename == "reject.png":
                return error(422, "The media field must be a file of type: jpg, jpeg, png, gif, webp, mp4, mov, pdf.")
            token = _uuid()
            self.uploads[token] = filename or "file"
            return ok({"upload_token": token, "type": "document", "mime_type": "application/octet-stream", "size": 1,
                       "original_filename": filename, "url": "http://x/uploads/" + token, "expires_at": None}, 201)
        if path == "/api/posts" and method == "GET":
            posts = list(self.posts.values())
            wanted = set(query.get("labels[]", []))
            if wanted:
                posts = [p for p in posts if any(l["id"] in wanted for l in p["labels"])]
            return ok(self._paginate(posts, query))
        if path == "/api/posts" and method == "POST":
            return self._create_post(payload)
        m = re.fullmatch(r"/api/posts/([^/]+)", path)
        if m:
            post = self.posts.get(m.group(1))
            if post is None:
                return error(404, "No query results for model [App\\Models\\Post].")
            if method == "GET":
                return ok(post)
            if method == "DELETE":
                del self.posts[post["id"]]
                return 204, None
            if method == "PUT":
                return self._update_post(post, payload)
        m = re.fullmatch(r"/api/posts/([^/]+)/notes", path)
        if m:
            if m.group(1) not in self.posts:
                return error(404, "No query results for model [App\\Models\\Post].")
            if method == "GET":
                return ok({"data": self.notes.get(m.group(1), [])})
            if method == "POST":
                if self.fail_next_note:
                    self.fail_next_note = False
                    return error(500, "Server Error")
                note = {"id": _uuid(), "post_id": m.group(1), "body": payload["body"], "author": {"id": "u", "name": "The author Test"},
                        "created_at": self._iso(), "updated_at": self._iso()}
                self.notes.setdefault(m.group(1), []).append(note)
                return ok(note, 201)
        return error(404, "Not Found")

    # ----- behaviour -----

    def _iso(self) -> str:
        return self.now.isoformat()

    def _labels_for(self, ids) -> list[dict]:
        missing = [i for i in ids if i not in self.labels]
        if missing:
            raise KeyError("unknown label ids: %s" % missing)
        return [{"id": i, "name": self.labels[i]["name"]} for i in ids]

    def _echo_schedule(self, value):
        if not value:
            return None
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    def _scheduled_is_past(self, value) -> bool:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt <= self.now

    def _next_position(self, stage_id, skip=None) -> int:
        return sum(1 for i in self.ideas.values() if i["idea_stage_id"] == stage_id and i is not skip)

    def _place_idea(self, idea, stage_id) -> None:
        idea["position"] = self._next_position(stage_id, skip=idea)
        idea["idea_stage_id"] = stage_id

    def _move_idea(self, idea, payload):
        """PUT /api/ideas/{id}/move as the upstream MoveIdeaRequest defines it: idea_stage_id plus idea_ids, the full
        ordered list of the target stage with this idea in it. There is no position field; the order is the position."""
        stage_id = payload.get("idea_stage_id")
        if stage_id is not None and stage_id not in self.idea_stages:
            return 422, {"message": "The selected idea stage id is invalid."}
        ids = payload.get("idea_ids")
        if not isinstance(ids, list):
            return 422, {"message": "The idea ids field is required."}
        expected = {idea["id"]} | {i["id"] for i in self.ideas.values() if i["idea_stage_id"] == stage_id}
        if len(ids) != len(expected) or set(ids) != expected:
            return 422, {"message": "The idea order is out of date. Reload the board and try again."}
        idea["idea_stage_id"] = stage_id
        for position, id in enumerate(ids):
            self.ideas[id]["position"] = position
        return 200, idea

    def _create_post(self, payload):
        account = self.accounts.get(payload.get("social_account_id"))
        if account is None:
            return 422, {"message": "The selected social account id is invalid."}
        if payload.get("status") not in ("draft", "scheduled", "publishing"):
            return 422, {"message": "The selected status is invalid."}
        content_type = payload.get("content_type")
        if content_type and content_type.split("_")[0] != account["platform"]:
            # upstream ContentTypeMatchesPlatform: the content type must belong to the channel's platform
            return 422, {"message": 'content_type "%s" is not compatible with the %s account.' % (content_type, account["platform"])}
        if payload.get("scheduled_at") and self._scheduled_is_past(payload["scheduled_at"]):
            return 422, {"message": "The scheduled at field must be a date after now."}
        media = []
        for item in payload.get("media", []):
            token = item.get("upload_token")
            if token not in self.uploads or token in self.consumed_uploads:
                return 422, {"message": "This upload expired. Add the file again."}
            self.consumed_uploads.add(token)
            media.append({"id": _uuid(), "original_filename": self.uploads[token]})
        try:
            labels = self._labels_for(payload.get("label_ids", []))
        except KeyError:
            return 422, {"message": "The selected label ids are invalid."}
        post = {"id": _uuid(), "post_group_id": _uuid(), "status": payload["status"], "content": payload.get("content", ""),
                "scheduled_at": self._echo_schedule(payload.get("scheduled_at")), "content_type": payload.get("content_type"),
                "meta": payload.get("meta") or {}, "platform": account["platform"],
                "social_account": {"id": account["id"], "platform": account["platform"]}, "labels": labels, "media": media,
                "created_at": self._iso(), "updated_at": self._iso()}
        self.posts[post["id"]] = post
        return 201, post

    def _update_post(self, post, payload):
        if "status" in payload and payload["status"] not in ("draft", "scheduled", "publishing"):
            return 422, {"message": "The selected status is invalid."}
        if payload.get("scheduled_at") and self._scheduled_is_past(payload["scheduled_at"]):
            return 422, {"message": "The scheduled at field must be a date after now."}
        for key in ("status", "content", "content_type", "meta"):
            if key in payload:
                post[key] = payload[key]
        if "scheduled_at" in payload:
            post["scheduled_at"] = self._echo_schedule(payload["scheduled_at"])
        if "label_ids" in payload:
            try:
                post["labels"] = self._labels_for(payload["label_ids"])
            except KeyError:
                return 422, {"message": "The selected label ids are invalid."}
        post["updated_at"] = self._iso()
        return 200, post

    def _paginate(self, items, query):
        page = int(query.get("page", ["1"])[0])
        total = len(items)
        last_page = max(1, (total + PER_PAGE - 1) // PER_PAGE)
        start = (page - 1) * PER_PAGE
        return {"data": items[start:start + PER_PAGE], "links": {},
                "meta": {"current_page": page, "last_page": last_page, "per_page": PER_PAGE, "total": total}}

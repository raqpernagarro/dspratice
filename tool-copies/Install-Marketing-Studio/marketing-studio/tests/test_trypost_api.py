import tempfile
import unittest
from pathlib import Path

from scripts.lib.trypost_api import ApiError, TryPostClient, load_env
from tests.fakes import FakeTryPost


class Client(unittest.TestCase):
    def setUp(self):
        self.fake = FakeTryPost()
        self.c = TryPostClient("http://x", "tok", transport=self.fake.transport)

    def test_headers_and_json(self):
        label = self.c.post("/api/labels", json={"name": "review", "color": "#C4341A"})
        m, path, body = self.fake.requests[-1]
        self.assertEqual((m, path), ("POST", "/api/labels"))
        self.assertEqual(body["name"], "review")
        self.assertEqual(self.fake.last_headers["Authorization"], "Bearer tok")
        self.assertEqual(self.fake.last_headers["Accept"], "application/json")
        self.assertEqual(label["name"], "review")
        self.assertIn(label["id"], self.fake.labels)

    def test_pagination(self):
        for i in range(40):
            self.fake.posts[str(i)] = {"id": str(i), "status": "draft", "labels": [], "content": "", "media": []}
        self.assertEqual(len(self.c.list_all("/api/posts")), 40)

    def test_list_filters_by_label(self):
        label = self.c.post("/api/labels", json={"name": "posted", "color": "#C0E50A"})
        self.fake.posts["a"] = {"id": "a", "status": "draft", "labels": [label], "content": "", "media": []}
        self.fake.posts["b"] = {"id": "b", "status": "draft", "labels": [], "content": "", "media": []}
        self.assertEqual([p["id"] for p in self.c.list_all("/api/posts", params={"labels[]": label["id"]})], ["a"])

    def test_upload_is_multipart(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
            f.write(b"%PDF")
            f.flush()
            token = self.c.upload(Path(f.name))
        self.assertIn(token, self.fake.uploads)
        self.assertIn("multipart/form-data; boundary=", self.fake.last_headers["Content-Type"])

    def test_upload_rejection_raises(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "reject.png"
            p.write_bytes(b"png")
            with self.assertRaises(ApiError) as cm:
                self.c.upload(p)
        self.assertEqual(cm.exception.status, 422)
        self.assertIn("file of type", cm.exception.message)

    def test_api_error_carries_message(self):
        with self.assertRaises(ApiError) as cm:
            self.c.get("/api/posts/nope")
        self.assertEqual(cm.exception.status, 404)

    def test_create_post_returns_unwrapped_and_rejects_past_dates(self):
        acc = self.c.get("/api/social-accounts")["data"][0]
        post = self.c.post("/api/posts", json={"status": "draft", "content": "x", "social_account_id": acc["id"],
                                               "content_type": "linkedin_post", "scheduled_at": "2099-01-01T08:30:00+00:00"})
        self.assertEqual(post["status"], "draft")
        self.assertIn(post["id"], self.fake.posts)
        with self.assertRaises(ApiError) as cm:
            self.c.post("/api/posts", json={"status": "draft", "content": "x", "social_account_id": acc["id"],
                                            "content_type": "linkedin_post", "scheduled_at": "2000-01-01T08:30:00+00:00"})
        self.assertEqual(cm.exception.status, 422)

    def test_delete(self):
        self.fake.posts["z"] = {"id": "z", "status": "draft", "labels": [], "content": "", "media": []}
        self.assertIsNone(self.c.delete("/api/posts/z"))
        self.assertNotIn("z", self.fake.posts)

    def test_retries_after_rate_limit(self):
        calls, naps = [], []

        def transport(method, url, headers, body):
            calls.append(method)
            if len(calls) == 1:
                return 429, b'{"message": "Rate limit exceeded. Please retry after 3 seconds."}'
            return 200, b'{"id": "x"}'

        c = TryPostClient("http://x", "tok", transport=transport, sleep=naps.append)
        self.assertEqual(c.get("/api/posts/x"), {"id": "x"})
        self.assertEqual(len(calls), 2)
        self.assertEqual(naps, [4])  # the stated wait plus one second of slack

    def test_gives_up_after_five_rate_limits(self):
        naps = []
        c = TryPostClient("http://x", "tok", transport=lambda *a: (429, b'{"message": "Rate limit exceeded."}'), sleep=naps.append)
        with self.assertRaises(ApiError) as cm:
            c.get("/api/posts/x")
        self.assertEqual(cm.exception.status, 429)
        self.assertEqual(naps, [61] * 5)  # unparseable wait falls back to a minute

    def test_load_env(self):
        with tempfile.NamedTemporaryFile("w", suffix=".env", delete=False) as f:
            f.write('# c\nTRYPOST_URL=http://localhost:8000\nTRYPOST_API_KEY="abc"\n\nEMPTY=\n')
            p = f.name
        self.assertEqual(load_env(Path(p)), {"TRYPOST_URL": "http://localhost:8000", "TRYPOST_API_KEY": "abc", "EMPTY": ""})


if __name__ == "__main__":
    unittest.main()

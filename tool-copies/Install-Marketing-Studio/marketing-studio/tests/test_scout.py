import contextlib
import io
import json
import re
import shutil
import tempfile
import unittest
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

from scripts import scout as scout_cli
from scripts.lib import scout

ROOT = Path(__file__).resolve().parents[1]
FIX = Path(__file__).parent / "fixtures" / "scout"
NOW = datetime(2026, 10, 22, 9, 0, tzinfo=timezone.utc)

EM, EN = "\u2014", "\u2013"

RSS = (FIX / "feed-rss.xml").read_bytes()
ATOM = (FIX / "feed-atom.xml").read_bytes()
HN = (FIX / "hn.json").read_bytes()

FRONT_PAGE = "https://hn.algolia.com/api/v1/search?tags=front_page"
QUERY = "https://hn.algolia.com/api/v1/search_by_date?query=design%20systems&tags=story&numericFilters=points>=80"

ROUTES = {
    "https://example.com/rss.xml": RSS,
    "https://example.com/atom.xml": ATOM,
    "https://example.com/mirror.xml": RSS,
    "https://example.com/slow.xml": OSError("timed out"),
    "https://example.com/html.xml": b"<html>",
    FRONT_PAGE: HN,
    QUERY: HN,
}

KEYWORDS = {
    1: ["agent", "agents", "context", "mcp", "agentic"],
    2: ["roi", "operations", "logistics", "decisions", "productivity", "business case"],
    3: ["design system", "design systems", "tokens", "design ops", "governance"],
    4: ["hiring", "culture", "team", "craft", "care", "leadership"],
}

SOURCES = {
    "feeds": [
        {"name": "Fixture Design Feed", "url": "https://example.com/rss.xml"},
        {"name": "Fixture Atom Feed", "url": "https://example.com/atom.xml"},
        {"name": "Mirror Feed", "url": "https://example.com/mirror.xml"},
        {"name": "Slow Feed", "url": "https://example.com/slow.xml"},
        {"name": "Html Feed", "url": "https://example.com/html.xml"},
    ],
    "hacker_news": {"min_points": 80, "queries": ["design systems"]},
    "keywords": KEYWORDS,
}


class Fetcher:
    """A fetcher that maps a URL to bytes, or raises when the route holds an exception."""

    def __init__(self, routes):
        self.routes = routes
        self.calls = []

    def __call__(self, url):
        self.calls.append(url)
        if url not in self.routes:
            raise OSError("no route for %s" % url)
        value = self.routes[url]
        if isinstance(value, Exception):
            raise value
        return value


def sources_md(sources):
    lines = ["# Sources", "", "## Feeds", ""]
    lines += ["- %s | %s" % (feed["name"], feed["url"]) for feed in sources["feeds"]]
    hn = sources["hacker_news"]
    lines += ["", "## Hacker News", "", "- min_points: %d" % hn["min_points"], "- queries: %s" % ", ".join(hn["queries"])]
    lines += ["", "## Keywords", ""]
    lines += ["- pillar %d: %s" % (pillar, ", ".join(words)) for pillar, words in sorted(sources["keywords"].items())]
    return "\n".join(lines) + "\n"


def hn_hit(object_id, title, url, created_at, points=200):
    return {"objectID": object_id, "title": title, "url": url, "points": points, "created_at": created_at}


def hn_json(*hits):
    return json.dumps({"hits": list(hits)}).encode("utf-8")


def only(feeds, queries=()):
    return {"feeds": feeds, "hacker_news": {"min_points": 80, "queries": list(queries)}, "keywords": KEYWORDS}


def rss(*items):
    return ("<rss version=\"2.0\"><channel><title>T</title>%s</channel></rss>" % "".join(items)).encode("utf-8")


class ParseFeed(unittest.TestCase):
    def test_parse_rss_and_atom(self):
        self.assertEqual(scout.parse_feed(RSS.decode("utf-8"), "Fixture Design Feed"), [
            {
                "title": "Design systems that agents can read %s a field note" % EM,
                "url": "https://example.com/design-systems-agents",
                "source": "Fixture Design Feed",
                "published": "2026-10-21T08:30:00+00:00",
                "summary": "Agents are users too: a design system with clear tokens gives them one truth. Second paragraph.",
            },
            {
                "title": "Hiring for craft in a small team",
                "url": "https://example.com/hiring-craft",
                "source": "Fixture Design Feed",
                "published": "2026-10-14T09:00:00+00:00",
                "summary": "Care and craft decide who joins. Culture follows.",
            },
        ])
        self.assertEqual(scout.parse_feed(ATOM.decode("utf-8"), "Fixture Atom Feed"), [
            {
                "title": "Governance for design ops %s a short guide" % EN,
                "url": "https://example.com/design-ops-governance",
                "source": "Fixture Atom Feed",
                "published": "2026-10-20T16:00:00+01:00",
                "summary": "Design ops needs governance and tokens that teams can trust.",
            },
        ])

    def test_summary_is_cut_to_300_characters(self):
        long = "<p>" + "a" * 400 + "</p>"
        item = "<item><title>T</title><link>https://example.com/t</link><pubDate>Wed, 21 Oct 2026 08:30:00 GMT</pubDate><description><![CDATA[%s]]></description></item>" % long
        (signal,) = scout.parse_feed(rss(item).decode("utf-8"), "S")
        self.assertEqual(signal["summary"], "a" * 300)

    def test_undated_item_has_no_published_and_an_item_without_a_link_is_skipped(self):
        items = (
            "<item><title>No date</title><link>https://example.com/no-date</link></item>"
            "<item><title>Bad date</title><link>https://example.com/bad-date</link><pubDate>last Tuesday</pubDate></item>"
            "<item><title>No link</title><pubDate>Wed, 21 Oct 2026 08:30:00 GMT</pubDate></item>"
            "<item><title>Odd link</title><link>javascript:alert(1)</link><pubDate>Wed, 21 Oct 2026 08:30:00 GMT</pubDate></item>"
        )
        signals = scout.parse_feed(rss(items).decode("utf-8"), "S")
        self.assertEqual([(s["title"], s["published"]) for s in signals], [("No date", None), ("Bad date", None)])

    def test_titles_are_decoded_and_collapsed_but_keep_their_tags(self):
        items = (
            "<item><title>  &lt;dialog&gt; is   here &amp;amp; now\n</title><link>https://example.com/dialog</link><pubDate>Wed, 21 Oct 2026 08:30:00 GMT</pubDate></item>"
            "<item><title><![CDATA[Why <code>tokens</code> matter]]></title><link>https://example.com/code</link><pubDate>Wed, 21 Oct 2026 08:30:00 GMT</pubDate></item>"
        )
        signals = scout.parse_feed(rss(items).decode("utf-8"), "S")
        self.assertEqual([s["title"] for s in signals], ["<dialog> is here & now", "Why <code>tokens</code> matter"])

    def test_not_a_feed_raises(self):
        for text in ("<html>", "<html><body>Hello</body></html>", "", "not xml at all"):
            with self.assertRaises(ValueError, msg=text):
                scout.parse_feed(text, "S")

    def test_entity_declarations_are_refused(self):
        text = '<?xml version="1.0"?><!DOCTYPE rss [<!ENTITY a "aaaa">]><rss><channel><item><title>&a;</title></item></channel></rss>'
        with self.assertRaises(ValueError):
            scout.parse_feed(text, "S")

    def test_dates(self):
        cases = {
            "Wed, 21 Oct 2026 08:30:00 GMT": "2026-10-21T08:30:00+00:00",
            "Wed, 21 Oct 2026 08:30:00 -0300": "2026-10-21T08:30:00-03:00",
            "2026-10-21T08:30:00Z": "2026-10-21T08:30:00+00:00",
            "2026-10-21T08:30:00.1234Z": "2026-10-21T08:30:00+00:00",
            "2026-10-21T08:30:00+0100": "2026-10-21T08:30:00+01:00",
            "2026-10-21T08:30:00": "2026-10-21T08:30:00+00:00",
            "2026-10-21": "2026-10-21T00:00:00+00:00",
            "last Tuesday": None,
            "": None,
            None: None,
        }
        for text, expected in cases.items():
            self.assertEqual(scout.parse_date(text), expected, text)


class ParseHn(unittest.TestCase):
    def test_parse_hn(self):
        data = json.loads(HN.decode("utf-8"))
        self.assertEqual(scout.parse_hn(data), [
            {
                "title": "Show HN: Agents that read your design system",
                "url": "https://example.com/hn-agents-design-system",
                "source": "Hacker News",
                "published": "2026-10-21T10:00:00+00:00",
                "summary": "",
                "points": 120,
            },
            {
                "title": "Ask HN: How do you hire for craft?",
                "url": "https://news.ycombinator.com/item?id=45000002",
                "source": "Hacker News",
                "published": "2026-10-21T07:12:03+00:00",
                "summary": "We are hiring a team and care about craft.",
                "points": 45,
            },
        ])
        self.assertEqual(scout.parse_hn(data, source="Hacker News: ai agents")[0]["source"], "Hacker News: ai agents")

    def test_a_title_keeps_its_tags_and_loses_its_entities(self):
        data = {"hits": [{"objectID": "9", "title": "The  &lt;dialog&gt; element\n&amp; you", "url": None}]}
        self.assertEqual(scout.parse_hn(data)[0]["title"], "The <dialog> element & you")

    def test_hits_without_a_title_or_any_link_are_skipped(self):
        data = {"hits": [{"objectID": "1", "title": None, "url": "https://example.com/a"}, {"title": "No id, no url"}]}
        self.assertEqual(scout.parse_hn(data), [])
        self.assertEqual(scout.parse_hn({}), [])


class MatchPillars(unittest.TestCase):
    def test_whole_words_case_insensitive_in_title_and_summary(self):
        signal = {"title": "Agents everywhere", "summary": "A design system for the TEAM"}
        self.assertEqual(scout.match_pillars(signal, KEYWORDS), [1, 3, 4])

    def test_a_keyword_inside_a_longer_word_does_not_match(self):
        signal = {"title": "Reagents and teamwork in a mcpx world", "summary": "Careful, decisional work"}
        self.assertEqual(scout.match_pillars(signal, KEYWORDS), [])

    def test_multi_word_keywords_match_as_phrases(self):
        self.assertEqual(scout.match_pillars({"title": "The business   case for it", "summary": ""}, KEYWORDS), [2])
        self.assertEqual(scout.match_pillars({"title": "A business plan and a case", "summary": ""}, KEYWORDS), [])

    def test_blank_keywords_never_match(self):
        self.assertEqual(scout.match_pillars({"title": "Anything", "summary": ""}, {1: ["", "  "]}), [])


class Scout(unittest.TestCase):
    def test_scout_filters_and_reports(self):
        fetch = Fetcher(ROUTES)
        signals, failures = scout.scout(SOURCES, fetch, NOW)
        # every source is fetched once, in order: the feeds, the front page, one search per query
        self.assertEqual(fetch.calls, [feed["url"] for feed in SOURCES["feeds"]] + [FRONT_PAGE, QUERY])
        # newest first; the eight day old item, the 45 point hit and the duplicates by URL are gone
        self.assertEqual([s["title"] for s in signals], [
            "Show HN: Agents that read your design system",
            "Design systems that agents can read %s a field note" % EM,
            "Governance for design ops %s a short guide" % EN,
        ])
        self.assertEqual([s["source"] for s in signals], ["Hacker News front page", "Fixture Design Feed", "Fixture Atom Feed"])
        self.assertEqual([s["published"] for s in signals], ["2026-10-21T10:00:00+00:00", "2026-10-21T08:30:00+00:00", "2026-10-20T16:00:00+01:00"])
        self.assertEqual(signals[0]["points"], 120)
        # a failed source is reported by name with its reason
        self.assertEqual(failures, ["Slow Feed: timed out", "Html Feed: not an RSS or Atom feed"])
        # pillars and the words that matched them
        self.assertEqual([s["pillars"] for s in signals], [[1, 3], [1, 3], [3]])
        self.assertEqual(signals[0]["matched"], ["agents", "design system"])
        self.assertEqual(signals[1]["matched"], ["agents", "design system", "design systems", "tokens"])
        self.assertEqual(signals[2]["matched"], ["tokens", "design ops", "governance"])

    def test_max_age_days_decides_what_is_too_old(self):
        signals, _ = scout.scout(SOURCES, Fetcher(ROUTES), NOW, max_age_days=10)
        self.assertEqual([s["url"] for s in signals], [
            "https://example.com/hn-agents-design-system",
            "https://example.com/design-systems-agents",
            "https://example.com/design-ops-governance",
            "https://example.com/hiring-craft",
        ])
        self.assertEqual(signals[3]["pillars"], [4])
        self.assertEqual(signals[3]["matched"], ["hiring", "culture", "team", "craft", "care"])

    def test_a_feed_copy_beats_a_hacker_news_copy_whatever_the_dates(self):
        feed = [{"name": "Fixture Design Feed", "url": "https://example.com/rss.xml"}]
        # posted to Hacker News after the article was published, and before it
        for posted in ("2026-10-22T07:00:00Z", "2026-10-20T07:00:00Z"):
            hit = hn_hit("1", "Resubmitted: design systems agents can read", "https://example.com/design-systems-agents", posted)
            signals, failures = scout.scout(only(feed), Fetcher({"https://example.com/rss.xml": RSS, FRONT_PAGE: hn_json(hit)}), NOW)
            self.assertEqual(failures, [])
            self.assertEqual([(s["source"], s["published"], s["title"]) for s in signals], [
                ("Fixture Design Feed", "2026-10-21T08:30:00+00:00", "Design systems that agents can read %s a field note" % EM),
            ], posted)

    def test_an_old_article_resubmitted_to_hacker_news_stays_old(self):
        feed = [{"name": "Fixture Design Feed", "url": "https://example.com/rss.xml"}]
        hit = hn_hit("2", "Hiring for craft, again", "https://example.com/hiring-craft", "2026-10-21T10:00:00Z")
        signals, _ = scout.scout(only(feed), Fetcher({"https://example.com/rss.xml": RSS, FRONT_PAGE: hn_json(hit)}), NOW)
        # the article is eight days old by its feed date, so neither copy is shown
        self.assertEqual([s["url"] for s in signals], ["https://example.com/design-systems-agents"])

    def test_among_copies_of_the_same_kind_the_newest_wins(self):
        def item(title, link, date):
            return "<item><title>%s</title><link>%s</link><pubDate>%s</pubDate></item>" % (title, link, date)
        routes = {
            "https://example.com/older.xml": rss(item("Older copy", "https://example.com/dup", "Tue, 20 Oct 2026 08:00:00 GMT")),
            "https://example.com/newer.xml": rss(item("Newer copy", "https://example.com/dup", "Wed, 21 Oct 2026 08:00:00 GMT")),
            FRONT_PAGE: hn_json(hn_hit("3", "Older HN copy", "https://example.com/dup-hn", "2026-10-20T10:00:00Z")),
            QUERY: hn_json(hn_hit("4", "Newer HN copy", "https://example.com/dup-hn", "2026-10-21T10:00:00Z")),
        }
        sources = only([{"name": "Older Feed", "url": "https://example.com/older.xml"}, {"name": "Newer Feed", "url": "https://example.com/newer.xml"}], queries=["design systems"])
        signals, failures = scout.scout(sources, Fetcher(routes), NOW)
        self.assertEqual(failures, [])
        self.assertEqual([(s["title"], s["source"]) for s in signals], [
            ("Newer HN copy", "Hacker News: design systems"),
            ("Newer copy", "Newer Feed"),
        ])

    def test_undated_items_are_dropped_and_counted(self):
        undated = rss(
            "<item><title>A</title><link>https://example.com/a</link></item>"
            "<item><title>B</title><link>https://example.com/b</link><pubDate>soon</pubDate></item>"
            "<item><title>C</title><link>https://example.com/c</link><pubDate>Wed, 21 Oct 2026 08:30:00 GMT</pubDate></item>"
        )
        sources = {"feeds": [{"name": "Loose Feed", "url": "https://example.com/loose.xml"}], "hacker_news": {"min_points": 80, "queries": []}, "keywords": KEYWORDS}
        signals, failures = scout.scout(sources, Fetcher({"https://example.com/loose.xml": undated, FRONT_PAGE: HN}), NOW)
        self.assertEqual([s["title"] for s in signals], ["Show HN: Agents that read your design system", "C"])
        self.assertEqual(failures, ["Loose Feed: 2 undated items dropped"])
        self.assertEqual(scout.failed_count(failures), 0)

    def test_every_kind_of_failure_is_a_line_not_an_exception(self):
        routes = {
            "https://example.com/gone.xml": urllib.error.HTTPError("https://example.com/gone.xml", 404, "Not Found", {}, None),
            "https://example.com/dns.xml": urllib.error.URLError(OSError("name not known")),
            "https://example.com/odd.xml": RuntimeError("boom"),
            "https://example.com/binary.xml": b"\xff\xfe\x00 not a feed",
            FRONT_PAGE: b"<html>",
        }
        sources = {
            "feeds": [{"name": name, "url": "https://example.com/%s.xml" % name} for name in ("gone", "dns", "odd", "binary")],
            "hacker_news": {"min_points": 80, "queries": []},
            "keywords": KEYWORDS,
        }
        signals, failures = scout.scout(sources, Fetcher(routes), NOW)
        self.assertEqual(signals, [])
        self.assertEqual(failures, [
            "gone: HTTP 404",
            "dns: name not known",
            "odd: boom",
            "binary: not an RSS or Atom feed",
            "Hacker News front page: not a Hacker News response",
        ])
        self.assertEqual(scout.failed_count(failures), 5)

    def test_source_count(self):
        self.assertEqual(scout.source_count(SOURCES), 7)

    def test_default_fetch_sends_the_user_agent_and_a_timeout(self):
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = b"<rss/>"
        with mock.patch("urllib.request.urlopen", return_value=response) as urlopen:
            self.assertEqual(scout.fetch_url("https://example.com/feed.xml"), b"<rss/>")
        request = urlopen.call_args[0][0]
        self.assertEqual(request.full_url, "https://example.com/feed.xml")
        self.assertEqual(request.get_header("User-agent"), "Marketing-Studio scout")
        self.assertEqual(urlopen.call_args[1]["timeout"], 10)

    def test_default_fetch_refuses_anything_but_http(self):
        with self.assertRaises(ValueError):
            scout.fetch_url("file:///etc/hosts")


class Markdown(unittest.TestCase):
    def test_markdown(self):
        signals, failures = scout.scout(SOURCES, Fetcher(ROUTES), NOW)
        text = scout.signals_markdown(signals, failures, NOW)
        self.assertEqual(text, "\n".join([
            "# Signals, as of 22/10/2026",
            "",
            "Hacker News dates are posting dates, not publication dates.",
            "",
            "| Published | Source | Title | Pillars | Why it matters |",
            "|---|---|---|---|---|",
            "| 21/10/2026 | Hacker News front page | [Show HN: Agents that read your design system](https://example.com/hn-agents-design-system) | 1, 3 | agents, design system |",
            "| 21/10/2026 | Fixture Design Feed | [Design systems that agents can read, a field note](https://example.com/design-systems-agents) | 1, 3 | agents, design system, design systems, tokens |",
            "| 20/10/2026 | Fixture Atom Feed | [Governance for design ops, a short guide](https://example.com/design-ops-governance) | 3 | tokens, design ops, governance |",
            "",
            "## Failed sources",
            "",
            "- Slow Feed: timed out",
            "- Html Feed: not an RSS or Atom feed",
            "",
        ]))

    def test_no_dash_survives_and_the_table_holds(self):
        signal = {
            "title": "A | B [x] %s 2020%s2026 %s" % (EM, EN, EN),
            "url": "https://example.com/a(b)%sc" % EM,
            "source": "S | T",
            "published": "2026-10-21T23:30:00+00:00",
            "pillars": [],
            "matched": [],
        }
        text = scout.signals_markdown([signal], ["Feed: down %s try later" % EM], NOW)
        self.assertNotIn(EM, text)
        self.assertNotIn(EN, text)
        self.assertIn("| 22/10/2026 | S \\| T | [A \\| B \\[x\\], 2020-2026](https://example.com/a%28b%29%E2%80%94c) |  |  |", text)
        self.assertIn("- Feed: down, try later", text)

    def test_a_literal_tag_in_a_title_is_escaped_so_the_page_still_shows_it(self):
        signal = {"title": "The <dialog> element", "url": "https://example.com/d", "source": "S", "published": "2026-10-21T08:00:00+00:00", "pillars": [], "matched": []}
        self.assertIn("[The \\<dialog> element](https://example.com/d)", scout.signals_markdown([signal], [], NOW))

    def test_nothing_failed_and_nothing_found(self):
        text = scout.signals_markdown([], [], NOW)
        self.assertEqual(text.splitlines()[:3], ["# Signals, as of 22/10/2026", "", "Hacker News dates are posting dates, not publication dates."])
        self.assertIn("| Published | Source | Title | Pillars | Why it matters |", text)
        self.assertTrue(text.endswith("## Failed sources\n\nNone.\n"))

    def test_filename_uses_the_lisbon_date(self):
        self.assertEqual(scout.signals_filename(NOW), "signals-2026-10-22.md")
        self.assertEqual(scout.signals_filename(datetime(2026, 12, 31, 23, 30, tzinfo=timezone.utc)), "signals-2026-12-31.md")
        self.assertEqual(scout.signals_filename(datetime(2026, 7, 31, 23, 30, tzinfo=timezone.utc)), "signals-2026-08-01.md")


class SourcesFile(unittest.TestCase):
    def test_load_sources_from_text(self):
        tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp)
        path = tmp / "sources.md"
        path.write_text(sources_md(SOURCES) + "\n## Notes\n\n- ignored: this list belongs to no section\n", encoding="utf-8")
        loaded = scout.load_sources(path)
        self.assertEqual(loaded["feeds"], SOURCES["feeds"])
        self.assertEqual(loaded["hacker_news"], {"min_points": 80, "queries": ["design systems"]})
        self.assertEqual(loaded["keywords"], KEYWORDS)

    def test_a_malformed_feed_line_is_refused(self):
        tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp)
        for line in ("- Just a name", "- Name | ftp://example.com/feed", "- | https://example.com/feed"):
            path = tmp / "sources.md"
            path.write_text("## Feeds\n\n%s\n" % line, encoding="utf-8")
            with self.assertRaises(ValueError, msg=line):
                scout.load_sources(path)

    def test_a_missing_section_falls_back_to_defaults(self):
        tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp)
        path = tmp / "sources.md"
        path.write_text("## Feeds\n\n- A | https://example.com/a.xml\n", encoding="utf-8")
        loaded = scout.load_sources(path)
        self.assertEqual(loaded["hacker_news"], {"min_points": 50, "queries": []})
        self.assertEqual(loaded["keywords"], {})

    def test_markdown_and_sources_file(self):
        """The workspace's own sources.md parses: every feed has a name and an https URL, and pillars are numbered."""
        path = ROOT / "brands" / "me" / "sources.md"
        loaded = scout.load_sources(path)
        self.assertGreaterEqual(len(loaded["feeds"]), 1)
        self.assertTrue(all(feed["name"] and feed["url"].startswith("https://") for feed in loaded["feeds"]))
        self.assertIsInstance(loaded["hacker_news"]["min_points"], int)
        self.assertTrue(all(isinstance(pillar, int) for pillar in loaded["keywords"]))
        self.assertNotIn(EM, path.read_text(encoding="utf-8"))
        self.assertNotIn(EN, path.read_text(encoding="utf-8"))


class Cli(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.ws = self.tmp / "hugo"
        self.ws.mkdir()

    def run_main(self, routes, *extra):
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(scout, "fetch_url", Fetcher(routes)), contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = scout_cli.main(["--workspace", str(self.ws), *extra])
        return code, out.getvalue(), err.getvalue()

    def test_run_writes_the_signals_file(self):
        (self.ws / "sources.md").write_text(sources_md(SOURCES), encoding="utf-8")
        path, count, total, failed = scout_cli.run(self.ws, 7, fetch=Fetcher(ROUTES), now=NOW)
        self.assertEqual(path, self.ws / "research" / "signals-2026-10-22.md")
        self.assertEqual((count, total, failed), (3, 7, 2))
        text = path.read_text(encoding="utf-8")
        self.assertTrue(text.startswith("# Signals, as of 22/10/2026\n"))
        self.assertIn("- Slow Feed: timed out", text)

    def test_main_prints_one_line_and_exits_zero_when_some_sources_failed(self):
        (self.ws / "sources.md").write_text(sources_md(SOURCES), encoding="utf-8")
        # a wide window keeps the fixture dates in range whatever day the suite runs
        code, out, err = self.run_main(ROUTES, "--max-age", "100000")
        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        pattern = r"signals %s/research/signals-\d{4}-\d{2}-\d{2}\.md 4 signals from 7 sources \(2 failed\)\n" % re.escape(str(self.ws))
        self.assertRegex(out, "^" + pattern + "$")
        (written,) = (self.ws / "research").glob("signals-*.md")
        self.assertIn("Hiring for craft in a small team", written.read_text(encoding="utf-8"))

    def test_main_exits_one_when_every_source_failed(self):
        sources = {"feeds": [{"name": "Slow Feed", "url": "https://example.com/slow.xml"}], "hacker_news": {"min_points": 80, "queries": ["ai agents"]}, "keywords": KEYWORDS}
        (self.ws / "sources.md").write_text(sources_md(sources), encoding="utf-8")
        code, out, err = self.run_main({})
        self.assertEqual(code, 1)
        self.assertRegex(out, r"^signals \S+ 0 signals from 3 sources \(3 failed\)\n$")
        (written,) = (self.ws / "research").glob("signals-*.md")
        self.assertIn("- Slow Feed: no route for https://example.com/slow.xml", written.read_text(encoding="utf-8"))

    def test_main_without_a_sources_file_exits_two(self):
        code, out, err = self.run_main(ROUTES)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("sources.md", err)


if __name__ == "__main__":
    unittest.main()

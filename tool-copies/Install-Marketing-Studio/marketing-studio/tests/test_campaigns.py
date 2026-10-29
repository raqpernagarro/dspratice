import tempfile
import unittest
from pathlib import Path

from scripts.lib import campaigns

FILE = "---\nslug: ds\nmode: nagarro\nneutral: false\nrequired_hashtags_linkedin: [\"#FluidicIntelligence\"]\n---\nWeek 1: the problem.\n"


class Campaigns(unittest.TestCase):
    def setUp(self):
        self.ws = Path(tempfile.mkdtemp())
        (self.ws / "campaigns").mkdir()
        (self.ws / "campaigns" / "ds.md").write_text(FILE)

    def test_load_and_required(self):
        c = campaigns.load(self.ws, "ds")
        self.assertEqual(c["slug"], "ds")
        self.assertEqual(c["brief"], "Week 1: the problem.\n")
        self.assertEqual(campaigns.required_hashtags(c, "linkedin"), ["#FluidicIntelligence"])
        self.assertEqual(campaigns.required_hashtags(c, "x"), [])
        self.assertFalse(campaigns.is_neutral(c))
        self.assertFalse(campaigns.is_neutral(None))
        self.assertEqual(campaigns.list_slugs(self.ws), ["ds"])

    def test_unknown_campaign(self):
        with self.assertRaises(FileNotFoundError):
            campaigns.load(self.ws, "nope")

    def test_real_workspace_campaigns_load(self):
        ws = Path(__file__).resolve().parents[1] / "brands" / "me"
        self.assertTrue(campaigns.is_neutral(campaigns.load(ws, "example-neutral")))

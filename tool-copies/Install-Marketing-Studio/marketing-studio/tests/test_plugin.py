# tests/test_plugin.py
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "marketeer"
SKILLS = ["marketeer-context", "ideation", "write-social-post", "score", "brand-review", "edit", "repurpose", "write-video-script", "research", "write-longform", "content-planner", "run"]
REFERENCES = [
    "ai-tells.md", "hooks.md", "surfaces/linkedin.md", "surfaces/instagram.md", "surfaces/x.md",
    "seven-sweeps.md", "compliance.md", "repurposing-matrix.md", "longform.md", "reels.md", "surfaces/substack.md",
    "planning.md", "idea-scoring.md", "learning.md", "sources.md", "surfaces/viva-engage.md",
]
SECTIONS = ["## Inputs", "## Steps", "## Outputs", "## Rules", "## Boundaries", "## Related"]


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    return dict(line.split(":", 1) for line in m.group(1).splitlines() if ":" in line) if m else {}


class Manifest(unittest.TestCase):
    def test_plugin_manifest(self):
        data = json.loads((PLUGIN / ".claude-plugin" / "plugin.json").read_text())
        self.assertEqual(data["name"], "marketeer")

    def test_marketplace_lists_the_plugin(self):
        data = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text())
        self.assertEqual(data["name"], "marketing-studio")
        self.assertEqual([p["source"] for p in data["plugins"] if p["name"] == "marketeer"], ["./marketeer"])

    def test_project_settings_enable_it(self):
        data = json.loads((ROOT / ".claude" / "settings.json").read_text())
        self.assertTrue(data["enabledPlugins"]["marketeer@marketing-studio"])
        self.assertEqual(data["extraKnownMarketplaces"]["marketing-studio"]["source"], {"source": "directory", "path": "."})


class Skills(unittest.TestCase):
    def test_each_skill_is_well_formed(self):
        for name in SKILLS:
            text = (PLUGIN / "skills" / name / "SKILL.md").read_text(encoding="utf-8")
            meta = frontmatter(text)
            self.assertEqual(meta.get("name", "").strip(), name)
            self.assertGreater(len(meta.get("description", "").strip()), 40, name)
            self.assertLessEqual(len(meta.get("description", "").strip()), 1024, name)
            for section in SECTIONS:
                self.assertIn(section, text, "%s lacks %s" % (name, section))
            self.assertLess(len(text.splitlines()), 500, name)
            self.assertNotRegex(text, "[\u2014\u2013]", name)

    def test_each_reference_exists_without_dashes(self):
        for name in REFERENCES:
            text = (PLUGIN / "references" / name).read_text(encoding="utf-8")
            self.assertTrue(text.startswith("# "), name)
            self.assertNotRegex(text, "[\u2014\u2013]", name)

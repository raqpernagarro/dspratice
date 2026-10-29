import unittest
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[1] / "brands" / "me"


class WorkspaceSeed(unittest.TestCase):
    def test_files_exist(self):
        for name in ["brand-profile.md", "voice.md", "content-rules.md", "nagarro-overlay.md", "kit.md", "playbook.md", "sources.md"]:
            self.assertTrue((WORKSPACE / name).exists(), name)

    def test_required_sections(self):
        expect = {
            "brand-profile.md": ["## Audience sentence", "## Audiences", "## Pillars", "## Proof points"],
            "voice.md": ["## Voice card", "## I never say"],
            "content-rules.md": ["## Hashtags", "## Banned", "## Links"],
            "nagarro-overlay.md": ["## Tagging", "## Approved claims"],
        }
        for name, needles in expect.items():
            text = (WORKSPACE / name).read_text()
            for n in needles:
                self.assertIn(n, text, f"{name} lacks {n!r}")

    def test_no_dashes(self):
        for p in WORKSPACE.glob("*.md"):
            self.assertNotRegex(p.read_text(), "[\u2014\u2013]", p.name)


if __name__ == "__main__":
    unittest.main()

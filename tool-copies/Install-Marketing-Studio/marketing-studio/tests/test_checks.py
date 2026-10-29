import unittest
from pathlib import Path

from evals.lib import checks

X = "x" * 10
SWIPE = Path(__file__).resolve().parents[1] / "brands" / "me" / "swipe"
# The RMS proof point, copied verbatim from brands/me/brand-profile.md without its Source.
RMS = ("RMS Design System (Nagarro project, from January 2020): five fully functional products built in one year, "
       "30% of designers' prototyping time saved, about 50,000 dollars saved per release cycle on UI bug clean-up.")


class Dashes(unittest.TestCase):
    def test_both_dashes_with_line_numbers(self):
        self.assertEqual(checks.find_dashes("a \u2014 b"), ["em dash on line 1"])
        self.assertEqual(checks.find_dashes("a\n0\u20133"), ["en dash on line 2"])
        self.assertEqual(checks.find_dashes("0 to 3, a hyphen-word"), [])


class Words(unittest.TestCase):
    def test_banned_words_whole_word_any_case(self):
        self.assertCountEqual(checks.find_banned_words("We Leverage a robust, game-changing landscape."),
                              ["banned word: 'leverage'", "banned word: 'robust'", "banned word: 'game-changing'", "banned word: 'landscape'"])
        self.assertEqual(checks.find_banned_words("We leveraged the data."), [])
        self.assertEqual(checks.find_banned_words("three screens deep"), ["banned word: 'screens'"])
        self.assertEqual(checks.find_banned_words("a screen reader"), [])
        self.assertEqual(checks.find_banned_words("Excited to announce a thing"), ["banned word: 'excited to announce'"])

    def test_a_quoted_name_and_a_url_are_not_hits(self):
        self.assertEqual(checks.find_banned_words('Sources: Hugo Fran\u00e7a, "LinkedIn Leverage Toolkit", 2026.'), [])
        self.assertEqual(checks.find_banned_words("Sources: Hugo Fran\u00e7a, \u201cLinkedIn Leverage Toolkit\u201d, 2026."), [])
        self.assertEqual(checks.find_banned_words("We leverage the toolkit."), ["banned word: 'leverage'"])
        self.assertEqual(checks.find_banned_words('The "toolkit" helps us leverage it.'), ["banned word: 'leverage'"])
        self.assertEqual(checks.find_banned_words("Read https://example.com/robust-design first."), [])

    def test_inch_marks_and_long_spans_hide_nothing(self):
        self.assertEqual(checks.find_banned_words('A 5" phone and a 6" tablet leverage one layout.'), ["banned word: 'leverage'"])
        self.assertEqual(checks.find_banned_words('A 5" phone, "a tablet" and we leverage both.'), ["banned word: 'leverage'"])
        long_span = '"' + 'word ' * 20 + 'and we leverage it"'
        self.assertEqual(checks.find_banned_words(long_span), ["banned word: 'leverage'"])
        self.assertEqual(checks.find_banned_words('He called it "the leverage play".'), [])
        self.assertEqual(checks.find_banned_words('("LinkedIn Leverage Toolkit")'), [])

    def test_patterns(self):
        self.assertEqual(checks.find_banned_patterns("It's not an AI problem, it's a context problem."), ["pattern: it's not X, it's Y"])
        self.assertEqual(checks.find_banned_patterns("It isn't a tooling problem, it is a context problem."), ["pattern: it's not X, it's Y"])
        self.assertEqual(checks.find_banned_patterns("That is the real QA problem: not catching errors, but noticing decisions nobody made."), [])
        self.assertEqual(checks.find_banned_patterns("Here's the thing."), ["pattern: here's the thing"])
        self.assertEqual(checks.find_banned_patterns("Let's dive in."), ["pattern: let's dive in"])
        self.assertEqual(checks.find_banned_patterns("It's important to note that studies show gains."), ["pattern: hedge 'it's important to note'", "pattern: vague claim 'studies show'"])
        self.assertEqual(checks.find_banned_patterns("Body.\n\nThoughts?\n"), ["pattern: closer 'Thoughts?'"])
        self.assertEqual(checks.find_banned_patterns("Agree?"), ["pattern: closer 'Agree?'"])
        self.assertEqual(checks.find_banned_patterns("Thoughts? Here is mine.\n\nWhich rule does your team skip?"), [])

    def test_curly_quotes_match_like_straight_ones(self):
        self.assertEqual(checks.find_banned_patterns("It\u2019s not an AI problem, it\u2019s a context problem. Here\u2019s the thing. Let\u2019s dive in."),
                         ["pattern: it's not X, it's Y", "pattern: here's the thing", "pattern: let's dive in"])
        self.assertEqual(checks.find_giveaways("Comment guide and I\u2019ll send it"), ["comment-gated giveaway"])
        self.assertEqual(checks.find_giveaways("Comment \u201ckit\u201d for the PDF"), ["comment-gated giveaway"])

    def test_closer_before_a_hashtag_block(self):
        self.assertEqual(checks.find_banned_patterns("Body.\n\nThoughts?\n\n#A #B"), ["pattern: closer 'Thoughts?'"])
        self.assertEqual(checks.find_banned_patterns("Body.\n\nAgree?\n#A\n#B"), ["pattern: closer 'Agree?'"])
        self.assertEqual(checks.find_banned_patterns("Thoughts? Here is mine.\n\n#A #B"), [])
        self.assertEqual(checks.find_banned_patterns("Thoughts?\n\nMore body.\n\n#A"), [])

    def test_giveaways(self):
        for text in ["Comment GUIDE and I'll send it to you.", "Comment 'kit' and I will DM you the PDF.", "comment YES to get the template"]:
            self.assertEqual(checks.find_giveaways(text), ["comment-gated giveaway"], text)
        self.assertEqual(checks.find_giveaways("Comment below with the rule your team skips most."), [])


class Links(unittest.TestCase):
    def test_links(self):
        self.assertEqual(checks.find_links("Link in the comments."), [])
        self.assertEqual(checks.find_links("Read it at https://www.nagarro.com/en/blog/x today"), ["link in body: https://www.nagarro.com/en/blog/x"])
        self.assertEqual(checks.find_links("see www.example.org"), ["link in body: www.example.org"])
        self.assertEqual(checks.find_links("see nagarro.com/en/blog/x"), ["link in body: nagarro.com/en/blog/x"])
        self.assertEqual(checks.find_links("e.g. this, and tokens.json, and v2.1"), [])


class Hashtags(unittest.TestCase):
    def test_caps_per_network(self):
        self.assertEqual(checks.check_hashtags("linkedin", "Body.\n\n#A #B #C"), [])
        self.assertEqual(checks.check_hashtags("linkedin", "Body.\n\n#A #B #C #D"), ["4 hashtags on linkedin, the cap is 3"])
        self.assertEqual(checks.check_hashtags("instagram", "Body.\n\n#A #B #C #D #E #F"), ["6 hashtags on instagram, the cap is 5"])
        self.assertEqual(checks.check_hashtags("x", "Body.\n\n#A #B"), ["2 hashtags on x, the cap is 1"])
        self.assertEqual(checks.check_hashtags("x", "Body with no tags."), [])

    def test_required_tag_is_outside_the_cap_and_must_be_present(self):
        body = "Body.\n\n#FluidicIntelligence #A #B #C"
        self.assertEqual(checks.check_hashtags("linkedin", body, required=["#FluidicIntelligence"]), [])
        self.assertEqual(checks.check_hashtags("linkedin", "Body.\n\n#fluidicintelligence #A"), [])
        self.assertEqual(checks.check_hashtags("linkedin", "Body.\n\n#A", required=["#FluidicIntelligence"]), ["missing required hashtag #FluidicIntelligence"])

    def test_hashtag_inside_the_text(self):
        self.assertEqual(checks.check_hashtags("linkedin", "the #design community agrees.\n\n#A"), ["hashtag inside the text: #design"])
        self.assertEqual(checks.check_hashtags("linkedin", "the #1 reason.\n\n#A"), [])


class Spelling(unittest.TestCase):
    def test_american_spellings_flagged_british_lookalikes_not(self):
        self.assertCountEqual(checks.find_american_spellings("We optimize color and behavior."),
                              ["spelling: 'optimize' -> use 'optimise'", "spelling: 'color' -> use 'colour'", "spelling: 'behavior' -> use 'behaviour'"])
        self.assertEqual(checks.find_american_spellings("The program ran while we licensed it and learned from it."), [])

    def test_every_inflection_of_a_family_is_flagged(self):
        for word, british in [("organizing", "organising"), ("analyzing", "analysing"), ("realized", "realised"),
                              ("prioritized", "prioritised"), ("customized", "customised"), ("organizations", "organisations"),
                              ("optimization", "optimisation"), ("behavioral", "behavioural"), ("colors", "colours"),
                              ("favorite", "favourite"), ("centered", "centred"), ("defenses", "defences"),
                              ("cataloging", "cataloguing"), ("grayscale", "greyscale"), ("labeling", "labelling"),
                              ("modeled", "modelled"), ("canceled", "cancelled"), ("traveling", "travelling"),
                              ("fulfillment", "fulfilment"), ("enrollment", "enrolment"), ("skillfully", "skilfully")]:
            self.assertEqual(checks.find_american_spellings("They were %s it." % word), ["spelling: '%s' -> use '%s'" % (word, british)], word)

    def test_british_forms_and_shared_words_pass(self):
        text = ("We organised the catalogue in colour, analysed the behaviour, labelled and modelled it, "
                "fulfilled the brief, enrolled the team and travelled to Colorado. A model, a label, a defensive centre.")
        self.assertEqual(checks.find_american_spellings(text), [])

    def test_a_url_is_not_checked(self):
        self.assertEqual(checks.find_american_spellings("See https://example.com/organizations for more."), [])
        self.assertEqual(checks.find_american_spellings("the organizations"), ["spelling: 'organizations' -> use 'organisations'"])

    def test_each_word_is_reported_once_in_order(self):
        self.assertEqual(checks.find_american_spellings("Realized, then Realized again, and organizing."),
                         ["spelling: 'realized' -> use 'realised'", "spelling: 'organizing' -> use 'organising'"])


class Placeholders(unittest.TestCase):
    def test_placeholders(self):
        self.assertEqual(checks.find_placeholders("Paste [article link] here"), ["placeholder: [article link]"])
        self.assertEqual(checks.find_placeholders("No brackets."), [])


class Lengths(unittest.TestCase):
    def test_threads(self):
        self.assertEqual(checks.split_thread("a\n\n---\n\nb\n"), ["a", "b"])
        five = "\n\n---\n\n".join([X] * 5)
        self.assertEqual(checks.check_char_limit("x", "thread", five), [])
        self.assertEqual(checks.check_char_limit("x", "thread", "\n\n---\n\n".join([X, "y" * 281, X, X])), ["thread post 2 is 281 characters, the limit is 280"])
        self.assertEqual(checks.check_char_limit("x", "thread", "\n\n---\n\n".join([X] * 3)), ["thread has 3 posts, threads run 4 to 8"])
        self.assertEqual(checks.check_char_limit("x", "thread", "\n\n---\n\n".join([X] * 9)), ["thread has 9 posts, threads run 4 to 8"])

    def test_single_posts(self):
        self.assertEqual(checks.check_char_limit("x", "text", "y" * 300), ["x copy is 300 characters, the limit is 280"])
        self.assertEqual(checks.check_char_limit("linkedin", "text", "y" * 3001), ["linkedin copy is 3001 characters, the limit is 3000"])
        self.assertEqual(checks.check_char_limit("instagram", "image", "y" * 2201), ["instagram copy is 2201 characters, the limit is 2200"])
        self.assertEqual(checks.check_char_limit("linkedin", "article", "y" * 10000), [])
        self.assertEqual(checks.check_char_limit("substack", "essay", "y" * 10000), [])


class Viva(unittest.TestCase):
    """Viva Engage is Nagarro's internal network: 3,000 characters, no hashtag cap or required tag, links fine in the body."""

    def test_limit(self):
        self.assertEqual(checks.check_char_limit("viva", "text", "y" * 3000), [])
        self.assertEqual(checks.check_char_limit("viva", "image", "y" * 3001), ["viva copy is 3001 characters, the limit is 3000"])

    def test_no_hashtag_cap_and_the_placement_rule_still_holds(self):
        self.assertNotIn("viva", checks.HASHTAG_CAPS)
        self.assertEqual(checks.check_hashtags("viva", "Body.\n\n#A #B #C #D #E #F #G"), [])
        self.assertEqual(checks.check_hashtags("viva", "the #design community.\n"), ["hashtag inside the text: #design"])

    def test_links_inline_and_no_campaign_hashtag(self):
        viva = meta(surface="viva", format="text", mode="nagarro", campaign="ai-ready-design-systems")
        body = "The checklist we used is on the intranet: https://nagarro.sharepoint.com/sites/design/checklist\n"
        self.assertEqual(checks.run_all(viva, body, DS), [])
        self.assertIn("viva copy is 3001 characters, the limit is 3000", checks.run_all(viva, "y" * 3001 + "\n", DS))
        # The same body on LinkedIn still breaks the link rule and misses the campaign tag.
        linkedin = checks.run_all(dict(viva, surface="linkedin"), body, DS)
        self.assertIn("missing required hashtag #FluidicIntelligence", linkedin)
        self.assertTrue(any(problem.startswith("link in body:") for problem in linkedin), linkedin)


class Claims(unittest.TestCase):
    def test_kept_from_marketeer(self):
        self.assertTrue(checks.find_claim_flags("guaranteed #1 results"))
        self.assertEqual(checks.find_claim_flags("a measured result"), [])

    def test_absolute_and_comparative_claims_still_flag(self):
        self.assertEqual(checks.find_claim_flags("Results guaranteed."), ["unsubstantiated/absolute claim: 'guaranteed'"])
        self.assertEqual(checks.find_claim_flags("The #1 tool for teams."), ["unsubstantiated/absolute claim: '#1'"])
        self.assertEqual(checks.find_claim_flags("A risk-free start."), ["unsubstantiated/absolute claim: 'risk-free'"])
        self.assertEqual(checks.find_claim_flags("A method proven to work."), ["unsubstantiated/absolute claim: 'proven to'"])
        self.assertEqual(checks.find_claim_flags("Unlike our competitors, we ship."), ["comparative/disparaging claim: 'unlike our competitors'"])
        self.assertEqual(checks.find_claim_flags("Competitors can\u2019t do it."), ["comparative/disparaging claim: 'competitors can't'"])

    def test_guarantee_flags_unless_negated(self):
        self.assertEqual(checks.find_claim_flags("This method guarantees results."), ["unsubstantiated/absolute claim: 'guarantees'"])
        self.assertEqual(checks.find_claim_flags("We guarantee results."), ["unsubstantiated/absolute claim: 'guarantee'"])
        for text in ["I guarantee nothing about the result.", "The study guarantees nothing.", "There is no guarantee it works.",
                     "No guarantees either way."]:
            self.assertEqual(checks.find_claim_flags(text), [], text)

    def test_whole_words_only_and_hugos_own_lines_pass(self):
        for text in ["I guarantee nothing about the result.", "See #10 on the list.", "Costs rose 1100% in the model.",
                     "Caring more is the only moat left.", "They know the problem better than the tool does.",
                     "The agent answered instantly.", "The unproven toolkit."]:
            self.assertEqual(checks.find_claim_flags(text), [], text)


def meta(**over):
    m = {"id": "p", "type": "post", "title": "T", "status": "draft", "brand": "hugo", "surface": "linkedin", "format": "text",
         "mode": "personal", "campaign": None, "pillar": 1, "first_comment": "", "created": "2026-10-22T10:00:00+01:00", "updated": "2026-10-22T10:00:00+01:00"}
    m.update(over)
    return m


NEUTRAL = {"slug": "flo-2026-talks", "mode": "personal", "neutral": True}
DS = {"slug": "ai-ready-design-systems", "mode": "nagarro", "neutral": False, "required_hashtags_linkedin": ["#FluidicIntelligence"]}


class Modes(unittest.TestCase):
    def test_neutral(self):
        self.assertCountEqual(checks.check_neutral("I gave this talk at FLO in Lisbon."), ["neutral piece mentions 'this talk'", "neutral piece mentions 'FLO'"])
        for text in ["Nagarro asked", "the slides are", "when the room went quiet", "my keynote"]:
            self.assertEqual(len(checks.check_neutral(text)), 1, text)
        self.assertEqual(checks.check_neutral("We talk about care. A flow of work."), [])

    def test_personal_promotion(self):
        self.assertEqual(checks.check_personal_promotion("I work at Nagarro, and this is my view."), [])
        self.assertEqual(checks.check_personal_promotion("Nagarro's AI-Ready Design Systems offering starts here."), ["personal piece promotes 'AI-Ready Design Systems'"])
        for text in ["https://www.nagarro.com/en/services/design-studio/ai-ready-design-systems", "#FluidicIntelligence", "Nagarro can help", "our AI Readiness Diagnostic"]:
            self.assertEqual(len(checks.check_personal_promotion(text)), 1, text)


class RunAll(unittest.TestCase):
    def test_clean_post(self):
        self.assertEqual(checks.run_all(meta(), "Short line.\n\nOne question for you?\n\n#A #B\n"), [])
        self.assertEqual(checks.run_all(meta(first_comment="The article: https://x.io/a"), "Link in the comments.\n"), [])

    def test_picks_rules_by_surface_mode_and_campaign(self):
        self.assertIn("link in body: https://x.io/a", checks.run_all(meta(), "See https://x.io/a\n"))
        self.assertNotIn("link in body: https://x.io/a", checks.run_all(meta(format="article"), "See https://x.io/a\n"))
        self.assertIn("neutral piece mentions 'Nagarro'", checks.run_all(meta(campaign="flo-2026-talks", first_comment="Nagarro"), "Body\n", NEUTRAL))
        self.assertEqual(checks.run_all(meta(mode="nagarro", campaign="ai-ready-design-systems"), "Body\n\n#FluidicIntelligence #A\n", DS), [])
        self.assertIn("missing required hashtag #FluidicIntelligence", checks.run_all(meta(mode="nagarro", campaign="ai-ready-design-systems"), "Body\n\n#A\n", DS))
        self.assertIn("personal piece promotes '#FluidicIntelligence'", checks.run_all(meta(), "Body\n\n#FluidicIntelligence\n"))
        self.assertIn("banned word: 'leverage'", checks.run_all(meta(first_comment="Leverage this"), "Body\n"))
        self.assertIn("em dash on line 1", checks.run_all(meta(title="A \u2014 B"), "Body\n"))

    def test_ideas_skip_surface_rules(self):
        idea = meta(type="idea", surface=None, format=None)
        self.assertEqual(checks.run_all(idea, "Source: https://x.io/a\n\n#A #B #C #D\n"), [])
        self.assertIn("banned word: 'delve'", checks.run_all(idea, "Let us delve.\n"))


class Sources(unittest.TestCase):
    def test_figures_need_a_source(self):
        self.assertEqual(checks.find_unsourced_numbers("We saved 30% of prototyping time.", has_sources=False), ["number without a source: '30%'"])
        self.assertEqual(checks.find_unsourced_numbers("We saved 30% of prototyping time.", has_sources=True), [])
        self.assertEqual(checks.find_unsourced_numbers("We saved 30% of prototyping time, according to the project page.", has_sources=False), [])
        self.assertEqual(checks.find_unsourced_numbers("A 2025 USENIX study found 19.6% of the packages did not exist.", has_sources=False), [])
        self.assertEqual(checks.find_unsourced_numbers("The toolkit post states 857,763 impressions.[^1]\n\n[^1]: The toolkit post.", has_sources=False), [])
        self.assertEqual(checks.find_unsourced_numbers("Reach grew a lot.[^1]\n\nIt reached 857,763 impressions in a year.", has_sources=False), ["number without a source: '857,763'"])
        self.assertCountEqual(checks.find_unsourced_numbers("It cost $50,000 per release, 2 million views and 857,763 impressions.", has_sources=False),
                              ["number without a source: '$50,000'", "number without a source: '2 million'", "number without a source: '857,763'"])
        self.assertEqual(checks.find_unsourced_numbers("In 2026 we posted at 08:30, three times, with 10 rules and cards at 1080\u00d71350.", has_sources=False), [])

    def test_abbreviations_do_not_end_a_sentence(self):
        for text in ["A 2025 USENIX Security study by Spracklen et al. tested 16 models across 19,000 prompts: on average 19.6% of the packages did not exist.",
                     "According to Dr. Smith, 30% of designers prototype in code.",
                     "The 2025 State of Design report (p. 12) puts it at 30%.",
                     "Teams, e.g. those in the survey, saved 30%, i.e. a third.",
                     "According to DR. SMITH, 30% of designers prototype in code.",
                     "Mr. Jones and Ms. Lee ran a survey in the U.S. and found 30%."]:
            self.assertEqual(checks.find_unsourced_numbers(text, has_sources=False), [], text)
        # A real full stop still ends the sentence, and a word that merely ends in an abbreviation is not one.
        self.assertEqual(checks.find_unsourced_numbers("A study ran. We saved 30% of the time.", has_sources=False), ["number without a source: '30%'"])
        self.assertEqual(checks.find_unsourced_numbers("According to the plan, we did it. The split was equal. Costs rose 30%.", has_sources=False), ["number without a source: '30%'"])
        self.assertEqual(checks.find_unsourced_numbers("According to the plan, we did it. We saw tools help. Costs rose 30%.", has_sources=False), ["number without a source: '30%'"])

    def test_format_measures_are_not_claims(self):
        for text in ["Aim for 900 to 1,500 characters and 6 to 12 slides.",
                     "LinkedIn: 900 to 1,500 characters.",
                     "Articles run 1,000 to 1,400 words.",
                     "Cards are 1,080 px wide and a clip runs 1,200 seconds.",
                     "A thread has 4 to 8 posts of at most 2,200 Characters."]:
            self.assertEqual(checks.find_unsourced_numbers(text, has_sources=False), [], text)
        self.assertEqual(checks.find_unsourced_numbers("We handled 1,500 tickets.", has_sources=False), ["number without a source: '1,500'"])
        self.assertCountEqual(checks.find_unsourced_numbers("We handled 1,000 to 1,400 tickets.", has_sources=False),
                              ["number without a source: '1,000'", "number without a source: '1,400'"])
        self.assertEqual(checks.find_unsourced_numbers("We handled 1,500 wordsmiths and 40% of them stayed.", has_sources=False),
                         ["number without a source: '1,500'", "number without a source: '40%'"])
        self.assertEqual(checks.find_unsourced_numbers("It reached 1,500 characters, then 40% more.", has_sources=False), ["number without a source: '40%'"])

    def test_a_source_on_the_same_line_counts_for_every_figure_on_it(self):
        self.assertEqual(checks.find_unsourced_numbers("\u2192 " + RMS + " Source: Hugo's LinkedIn projects section.", has_sources=False), [])
        self.assertEqual(checks.find_unsourced_numbers("\u2192 Source: the project page. " + RMS, has_sources=False), [])
        self.assertEqual(checks.find_unsourced_numbers("\u2192 " + RMS, has_sources=False),
                         ["number without a source: '30%'", "number without a source: '50,000'"])
        # A Source on the next line is another line: posts keep the per-sentence rule.
        self.assertEqual(checks.find_unsourced_numbers(RMS + "\nSource: Hugo's LinkedIn projects section.", has_sources=False),
                         ["number without a source: '30%'", "number without a source: '50,000'"])
        self.assertEqual(checks.find_unsourced_numbers("30% saved. Source: Hugo's LinkedIn projects section", has_sources=False), [])
        # A thing called a source is not where a fact comes from.
        for text in ["cut costs by 40% with open source: here is how", "cut costs by 40% with open-source: here is how",
                     "Costs fell 40%. Our data source: the CRM.", "Costs fell 40%. The source: a guess."]:
            self.assertEqual(checks.find_unsourced_numbers(text, has_sources=False), ["number without a source: '40%'"], text)
        idea = meta(type="idea", surface=None, format=None)
        self.assertEqual(checks.run_all(idea, "## Facts and sources\n\n\u2192 " + RMS + " Source: Hugo's LinkedIn projects section.\n"), [])

    def test_a_sources_section_counts_as_sources(self):
        for body in ["Text.\n\n## Sources\n\n\u2192 The project page\n", "## sources:\n\u2192 x\n", "Text.\n## SOURCES  \n"]:
            self.assertTrue(checks.has_sources_section(body), body)
        for body in ["We cite our sources in the text.\n", "### Sources\n", "## Sources of friction\n", "Text\n\nSources\n", "## Sourcesx\n"]:
            self.assertFalse(checks.has_sources_section(body), body)
        article = meta(format="article")
        cited = "We saved 30% of the time.\n\n## Sources\n\n\u2192 The project page\n"
        self.assertNotIn("number without a source: '30%'", checks.run_all(article, cited))
        self.assertIn("number without a source: '30%'", checks.run_all(article, "We saved 30% of the time.\n"))


class WordCounts(unittest.TestCase):
    def words(self, n):
        return " ".join(["word"] * n) + "\n"

    def test_ranges(self):
        self.assertEqual(checks.check_word_count("article", self.words(1000)), [])
        self.assertEqual(checks.check_word_count("article", self.words(999)), ["article is 999 words, articles run 1,000 to 1,400"])
        self.assertEqual(checks.check_word_count("article", self.words(1401)), ["article is 1,401 words, articles run 1,000 to 1,400"])
        self.assertEqual(checks.check_word_count("essay", self.words(2501)), ["essay is 2,501 words, essays run 1,800 to 2,500"])
        self.assertEqual(checks.check_word_count("note", self.words(5)), [])
        self.assertEqual(checks.check_word_count("text", self.words(5)), [])

    def test_images_footnote_definitions_and_markers_do_not_count(self):
        body = self.words(1399) + "\n![alt text here](images/x.png)\n\n[SUBSCRIBE BUTTON]\n\n[^1]: A source, what it is: example.org\n"
        self.assertEqual(checks.check_word_count("article", body), [])


class PlaceholderExemptions(unittest.TestCase):
    def test_markdown_and_footnotes_are_not_placeholders(self):
        self.assertEqual(checks.find_placeholders("![alt text](images/x.png) and [a link](https://x.io) and a note.[^1]\n\n[^1]: Source."), [])
        self.assertEqual(checks.find_placeholders("[article link]"), ["placeholder: [article link]"])

    def test_substack_markers_only_where_allowed(self):
        text = "[SUBSCRIBE BUTTON]\n\n> [PULL QUOTE] A line.\n\n[SHARE BUTTON]\n"
        self.assertEqual(checks.find_placeholders(text, allowed=checks.SUBSTACK_MARKERS), [])
        self.assertEqual(len(checks.find_placeholders(text)), 3)


class RunAllLongForm(unittest.TestCase):
    def test_substack_markers_and_word_counts(self):
        essay = meta(surface="substack", format="essay")
        body = " ".join(["word"] * 1800) + "\n\n[SUBSCRIBE BUTTON]\n\n[^1]: Source: example.org\n"
        self.assertEqual(checks.run_all(essay, body), [])
        self.assertIn("placeholder: [SUBSCRIBE BUTTON]", checks.run_all(meta(), "Body [SUBSCRIBE BUTTON]\n"))
        self.assertIn("article is 3 words, articles run 1,000 to 1,400", checks.run_all(meta(format="article"), "Three words here\n"))

    def test_unsourced_numbers_use_the_sources_field(self):
        self.assertIn("number without a source: '30%'", checks.run_all(meta(), "We saved 30% of the time.\n"))
        self.assertEqual(checks.run_all(meta(sources=["https://x.io/report"]), "We saved 30% of the time.\n"), [])


class SwipeProbe(unittest.TestCase):
    """The author's published posts are the bar: a rule that would refuse one of them is a rule to look at."""

    # Beyond the placeholders their first comments carry, the only problems are these, all real by his rules.
    EXPECTED = {
        "ds-07.md": ["banned word: 'screens'"],
        "ds-15.md": ["banned word: 'screens'", "spelling: 'organization' -> use 'organisation'"],
    }

    def read_swipe(self, path):
        """Split a swipe file into its `key: value` header lines and the post below the first blank line."""
        head, _, body = path.read_text(encoding="utf-8").partition("\n\n")
        header = dict(line.split(": ", 1) for line in head.splitlines() if ": " in line)
        return header, body

    def test_the_rules_pass_hugos_own_posts(self):
        files = sorted(f for f in SWIPE.glob("*.md") if f.name != "README.md")
        if len(files) < 8:
            self.skipTest("the swipe file has fewer than 8 published posts")
        for path in files:
            header, body = self.read_swipe(path)
            # A LinkedIn text post in the mode it was written in: the ds posts are nagarro posts and carry #FluidicIntelligence.
            post = meta(mode=header.get("mode", "personal"), title=header.get("title", ""))
            problems = [m for m in checks.run_all(post, body) if not m.startswith("placeholder: ")]
            self.assertCountEqual(problems, self.EXPECTED.get(path.name, []), path.name)

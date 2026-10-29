import unittest
from datetime import date, datetime, timezone

from scripts.lib import dates


class Weekdays(unittest.TestCase):
    def test_fifteen_from_wed_21_oct(self):
        days = dates.weekdays_from(date(2026, 10, 21), 15)
        self.assertEqual(days[0], date(2026, 10, 21))
        self.assertEqual(days[2], date(2026, 10, 23))
        self.assertEqual(days[3], date(2026, 10, 26))
        self.assertEqual(days[-1], date(2026, 11, 10))
        self.assertEqual(len(days), 15)

    def test_start_on_a_weekend_moves_to_monday(self):
        self.assertEqual(dates.weekdays_from(date(2026, 10, 24), 1), [date(2026, 10, 26)])


class Lisbon(unittest.TestCase):
    def test_offset_changes_after_clocks_go_back(self):
        self.assertEqual(dates.iso(dates.lisbon(date(2026, 10, 22), "08:30")), "2026-10-22T08:30:00+01:00")
        self.assertEqual(dates.iso(dates.lisbon(date(2026, 10, 26), "08:30")), "2026-10-26T08:30:00+00:00")

    def test_is_future(self):
        now = datetime(2026, 10, 21, 12, 0, tzinfo=timezone.utc)
        self.assertFalse(dates.is_future(dates.lisbon(date(2026, 10, 21), "08:30"), now))
        self.assertTrue(dates.is_future(dates.lisbon(date(2026, 10, 22), "08:30"), now))

    def test_shift_counts_calendar_days(self):
        self.assertEqual(dates.shift_weekday(date(2026, 11, 4), 3), date(2026, 11, 7))

    def test_post_times(self):
        self.assertEqual(dates.POST_TIMES, {"linkedin": "08:30", "instagram": "12:30", "x": "09:30", "substack": "09:00", "viva": "10:00"})

    def test_a_viva_piece_defaults_to_ten_in_lisbon(self):
        self.assertEqual(dates.iso(dates.lisbon(date(2026, 10, 27), dates.POST_TIMES["viva"])), "2026-10-27T10:00:00+00:00")


if __name__ == "__main__":
    unittest.main()

"""Schedules and Lisbon-time helpers for Content Object dates."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

LISBON = ZoneInfo("Europe/Lisbon")

# Default posting time per surface, Lisbon time.
POST_TIMES = {"linkedin": "08:30", "instagram": "12:30", "x": "09:30", "substack": "09:00", "viva": "10:00"}


def weekdays_from(start: date, count: int) -> list[date]:
    """The next `count` weekdays starting at `start` (included when it is a weekday)."""
    days: list[date] = []
    current = start
    while len(days) < count:
        if current.weekday() < 5:
            days.append(current)
        current += timedelta(days=1)
    return days


def lisbon(d: date, hhmm: str) -> datetime:
    hour, minute = (int(part) for part in hhmm.split(":"))
    return datetime(d.year, d.month, d.day, hour, minute, tzinfo=LISBON)


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def is_future(dt: datetime, now: datetime | None = None) -> bool:
    now = now or datetime.now(timezone.utc)
    return dt > now


def shift_weekday(d: date, days: int) -> date:
    """Shift by calendar days; weekends are not skipped."""
    return d + timedelta(days=days)

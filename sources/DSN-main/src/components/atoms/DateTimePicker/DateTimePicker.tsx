import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Chip, ChipGroup } from '../Chip';
import { Combobox } from '../Combobox';
import { SegmentControl } from '../SegmentControl';
import { PopoverWrapper, isPointerInsideAnchoredPopover, focusWithoutScroll } from '../../molecules/PopoverWrapper';
import { Toolbar } from '../../molecules/Toolbar';
import './DateTimePicker.css';

export type DateTimePickerSelectionMode = 'single' | 'range';
export type DateRangeValue = { start: Date | null; end: Date | null };
export type DateTimePickerValue = Date | DateRangeValue | null;

export interface DateTimePickerPreset {
  id: string;
  label: string;
  value: DateTimePickerValue;
}

export interface DateTimePickerProps {
  id?: string;
  displayMode?: 'popover' | 'inline';
  selectionMode?: DateTimePickerSelectionMode;
  withTime?: boolean;
  label?: string;
  placeholder?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  value?: DateTimePickerValue;
  defaultValue?: DateTimePickerValue;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  /** When true, appends "(optional)" to the label and suppresses aria-required. */
  optional?: boolean;
  error?: boolean;
  helperText?: string;
  errorMessage?: string;
  helperIcon?: React.ReactNode;
  className?: string;
  onChange?: (value: DateTimePickerValue) => void;
  onOpenChange?: (open: boolean) => void;
  presets?: DateTimePickerPreset[];
  selectedPresetId?: string | null;
  defaultSelectedPresetId?: string | null;
  onPresetSelect?: (presetId: string) => void;
  showActions?: boolean;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel?: () => void;
  onConfirm?: (value: DateTimePickerValue) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const TIME_OPTIONS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
];

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.5 4.5L6 8L9.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 4.5L10 8L6.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.33333 2V4M10.6667 2V4M2.66667 6H13.3333M4 3.33333H12C12.7364 3.33333 13.3333 3.93029 13.3333 4.66667V12C13.3333 12.7364 12.7364 13.3333 12 13.3333H4C3.26362 13.3333 2.66667 12.7364 2.66667 12V4.66667C2.66667 3.93029 3.26362 3.33333 4 3.33333Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.5 4.5L4.5 11.5M4.5 4.5L11.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeDate(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) {
    return false;
  }
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toKey(value: Date): string {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

function formatDate(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const year = String(value.getFullYear());
  return `${month}-${day}-${year}`;
}

function formatDateTime(value: Date, time: string, period: string): string {
  return `${formatDate(value)} ${time} ${period}`;
}

/** Check if string looks like MM-DD-YYYY (so we can show invalid-date error). */
function looksLikeDateInput(value: string): boolean {
  const datePart = value.trim().split(/\s+/)[0] ?? '';
  return /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(datePart);
}

/** Parse natural language time (e.g. "7 am", "7:30 pm", "noon"). Returns { time: "HH:MM", meridiem } or null. */
function parseNaturalLanguageTime(raw: string): { time: string; meridiem: 'AM' | 'PM' } | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s === 'noon' || s === '12 noon') return { time: '12:00', meridiem: 'PM' };
  if (s === 'midnight' || s === '12 midnight') return { time: '12:00', meridiem: 'AM' };
  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] != null ? parseInt(match[2], 10) : 0;
  const period = (match[3] ?? '').toLowerCase();
  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  const twelveHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const meridiem: 'AM' | 'PM' = hours < 12 ? 'AM' : 'PM';
  const time = `${String(twelveHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return { time, meridiem };
}

function resolveTimeInput(
  raw: string,
  fallbackMeridiem: string,
): { time: string; meridiem: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { time: '07:00', meridiem: fallbackMeridiem };
  }

  const parsed = parseNaturalLanguageTime(trimmed);
  if (parsed) {
    return parsed;
  }

  if (TIME_OPTIONS.includes(trimmed)) {
    return { time: trimmed, meridiem: fallbackMeridiem };
  }

  return { time: trimmed, meridiem: fallbackMeridiem };
}

function formatLongDate(value: Date): string {
  return value.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Digits only from string (for masked MM-DD-YYYY input). */
function getDateDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Format up to 8 digits as MM-DD-YYYY (partial allowed, e.g. "01-1", "01-15-202"). */
function formatDateDraft(digits: string): string {
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  const parts = [mm];
  if (dd.length > 0) parts.push(dd);
  if (yyyy.length > 0) parts.push(yyyy);
  return parts.join('-');
}

/** Parse strict MM-DD-YYYY (with optional separators). */
function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  const datePart = trimmed.split(/\s+/)[0] ?? '';
  const match = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return normalizeDate(parsed);
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_ABBREV = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Parse natural language date (e.g. "today", "tomorrow", "march 17", "next friday"). Returns null if not recognized. */
function parseNaturalLanguageDate(text: string, refDate: Date): Date | null {
  const raw = text.trim().toLowerCase();
  if (!raw) return null;

  const today = normalizeDate(refDate);
  if (raw === 'today') return today;
  if (raw === 'tomorrow') return addDays(today, 1);
  if (raw === 'yesterday') return addDays(today, -1);

  const nextMatch = raw.match(/^next\s+(\w+)$/);
  if (nextMatch) {
    const word = nextMatch[1];
    const dayIndex = WEEKDAY_NAMES.indexOf(word);
    if (dayIndex !== -1) {
      let d = addDays(today, 1);
      while (d.getDay() !== dayIndex) {
        d = addDays(d, 1);
      }
      return d;
    }
  }

  const lastMatch = raw.match(/^last\s+(\w+)$/);
  if (lastMatch) {
    const word = lastMatch[1];
    const dayIndex = WEEKDAY_NAMES.indexOf(word);
    if (dayIndex !== -1) {
      let d = addDays(today, -1);
      while (d.getDay() !== dayIndex) {
        d = addDays(d, -1);
      }
      return d;
    }
  }

  for (let m = 0; m < 12; m++) {
    const full = MONTH_NAMES[m];
    const abbrev = MONTH_ABBREV[m];
    const rx = new RegExp(`^(?:${full}|${abbrev})\\s+(\\d{1,2})(?:\\s*(?:st|nd|rd|th))?(?:\\s*,?\\s*(\\d{4}))?$`, 'i');
    const match = raw.match(rx);
    if (match) {
      const day = Math.min(31, Math.max(1, Number(match[1])));
      const year = match[2] ? Number(match[2]) : refDate.getFullYear();
      const parsed = new Date(year, m, day);
      if (parsed.getMonth() === m && parsed.getDate() === day) return normalizeDate(parsed);
    }
  }

  const dmMatch = raw.match(/^(\d{1,2})\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)(?:\s*,?\s*(\d{4}))?$/i);
  if (dmMatch) {
    const day = Math.min(31, Math.max(1, Number(dmMatch[1])));
    const monthStr = dmMatch[2].toLowerCase();
    let m = MONTH_NAMES.indexOf(monthStr);
    if (m === -1) m = MONTH_ABBREV.indexOf(monthStr);
    if (m !== -1) {
      const year = dmMatch[3] ? Number(dmMatch[3]) : refDate.getFullYear();
      const parsed = new Date(year, m, day);
      if (parsed.getMonth() === m && parsed.getDate() === day) return normalizeDate(parsed);
    }
  }

  return null;
}

function getMonthStart(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, offset: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + offset, 1);
}

function addDays(value: Date, offset: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + offset);
  return normalizeDate(next);
}

function monthLabel(value: Date): string {
  return value.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Built-in preset shortcuts, computed from calendar boundaries so each label is accurate:
 * "Last Friday" is the most recent Friday before today, "Last week" the previous
 * Sunday–Saturday week (matching the calendar grid), "Last month" / "Last year" the
 * previous calendar month / year.
 */
export function buildDefaultPresets(reference: Date, isRange: boolean): DateTimePickerPreset[] {
  const today = normalizeDate(reference);
  const yesterday = addDays(today, -1);
  if (isRange) {
    const thisWeekStart = addDays(today, -today.getDay());
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastYear = today.getFullYear() - 1;
    return [
      { id: 'today', label: 'Today', value: { start: today, end: today } },
      { id: 'yesterday', label: 'Yesterday', value: { start: yesterday, end: yesterday } },
      {
        id: 'last-week',
        label: 'Last week',
        value: { start: addDays(thisWeekStart, -7), end: addDays(thisWeekStart, -1) },
      },
      { id: 'last-month', label: 'Last month', value: { start: lastMonthStart, end: lastMonthEnd } },
      {
        id: 'last-year',
        label: 'Last year',
        value: { start: new Date(lastYear, 0, 1), end: new Date(lastYear, 11, 31) },
      },
    ];
  }
  // Friday is day 5; on a Friday, "last Friday" is a week ago.
  const daysSinceFriday = (today.getDay() - 5 + 7) % 7 || 7;
  return [
    { id: 'today', label: 'Today', value: today },
    { id: 'yesterday', label: 'Yesterday', value: yesterday },
    { id: 'last-friday', label: 'Last Friday', value: addDays(today, -daysSinceFriday) },
  ];
}

function buildCalendarGrid(viewDate: Date): Date[] {
  const startOfMonth = getMonthStart(viewDate);
  const startOffset = startOfMonth.getDay();
  const gridStart = addDays(startOfMonth, -startOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function asRangeValue(value: DateTimePickerValue | undefined): DateRangeValue {
  if (!value || value instanceof Date) {
    return { start: null, end: null };
  }
  return {
    start: value.start ? normalizeDate(value.start) : null,
    end: value.end ? normalizeDate(value.end) : null,
  };
}

function asSingleValue(value: DateTimePickerValue | undefined): Date | null {
  if (!value || !(value instanceof Date)) {
    return null;
  }
  return normalizeDate(value);
}

function isBetween(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) {
    return false;
  }
  const t = day.getTime();
  return t > start.getTime() && t < end.getTime();
}

/**
 * Form field for a single date or date range, optionally with time, as a popover or inline calendar with presets.
 *
 * @aiSelectWhen Picking a specific date or date range in a form or panel
 * @aiSelectWhen Date selection is the main task of the view — use displayMode="inline"
 *
 * @aiAvoid Do not use for scheduling views — use CalendarView instead
 * @aiAvoid Do not use for relative periods like "Last 7 days" — use Select or SegmentControl instead
 * @aiAvoid DatePicker / DateRangePicker do not exist — use DateTimePicker selectionMode="single" | "range"
 *
 * @aiVariant selectionMode="single" — one date; selectionMode="range" — start and end
 * @aiVariant displayMode="popover" — one field among many; displayMode="inline" — always-visible calendar
 * @aiVariant withTime — adds a time field when the time of day matters
 *
 * @aiSpatial Input fills its parent's width; the popover calendar is portalled and positioned by PopoverWrapper.
 *
 * @aiCompose Omit presets for the built-in calendar shortcuts, pass your own, or [] to hide them
 * @aiCompose No min/max or disabled dates — validate in the form and state limits in helperText
 */
export function DateTimePicker({
  id,
  displayMode = 'popover',
  selectionMode = 'single',
  withTime = false,
  label = 'Date and time',
  placeholder = 'MM-DD-YYYY 00:00 AM',
  startPlaceholder = 'Start date',
  endPlaceholder = 'End date',
  value,
  defaultValue = null,
  open,
  defaultOpen = false,
  disabled = false,
  optional = false,
  error = false,
  helperText = 'Help text',
  errorMessage,
  helperIcon,
  className,
  onChange,
  onOpenChange,
  presets,
  selectedPresetId,
  defaultSelectedPresetId = null,
  onPresetSelect,
  showActions = true,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: DateTimePickerProps) {
  const autoId = useId();
  const pickerId = id ?? `dsn-date-time-picker-${autoId}`;
  const labelId = `${pickerId}-label`;
  const helperId = `${pickerId}-helper`;
  const dialogId = `${pickerId}-dialog`;
  const timeComboboxId = `${pickerId}-time`;
  const timeListboxId = `${timeComboboxId}-listbox`;
  const isRange = selectionMode === 'range';
  const isPopoverMode = displayMode === 'popover';
  const [inputValidationError, setInputValidationError] = useState<string | null>(null);
  const effectiveError = error || Boolean(inputValidationError);
  const helperContent =
    inputValidationError ?? (error && errorMessage ? errorMessage : helperText);

  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isOpenControlled ? open : internalOpen;

  const isValueControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<DateTimePickerValue>(defaultValue);
  const resolvedValue = isValueControlled ? value : internalValue;

  const singleValue = asSingleValue(resolvedValue);
  const rangeValue = asRangeValue(resolvedValue);

  const initialView = useMemo(() => {
    if (singleValue) {
      return getMonthStart(singleValue);
    }
    if (rangeValue.start) {
      return getMonthStart(rangeValue.start);
    }
    return getMonthStart(new Date());
  }, [rangeValue.start, singleValue]);
  const [viewDate, setViewDate] = useState(initialView);
  const defaultPresets = useMemo(() => buildDefaultPresets(new Date(), isRange), [isRange]);

  const resolvedPresets = presets ?? defaultPresets;
  const showActionBar = showActions;
  const isPresetControlled = selectedPresetId !== undefined;
  const [internalSelectedPresetId, setInternalSelectedPresetId] = useState<string | null>(
    defaultSelectedPresetId,
  );
  const activePresetId = isPresetControlled ? selectedPresetId ?? null : internalSelectedPresetId;
  const [focusedDate, setFocusedDate] = useState<Date>(normalizeDate(new Date()));
  const [hoveredRangeDay, setHoveredRangeDay] = useState<Date | null>(null);
  const [timeInput, setTimeInput] = useState('07:00');
  const [meridiem, setMeridiem] = useState('AM');
  const [singleDraft, setSingleDraft] = useState(singleValue ? formatDate(singleValue) : '');
  const [startDraft, setStartDraft] = useState(rangeValue.start ? formatDate(rangeValue.start) : '');
  const [endDraft, setEndDraft] = useState(rangeValue.end ? formatDate(rangeValue.end) : '');

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLInputElement | null>(null);
  const singleControlRef = useRef<HTMLDivElement>(null);
  const rangeControlWrapRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const popoverAnchorRef = isRange ? rangeControlWrapRef : singleControlRef;

  const startInput = isRange && rangeValue.start ? formatDate(rangeValue.start) : '';
  const endInput = isRange && rangeValue.end ? formatDate(rangeValue.end) : '';
  const days = useMemo(() => buildCalendarGrid(viewDate), [viewDate]);
  const refDate = viewDate;

  const resolveSingleDisplayDate = useCallback((): Date | null => {
    if (singleValue) {
      return singleValue;
    }

    const datePart = singleDraft.trim().split(/\s+/)[0] ?? '';
    if (!datePart) {
      return null;
    }

    return parseNaturalLanguageDate(datePart, refDate) ?? parseDateInput(datePart);
  }, [refDate, singleDraft, singleValue]);

  const syncSingleFieldDisplay = useCallback(() => {
    if (isRange || !withTime) {
      return;
    }

    const date = resolveSingleDisplayDate();
    if (!date) {
      return;
    }

    setSingleDraft(formatDateTime(date, timeInput, meridiem));
  }, [isRange, meridiem, resolveSingleDisplayDate, timeInput, withTime]);

  const setOpen = (nextOpen: boolean) => {
    if (!isOpenControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const confirmSelection = useCallback(
    (valueForConfirm?: DateTimePickerValue | null) => {
      if (!isRange && withTime) {
        const date =
          valueForConfirm instanceof Date
            ? valueForConfirm
            : resolveSingleDisplayDate() ?? focusedDate;
        if (date) {
          setSingleDraft(formatDateTime(date, timeInput, meridiem));
        }
      }
      onConfirm?.(valueForConfirm ?? resolvedValue ?? null);
      setOpen(false);
    },
    [
      focusedDate,
      isRange,
      meridiem,
      onConfirm,
      resolveSingleDisplayDate,
      resolvedValue,
      timeInput,
      withTime,
    ],
  );

  const emitChange = (nextValue: DateTimePickerValue) => {
    if (!isValueControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  const focusDay = (day: Date) => {
    const key = toKey(day);
    focusWithoutScroll(dayRefs.current[key]);
  };

  const commitInputValue = (raw: string, mode: 'single' | 'range-start' | 'range-end') => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setInputValidationError(null);
      return;
    }

    const isSingle = mode === 'single';
    const datePart = isSingle && withTime
      ? (trimmed.split(/\s+/)[0] ?? '').trim()
      : trimmed;
    const timePart = isSingle && withTime
      ? trimmed.slice(datePart.length).trim()
      : '';

    const parsed =
      parseNaturalLanguageDate(datePart, refDate) ?? parseDateInput(datePart);

    if (!parsed) {
      if (looksLikeDateInput(datePart)) {
        setInputValidationError('Enter a valid date');
      }
      return;
    }

    setInputValidationError(null);

    let resolvedTime = timeInput;
    let resolvedMeridiem = meridiem;
    if (isSingle && withTime && timePart) {
      const parsedTime = parseNaturalLanguageTime(timePart);
      if (parsedTime) {
        resolvedTime = parsedTime.time;
        resolvedMeridiem = parsedTime.meridiem;
        setTimeInput(parsedTime.time);
        setMeridiem(parsedTime.meridiem);
      }
    }

    if (mode === 'single') {
      emitChange(parsed);
      setViewDate(getMonthStart(parsed));
      setFocusedDate(parsed);
      setSingleDraft(
        withTime
          ? formatDateTime(parsed, resolvedTime, resolvedMeridiem)
          : formatDate(parsed),
      );
      return;
    }

    const start = mode === 'range-start' ? parsed : rangeValue.start;
    const end = mode === 'range-end' ? parsed : rangeValue.end;
    if (start && end && start.getTime() > end.getTime()) {
      emitChange({ start: end, end: start });
      setViewDate(getMonthStart(end));
      setFocusedDate(end);
      return;
    }

    emitChange({ start: start ?? null, end: end ?? null });
    setViewDate(getMonthStart(parsed));
    setFocusedDate(parsed);
    if (mode === 'range-start') setStartDraft(formatDate(parsed));
    if (mode === 'range-end') setEndDraft(formatDate(parsed));
  };

  const selectPreset = (preset: DateTimePickerPreset) => {
    if (!isPresetControlled) {
      setInternalSelectedPresetId(preset.id);
    }
    onPresetSelect?.(preset.id);
    emitChange(preset.value);
  };

  const handleSelectDay = (day: Date) => {
    setHoveredRangeDay(null);

    if (!isRange) {
      emitChange(day);
      setFocusedDate(day);
      if (withTime) {
        setSingleDraft(formatDateTime(day, timeInput, meridiem));
      } else {
        setSingleDraft(formatDate(day));
      }
      if (!withTime && !showActionBar && isPopoverMode) {
        setOpen(false);
      }
      return;
    }

    const { start, end } = rangeValue;
    if (!start || (start && end)) {
      emitChange({ start: day, end: null });
      setFocusedDate(day);
      return;
    }

    if (day.getTime() < start.getTime()) {
      emitChange({ start: day, end: start });
      setFocusedDate(day);
    } else {
      emitChange({ start, end: day });
      setFocusedDate(day);
    }

    if (!withTime && !showActionBar && isPopoverMode) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const selectedDate = isRange ? rangeValue.start ?? focusedDate : singleValue ?? focusedDate;
    if (!sameDay(selectedDate, focusedDate)) {
      setFocusedDate(selectedDate);
    }
    const timeout = setTimeout(() => focusDay(selectedDate), 0);
    return () => clearTimeout(timeout);
  }, [focusedDate, isOpen, isRange, rangeValue.start, singleValue]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current || !isOpen) {
        return;
      }
      if (
        !isPointerInsideAnchoredPopover(event, rootRef.current, dialogId) &&
        !isPointerInsideAnchoredPopover(event, rootRef.current, timeListboxId)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isRange && withTime) {
      syncSingleFieldDisplay();
      return;
    }

    if (!isRange && singleValue) {
      setSingleDraft(formatDate(singleValue));
    }
  }, [isRange, singleValue, syncSingleFieldDisplay, withTime]);

  useEffect(() => {
    if (!isRange || !isOpen || rangeValue.end) {
      setHoveredRangeDay(null);
    }
  }, [isOpen, isRange, rangeValue.end]);

  useEffect(() => {
    if (isRange) {
      setStartDraft(startInput);
      setEndDraft(endInput);
    }
  }, [endInput, isRange, startInput]);

  const content = (
    <div className="dsn-date-time-picker-panel">
      <div className="dsn-date-time-picker-calendar-header">
        <Button
          variant="ghost"
          size="md"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<ChevronLeftIcon />}
          aria-label="Previous month"
          onClick={() => setViewDate((current) => addMonths(current, -1))}
        />
        <div className="dsn-date-time-picker-calendar-title-wrap">
          <span className="dsn-date-time-picker-calendar-title">{monthLabel(viewDate)}</span>
          <span className="dsn-date-time-picker-calendar-title">{viewDate.getFullYear()}</span>
        </div>
        <Button
          variant="ghost"
          size="md"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<ChevronRightIcon />}
          aria-label="Next month"
          onClick={() => setViewDate((current) => addMonths(current, 1))}
        />
      </div>

      <div className="dsn-date-time-picker-weekday-row">
        {WEEKDAY_LABELS.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className="dsn-date-time-picker-weekday">
            {weekday}
          </span>
        ))}
      </div>

      <div
        className="dsn-date-time-picker-days-grid"
        role="grid"
        aria-label="Calendar"
        onMouseLeave={() => setHoveredRangeDay(null)}
      >
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div key={rowIndex} role="row">
            {days.slice(rowIndex * 7, rowIndex * 7 + 7).map((day) => {
              const isInViewMonth = day.getMonth() === viewDate.getMonth();
              const hasRangePreview = isRange && Boolean(rangeValue.start && !rangeValue.end && hoveredRangeDay);
              const previewStart =
                hasRangePreview && rangeValue.start && hoveredRangeDay
                  ? hoveredRangeDay.getTime() < rangeValue.start.getTime()
                    ? hoveredRangeDay
                    : rangeValue.start
                  : null;
              const previewEnd =
                hasRangePreview && rangeValue.start && hoveredRangeDay
                  ? hoveredRangeDay.getTime() < rangeValue.start.getTime()
                    ? rangeValue.start
                    : hoveredRangeDay
                  : null;

              const visualRangeStart = isRange ? (rangeValue.end ? rangeValue.start : previewStart ?? rangeValue.start) : singleValue;
              const visualRangeEnd = isRange ? (rangeValue.end ?? previewEnd) : null;

              const isStart = sameDay(day, visualRangeStart);
              const isEnd = isRange && sameDay(day, visualRangeEnd);
              const isSelected = isStart || isEnd;
              const inRange = isRange && isBetween(day, visualRangeStart, visualRangeEnd);
              const isWithinRange =
                isRange &&
                Boolean(
                  visualRangeStart &&
                    visualRangeEnd &&
                    day.getTime() >= visualRangeStart.getTime() &&
                    day.getTime() <= visualRangeEnd.getTime(),
                );
              const isToday = sameDay(day, normalizeDate(new Date()));
              const isFocusedDay = sameDay(day, focusedDate);
              const key = toKey(day);

              const longDate = formatLongDate(day);
              let dayAriaLabel = longDate;
              if (isRange && rangeValue.start && sameDay(day, rangeValue.start)) {
                dayAriaLabel = `Start date: ${longDate}`;
              } else if (isRange && rangeValue.end && sameDay(day, rangeValue.end)) {
                dayAriaLabel = `End date: ${longDate}`;
              }

              return (
                <button
                  key={key}
                  ref={(node) => {
                    dayRefs.current[key] = node;
                  }}
                  type="button"
                  role="gridcell"
                  className="dsn-date-time-picker-day"
                  data-selected={isSelected || undefined}
                  data-in-range={inRange || undefined}
                  data-within-range={isWithinRange || undefined}
                  data-range-start={isRange && isStart ? true : undefined}
                  data-range-end={isRange && isEnd ? true : undefined}
                  data-today={isToday || undefined}
                  data-outside-month={!isInViewMonth || undefined}
                  aria-selected={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={dayAriaLabel}
                  tabIndex={isFocusedDay ? 0 : -1}
                  onClick={() => handleSelectDay(day)}
                  onFocus={() => setFocusedDate(day)}
                  onMouseEnter={() => {
                    if (isRange && rangeValue.start && !rangeValue.end) {
                      setHoveredRangeDay(day);
                    }
                  }}
                  onKeyDown={(event) => {
                    let nextFocus: Date | null = null;
                    if (event.key === 'ArrowRight') nextFocus = addDays(day, 1);
                    if (event.key === 'ArrowLeft') nextFocus = addDays(day, -1);
                    if (event.key === 'ArrowDown') nextFocus = addDays(day, 7);
                    if (event.key === 'ArrowUp') nextFocus = addDays(day, -7);
                    if (event.key === 'Home') nextFocus = addDays(day, -day.getDay());
                    if (event.key === 'End') nextFocus = addDays(day, 6 - day.getDay());
                    if (event.key === 'PageUp') {
                      const target = addMonths(day, -1);
                      nextFocus = new Date(target.getFullYear(), target.getMonth(), day.getDate());
                    }
                    if (event.key === 'PageDown') {
                      const target = addMonths(day, 1);
                      nextFocus = new Date(target.getFullYear(), target.getMonth(), day.getDate());
                    }

                    if (nextFocus) {
                      event.preventDefault();
                      const normalized = normalizeDate(nextFocus);
                      setFocusedDate(normalized);
                      setViewDate(getMonthStart(normalized));
                      setTimeout(() => focusDay(normalized), 0);
                      return;
                    }

                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectDay(day);
                      return;
                    }

                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setOpen(false);
                      triggerRef.current?.focus();
                    }
                  }}
                >
                  <span className="dsn-date-time-picker-day-inner" aria-hidden="true">{day.getDate()}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {withTime && (
        <div className="dsn-date-time-picker-time-bar">
          <div className="dsn-date-time-picker-time-hour">
            <Combobox
              id={timeComboboxId}
              label="Hour"
              showLabel={false}
              showHelper={false}
              placeholder="07:00"
              helperText=""
              selectionMode="single"
              value={timeInput}
              options={TIME_OPTIONS.map((option) => ({ value: option, label: option }))}
              onChange={(nextValue) => setTimeInput(nextValue)}
              onInputChange={(query) => setTimeInput(query)}
              onEnter={(query) => {
                const resolved = resolveTimeInput(query, meridiem);
                setTimeInput(resolved.time);
                setMeridiem(resolved.meridiem);
                const date = resolveSingleDisplayDate();
                if (date) {
                  setSingleDraft(formatDateTime(date, resolved.time, resolved.meridiem));
                }
                setOpen(false);
              }}
              showClearButton={false}
              aria-label="Select time"
              className="dsn-date-time-picker-time-combobox"
            />
          </div>
          <div className="dsn-date-time-picker-time-meridiem">
            <SegmentControl
              fullWidth={false}
              aria-label="Select meridiem"
              value={meridiem}
              onChange={setMeridiem}
              options={[
                { value: 'AM', label: 'AM' },
                { value: 'PM', label: 'PM' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (!isPopoverMode) {
    return (
      <div
        ref={rootRef}
        className={['dsn-date-time-picker', className].filter(Boolean).join(' ')}
        data-error={error || undefined}
        data-disabled={disabled || undefined}
      >
        {label && (
          <p id={labelId} className="dsn-date-time-picker-label">
            {label}
          </p>
        )}
        {resolvedPresets.length > 0 && (
          <div className="dsn-date-time-picker-presets">
            <ChipGroup label="Quick date presets">
              {resolvedPresets.map((preset) => (
                <Chip
                  key={preset.id}
                  size="md"
                  label={preset.label}
                  showLeadingIcon={false}
                  showTrailingIcon={false}
                  selected={activePresetId === preset.id}
                  onClick={() => selectPreset(preset)}
                />
              ))}
            </ChipGroup>
          </div>
        )}
        <div role="dialog" aria-label={isRange ? 'Choose date range' : 'Choose date'}>
          {content}
        </div>
        {helperContent && (
          <div className="dsn-date-time-picker-meta">
            {helperIcon && <span className="dsn-date-time-picker-meta-icon">{helperIcon}</span>}
            <p id={helperId} className="dsn-date-time-picker-helper">
              {helperContent}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={['dsn-date-time-picker', className].filter(Boolean).join(' ')}
      data-error={effectiveError || undefined}
      data-disabled={disabled || undefined}
      data-open={isOpen || undefined}
    >
      {!isRange && (
        <label id={labelId} className="dsn-date-time-picker-label" htmlFor={`${pickerId}-single`}>
          {label}
          {optional && (
            <span className="dsn-date-time-picker-optional"> (optional)</span>
          )}
        </label>
      )}

      <div className="dsn-date-time-picker-control-wrap">
        {!isRange && (
          <div ref={singleControlRef} className="dsn-date-time-picker-control">
            <span className="dsn-date-time-picker-leading-icon" aria-hidden="true">
              <CalendarIcon />
            </span>
            <input
              ref={triggerRef}
              id={`${pickerId}-single`}
              role="combobox"
              className="dsn-date-time-picker-control-input"
              placeholder={placeholder}
              value={singleDraft}
              onChange={(event) => {
                setInputValidationError(null);
                const input = event.target;
                const value = input.value;
                const digits = getDateDigits(value);
                const hasLetters = /[a-zA-Z]/.test(value);
                if (hasLetters || digits.length !== value.replace(/-/g, '').length) {
                  setSingleDraft(value);
                  return;
                }
                const limited = digits.slice(0, 8);
                const draft = formatDateDraft(limited);
                setSingleDraft(draft);
                requestAnimationFrame(() => {
                  input.setSelectionRange(draft.length, draft.length);
                });
              }}
              disabled={disabled}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy ?? labelId}
              aria-required={!optional || undefined}
              aria-invalid={effectiveError || undefined}
              aria-describedby={helperContent ? helperId : undefined}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-controls={isOpen ? dialogId : undefined}
              onFocus={() => {
                if (!disabled) {
                  setOpen(true);
                }
              }}
              onClick={() => {
                if (!disabled) {
                  setOpen(true);
                }
              }}
              onKeyDown={(event) => {
                const input = event.target as HTMLInputElement;
                const len = input.value.length;
                const allSelected =
                  len > 0 &&
                  (input.selectionStart ?? 0) === 0 &&
                  (input.selectionEnd ?? 0) === len;
                const cursorAtEnd =
                  input.selectionStart === input.selectionEnd &&
                  (input.selectionStart ?? 0) === len;

                if (event.key === 'Enter') {
                  event.preventDefault();
                  const raw = input.value.trim();
                  const datePart = withTime ? (raw.split(/\s+/)[0] ?? '').trim() : raw;
                  const parsed = raw
                    ? parseNaturalLanguageDate(datePart, refDate) ?? parseDateInput(datePart)
                    : null;
                  if (parsed) {
                    commitInputValue(raw, 'single');
                    confirmSelection(parsed);
                  } else {
                    if (raw && looksLikeDateInput(datePart)) {
                      setInputValidationError('Enter a valid date');
                    } else {
                      setOpen(true);
                    }
                  }
                  return;
                }
                if (event.key === 'Backspace' || event.key === 'Delete') {
                  if (allSelected || (event.key === 'Backspace' && cursorAtEnd && len > 0)) {
                    event.preventDefault();
                    setSingleDraft('');
                    setInputValidationError(null);
                    emitChange(null);
                    return;
                  }
                }
                if (event.key === 'Backspace' && input.selectionStart === input.selectionEnd) {
                  const pos = input.selectionStart ?? 0;
                  if (pos === 3 || pos === 6) {
                    event.preventDefault();
                    setInputValidationError(null);
                    const digits = getDateDigits(singleDraft);
                    const hyphenCount = (singleDraft.slice(0, pos).match(/-/g) ?? []).length;
                    const digitIndex = pos - hyphenCount;
                    const newDigits = digits.slice(0, Math.max(0, digitIndex - 1));
                    const newDraft = formatDateDraft(newDigits);
                    setSingleDraft(newDraft);
                    requestAnimationFrame(() => {
                      input.setSelectionRange(newDraft.length, newDraft.length);
                    });
                  } else {
                    setInputValidationError(null);
                  }
                  return;
                }
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setOpen(true);
                }
                if (event.key === 'Escape') {
                  setOpen(false);
                }
              }}
              onBlur={(event) => commitInputValue(event.target.value, 'single')}
            />
            {singleDraft && !disabled && (
              <button
                type="button"
                className="dsn-date-time-picker-clear-button"
                aria-label="Clear date value"
                onClick={() => {
                  setSingleDraft('');
                  setInputValidationError(null);
                  emitChange(null);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}

        {isRange && (
          <div ref={rangeControlWrapRef} className="dsn-date-time-picker-range-fields">
            <div className="dsn-date-time-picker-range-field">
              <label className="dsn-date-time-picker-range-field-label" htmlFor={`${pickerId}-start`}>
                Start
              </label>
              <div className="dsn-date-time-picker-control">
                <span className="dsn-date-time-picker-leading-icon" aria-hidden="true">
                  <CalendarIcon />
                </span>
                <input
                  ref={triggerRef}
                  id={`${pickerId}-start`}
                  role="combobox"
                  className="dsn-date-time-picker-control-input"
                  placeholder={startPlaceholder}
                  value={startDraft}
                  onChange={(event) => setStartDraft(event.target.value)}
                  disabled={disabled}
                  aria-label={ariaLabel ?? 'Start date'}
                  aria-required={!optional || undefined}
                  aria-invalid={error || undefined}
                  aria-describedby={helperContent ? helperId : undefined}
                  aria-haspopup="dialog"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? dialogId : undefined}
                  onFocus={() => {
                    if (!disabled) {
                      setOpen(true);
                    }
                  }}
                  onClick={() => {
                    if (!disabled) {
                      setOpen(true);
                    }
                  }}
                  onBlur={(event) => commitInputValue(event.target.value, 'range-start')}
                />
              </div>
            </div>

            <div className="dsn-date-time-picker-range-field">
              <label className="dsn-date-time-picker-range-field-label" htmlFor={`${pickerId}-end`}>
                End
              </label>
              <div className="dsn-date-time-picker-control">
                <span className="dsn-date-time-picker-leading-icon" aria-hidden="true">
                  <CalendarIcon />
                </span>
                <input
                  id={`${pickerId}-end`}
                  className="dsn-date-time-picker-control-input"
                  placeholder={endPlaceholder}
                  value={endDraft}
                  onChange={(event) => setEndDraft(event.target.value)}
                  disabled={disabled}
                  aria-label="End date"
                  aria-required={!optional || undefined}
                  aria-invalid={error || undefined}
                  aria-describedby={helperContent ? helperId : undefined}
                  onFocus={() => {
                    if (!disabled) {
                      setOpen(true);
                    }
                  }}
                  onClick={() => {
                    if (!disabled) {
                      setOpen(true);
                    }
                  }}
                  onBlur={(event) => commitInputValue(event.target.value, 'range-end')}
                />
              </div>
            </div>
          </div>
        )}

        {isOpen && !disabled && (
          <PopoverWrapper
            id={dialogId}
            role="dialog"
            aria-label={isRange ? 'Choose date range' : 'Choose date'}
            className="dsn-date-time-picker-popover"
            contentClassName="dsn-date-time-picker-popover-content"
            contentPadding="none"
            anchorRef={popoverAnchorRef}
            offset={4}
            width={320}
            matchAnchorWidth={false}
            minWidth={192}
            onExternalScroll={() => setOpen(false)}
            segment={
              resolvedPresets.length > 0 ? (
                <div className="dsn-date-time-picker-presets">
                  <ChipGroup label="Date shortcuts">
                    {resolvedPresets.map((preset) => (
                      <Chip
                        key={preset.id}
                        size="md"
                        label={preset.label}
                        showLeadingIcon={false}
                        showTrailingIcon={false}
                        selected={activePresetId === preset.id}
                        onClick={() => selectPreset(preset)}
                      />
                    ))}
                  </ChipGroup>
                </div>
              ) : undefined
            }
            content={<div>{content}</div>}
            bottomBar={
              showActionBar ? (
                <Toolbar
                  size="md"
                  leftActions={null}
                  rightActions={
                    <ButtonGroup size="md" spaceBetween aria-label="Date picker actions">
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          onCancel?.();
                          setOpen(false);
                        }}
                      >
                        {cancelLabel}
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => confirmSelection()}
                      >
                        {confirmLabel}
                      </Button>
                    </ButtonGroup>
                  }
                />
              ) : undefined
            }
          />
        )}
      </div>

      {helperContent && (
        <div className="dsn-date-time-picker-meta">
          {helperIcon && <span className="dsn-date-time-picker-meta-icon">{helperIcon}</span>}
          <p id={helperId} className="dsn-date-time-picker-helper">
            {helperContent}
          </p>
        </div>
      )}
    </div>
  );
}

export default DateTimePicker;

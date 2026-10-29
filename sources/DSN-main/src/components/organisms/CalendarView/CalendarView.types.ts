export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  /** Event fill — maps to FullCalendar `backgroundColor`. */
  color?: string;
  /** Event border — maps to FullCalendar `borderColor`. Falls back to `color`. */
  borderColor?: string;
  /** Event label — maps to FullCalendar `textColor`. */
  textColor?: string;
  /** Extra classes on the rendered event (e.g. status variants). */
  classNames?: string | string[];
  allDay?: boolean;
  meta?: Record<string, unknown>;
}

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarViewProps {
  events: CalendarEvent[];
  defaultView?: CalendarViewMode;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (start: Date, end: Date) => void;
  locale?: string;
  firstDay?: 0 | 1;
  height?: string | number;
  className?: string;
}

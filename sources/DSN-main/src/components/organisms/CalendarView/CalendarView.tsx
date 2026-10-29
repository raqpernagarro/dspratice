import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventApi, EventClickArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { Button } from '../../atoms/Button';
import { ButtonGroup } from '../../atoms/ButtonGroup';
import { SegmentControl, type SegmentControlOption } from '../../atoms/SegmentControl';
import {
  StyledCalendarBody,
  StyledCalendarGrid,
  StyledCalendarHeader,
  StyledCalendarHeaderEnd,
  StyledCalendarHeaderStart,
  StyledCalendarTitle,
  StyledCalendarWrapper,
} from './CalendarView.styles';
import type { CalendarEvent, CalendarViewMode, CalendarViewProps } from './CalendarView.types';

const VIEW_MAP: Record<CalendarViewMode, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
  agenda: 'listWeek',
};

const VIEW_SEGMENT_OPTIONS: SegmentControlOption[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'agenda', label: 'List' },
];

function toFullCalendarEvent(event: CalendarEvent): EventInput {
  const borderColor = event.borderColor ?? event.color;
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.color,
    borderColor,
    textColor: event.textColor,
    classNames: event.classNames,
    extendedProps: {
      meta: event.meta,
    },
  };
}

function fromFullCalendarEvent(fcEvent: EventApi): CalendarEvent {
  const start = fcEvent.start ?? new Date();
  const end = fcEvent.end ?? start;

  return {
    id: fcEvent.id,
    title: fcEvent.title,
    start,
    end,
    color: fcEvent.backgroundColor || undefined,
    borderColor: fcEvent.borderColor || undefined,
    textColor: fcEvent.textColor || undefined,
    classNames: fcEvent.classNames,
    allDay: fcEvent.allDay,
    meta: fcEvent.extendedProps.meta as Record<string, unknown> | undefined,
  };
}

function CalendarView({
  events,
  defaultView = 'month',
  onEventClick,
  onSlotClick,
  locale,
  firstDay = 1,
  height = '100%',
  className,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(defaultView);
  const [title, setTitle] = useState('');

  const fullCalendarEvents = useMemo(
    () => events.map(toFullCalendarEvent),
    [events],
  );

  useEffect(() => {
    setViewMode(defaultView);
    calendarRef.current?.getApi().changeView(VIEW_MAP[defaultView]);
  }, [defaultView]);

  const handleEventClick = (info: EventClickArg) => {
    onEventClick?.(fromFullCalendarEvent(info.event));
  };

  const handleDateClick = (info: DateClickArg) => {
    onSlotClick?.(info.date, info.date);
  };

  const handleDatesSet = useCallback((arg: { view: { title: string } }) => {
    setTitle(arg.view.title);
  }, []);

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  const handleViewChange = (value: string) => {
    const mode = value as CalendarViewMode;
    setViewMode(mode);
    calendarRef.current?.getApi().changeView(VIEW_MAP[mode]);
  };

  return (
    <StyledCalendarWrapper className={className}>
      <StyledCalendarHeader>
        <StyledCalendarHeaderStart>
          <ButtonGroup size="md" aria-label="Calendar navigation">
            <Button
              variant="secondary"
              size="md"
              showLeadingIcon
              leadingIcon={<ChevronLeft size={16} strokeWidth={1.5} />}
              showLabel={false}
              aria-label="Go to previous period"
              onClick={handlePrev}
            />
            <Button
              variant="secondary"
              size="md"
              showLeadingIcon
              leadingIcon={<ChevronRight size={16} strokeWidth={1.5} />}
              showLabel={false}
              aria-label="Go to next period"
              onClick={handleNext}
            />
          </ButtonGroup>
          <Button variant="secondary" size="md" onClick={handleToday}>
            Today
          </Button>
        </StyledCalendarHeaderStart>

        <StyledCalendarTitle>{title}</StyledCalendarTitle>

        <StyledCalendarHeaderEnd>
          <SegmentControl
            options={VIEW_SEGMENT_OPTIONS}
            value={viewMode}
            onChange={handleViewChange}
            fullWidth={false}
            aria-label="Calendar view"
          />
        </StyledCalendarHeaderEnd>
      </StyledCalendarHeader>

      <StyledCalendarBody>
        <StyledCalendarGrid>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={VIEW_MAP[defaultView]}
            headerToolbar={false}
            events={fullCalendarEvents}
            eventClick={onEventClick ? handleEventClick : undefined}
            dateClick={onSlotClick ? handleDateClick : undefined}
            selectable={Boolean(onSlotClick)}
            datesSet={handleDatesSet}
            locale={locale}
            firstDay={firstDay}
            height={height}
          />
        </StyledCalendarGrid>
      </StyledCalendarBody>
    </StyledCalendarWrapper>
  );
}

export { CalendarView };

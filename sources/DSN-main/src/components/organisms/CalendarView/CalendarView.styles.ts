import styled from 'styled-components';

export const StyledCalendarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-family: var(--font-family-default);
  gap: var(--space-md);
`;

export const StyledCalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
`;

export const StyledCalendarHeaderStart = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  flex: 1 1 auto;
  min-width: 0;
`;

export const StyledCalendarTitle = styled.h2`
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
  color: var(--color-foreground-neutral-primary);
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
  line-height: var(--font-line-height-body-md);
`;

export const StyledCalendarHeaderEnd = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1 1 auto;
  min-width: 0;
`;

export const StyledCalendarBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
`;

export const StyledCalendarGrid = styled.div`
  width: 100%;
  height: 100%;
  font-family: var(--font-family-default);

  --fc-border-color: var(--color-border-neutral-primary);
  --fc-page-bg-color: var(--color-background-neutral-primary);
  --fc-today-bg-color: var(--color-background-interactive-secondary-selected);
  --fc-event-bg-color: var(--color-background-interactive-secondary-selected);
  --fc-event-border-color: var(--color-border-interactive-secondary-selected);
  --fc-event-text-color: var(--color-foreground-interactive-primary-selected);
  --fc-neutral-bg-color: var(--color-background-neutral-secondary);
  --fc-list-event-hover-bg-color: var(--color-background-neutral-tertiary);

  .fc-header-toolbar {
    display: none;
  }

  .fc-col-header-cell {
    color: var(--color-foreground-neutral-secondary);
    font-size: var(--font-size-body-sm);
    font-weight: var(--font-weight-medium);
    background: var(--color-background-neutral-secondary);
  }

  .fc-daygrid-day-number,
  .fc-timegrid-slot-label {
    color: var(--color-foreground-neutral-secondary);
    font-size: var(--font-size-body-sm);
  }

  .fc-day-today .fc-daygrid-day-number {
    color: var(--color-foreground-accent-strong);
    font-weight: var(--font-weight-semibold);
  }

  .fc-event,
  .fc-daygrid-event,
  .fc-timegrid-event {
    background-color: var(--color-background-interactive-secondary-selected);
    border-color: var(--color-border-interactive-secondary-selected);
    color: var(--color-foreground-interactive-primary-selected);
  }

  .fc-event {
    border-radius: var(--shape-radius-sm);
    font-size: var(--font-size-micro);
    font-weight: var(--font-weight-medium);
    padding: var(--primitive-size-1) var(--space-2xs);
    cursor: pointer;
  }

  /* Inherit event textColor from FullCalendar (e.g. tag status tokens on custom events). */
  .fc-event-title,
  .fc-event-time {
    color: inherit;
  }

  .fc-list-event:hover td {
    background-color: var(--color-background-neutral-tertiary);
  }

  .fc-list-event-dot {
    border-color: var(--color-foreground-accent-strong);
  }

  .fc-list-event-title,
  .fc-list-event-title a {
    color: inherit;
  }

  .fc-list-day-text,
  .fc-list-day-side-text {
    color: var(--color-foreground-accent-strong);
    font-weight: var(--font-weight-semibold);
  }
`;

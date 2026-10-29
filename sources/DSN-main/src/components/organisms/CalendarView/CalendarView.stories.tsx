import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CalendarView } from './CalendarView';
import type { CalendarEvent } from './CalendarView.types';
import spec from './CalendarView.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

function buildSampleEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const day = (date: number, hours = 0, minutes = 0) =>
    new Date(year, month, date, hours, minutes);

  return [
    {
      id: '1',
      title: 'Company holiday',
      start: day(1, 0, 0),
      end: day(1, 23, 59),
      allDay: true,
    },
    {
      id: '2',
      title: 'Product roadmap review',
      start: day(8, 9, 0),
      end: day(8, 10, 30),
    },
    {
      id: '3',
      title: 'Design critique session',
      start: day(14, 14, 0),
      end: day(14, 16, 0),
    },
    {
      id: '4',
      title: 'Customer summit',
      start: day(20, 0, 0),
      end: day(21, 23, 59),
      allDay: true,
    },
    {
      id: '5',
      title: 'Engineering sprint planning',
      start: day(22, 11, 0),
      end: day(22, 12, 30),
    },
    {
      id: '6',
      title: 'Quarterly business review',
      start: day(28, 13, 0),
      end: day(28, 17, 0),
    },
  ];
}

const calendarContainerStyle = {
  height: 640,
  width: '100%',
} as const;

const meta: Meta<typeof CalendarView> = {
  title: 'Data Display/Calendar View',
  component: CalendarView,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={calendarContainerStyle}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    defaultView: {
      control: 'select',
      options: ['month', 'week', 'day', 'agenda'],
    },
    onEventClick: { action: 'eventClick' },
    onSlotClick: { action: 'slotClick' },
  },
  args: {
    events: buildSampleEvents(),
    height: '100%',
    onEventClick: fn(),
    onSlotClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CalendarView>;

export const Playground: Story = {
};

export const Month: Story = {
  name: 'Month',
  args: {
    defaultView: 'month',
  },
};

export const Week: Story = {
  name: 'Week',
  args: {
    defaultView: 'week',
  },
};

export const Day: Story = {
  name: 'Day',
  args: {
    defaultView: 'day',
  },
};

export const Agenda: Story = {
  name: 'Agenda',
  args: {
    defaultView: 'agenda',
  },
};

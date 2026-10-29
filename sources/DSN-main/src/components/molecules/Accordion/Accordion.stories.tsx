import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from './Accordion';
import spec from './Accordion.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Accordion> = {
  title: 'Layout/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
  args: {
    title: 'Title',
    disclosure: 'left',
    bordered: false,
    defaultExpanded: true,
    disabled: false,
    children: <ContentSlot />,
  },
  argTypes: {
    disclosure: { control: 'inline-radio', options: ['left', 'right'] },
    bordered: { control: 'boolean' },
    defaultExpanded: { control: 'boolean' },
    disabled: { control: 'boolean' },
    expanded: { table: { disable: true } },
    children: { control: false },
  },
  // Remount when `defaultExpanded` changes so the control takes effect on an uncontrolled accordion.
  render: (args) => <Accordion key={String(args.defaultExpanded)} {...args} />,
};

export default meta;
type Story = StoryObj<typeof Accordion>;

function ContentSlot() {
  return <div className="dsn-accordion-story-content-slot">Content slot</div>;
}

const TITLES = ['General settings', 'Notifications', 'Privacy', 'Appearance'];

export const Playground: Story = {};

/** Disclosure on the left or right, without and with a border. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {(['left', 'right'] as const).flatMap((disclosure) =>
        [false, true].map((bordered) => (
          <Accordion key={`${disclosure}-${bordered}`} {...args} disclosure={disclosure} bordered={bordered} title={`${disclosure}${bordered ? ', bordered' : ''}`} />
        )),
      )}
    </div>
  ),
};

/** A settings list: borderless accordions stack flush, bordered ones get a gap. */
export const Stacked: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: args.bordered ? 8 : 0 }}>
      {TITLES.map((title) => (
        <Accordion key={title} {...args} title={title} defaultExpanded={false} />
      ))}
    </div>
  ),
  args: { disclosure: 'right' },
};

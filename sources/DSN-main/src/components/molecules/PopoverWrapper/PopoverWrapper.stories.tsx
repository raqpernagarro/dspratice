import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button';
import { ChoiceList, type ChoiceListSection } from '../../molecules/ChoiceList';
import { SearchBar } from '../../atoms/SearchBar';
import { SectionHeader } from '../../atoms/SectionHeader';
import { SegmentControl } from '../../atoms/SegmentControl';
import { PopoverWrapper } from './PopoverWrapper';
import spec from './PopoverWrapper.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const defaultChoiceListSections: ChoiceListSection[] = [
  {
    id: 'options',
    title: 'Options',
    items: [
      { id: 'opt-1', kind: 'menu-cell', props: { label: 'Edit', showLeadingIcon: true } },
      { id: 'opt-2', kind: 'menu-cell', props: { label: 'Duplicate', showLeadingIcon: true } },
      { id: 'opt-3', kind: 'menu-cell', props: { label: 'Share', showLeadingIcon: true } },
      { id: 'opt-4', kind: 'menu-cell', props: { label: 'Delete', showLeadingIcon: true } },
    ],
  },
];

const meta: Meta<typeof PopoverWrapper> = {
  title: 'Overlays/Popover Wrapper',
  component: PopoverWrapper,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof PopoverWrapper>;

export const Playground: Story = {
  args: {
    role: 'menu',
    'aria-label': 'Options menu',
    contentPadding: 'small',
    content: (
      <ChoiceList sections={defaultChoiceListSections} showSectionHeaders={true} />
    ),
  },
};

export const FullSlots: Story = {
  args: {
    role: 'dialog',
    'aria-label': 'Full slot popover',
    header: <SectionHeader size="medium" title="Title" />,
    segment: (
      <div style={{ padding: 'var(--space-xs)' }}>
        <SegmentControl
          fullWidth
          options={[
            { value: 'first', label: 'Label' },
            { value: 'second', label: 'Label' },
          ]}
        />
      </div>
    ),
    search: (
      <div style={{ padding: 'var(--space-xs)' }}>
        <SearchBar variant="ghost" placeholder="Search" aria-label="Search" />
      </div>
    ),
    content: (
      <div role="menu" aria-label="Options">
        <ChoiceList sections={defaultChoiceListSections} showSectionHeaders={true} />
      </div>
    ),
    bottomBar: (
      <div style={{ padding: 'var(--space-xs)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="md">
          Confirm
        </Button>
      </div>
    ),
  },
};

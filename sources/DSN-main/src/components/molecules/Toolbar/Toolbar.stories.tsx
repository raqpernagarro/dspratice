import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button';
import { Checkbox } from '../../atoms/Checkbox';
import { SearchBar } from '../../atoms/SearchBar';
import { SegmentControl } from '../../atoms/SegmentControl';
import { Toolbar } from './Toolbar';
import spec from './Toolbar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Toolbar> = {
  title: 'Actions/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  argTypes: {
    size: {
      control: 'select',
      options: ['lg', 'md', 'sm'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Playground: Story = {
  args: {
    size: 'lg',
    leftActions: <Checkbox label="Label" showTrailingIcon={false} />,
    rightActions: (
      <>
        <Button variant="ghost" size="md">
          Cancel
        </Button>
        <Button variant="primary" size="md">
          Confirm
        </Button>
      </>
    ),
  },
};

export const FilterBar: Story = {
  args: {
    variant: 'filter-bar',
    size: 'md',
    leftActions: <SearchBar variant="ghost" placeholder="Search filters" aria-label="Search filters" />,
    rightActions: (
      <>
        <Button variant="secondary" size="md">
          Clear
        </Button>
        <Button variant="primary" size="md">
          Apply
        </Button>
      </>
    ),
  },
};

export const FilterBarWithViewSwitcher: Story = {
  args: {
    variant: 'filter-bar',
    size: 'md',
    leftActions: (
      <>
        <SegmentControl
          aria-label="View"
          defaultValue="table"
          options={[
            { value: 'table', label: 'Table' },
            { value: 'board', label: 'Board' },
          ]}
        />
        <SearchBar variant="ghost" placeholder="Search projects" aria-label="Search projects" />
      </>
    ),
    rightActions: (
      <>
        <Button variant="secondary" size="md">
          Status
        </Button>
        <Button variant="secondary" size="md">
          Client
        </Button>
      </>
    ),
  },
};

export const SmallToolbar: Story = {
  args: {
    size: 'sm',
    leftActions: <Checkbox label="Label" size="sm" showTrailingIcon={false} />,
    rightActions: (
      <>
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button variant="primary" size="sm">
          Confirm
        </Button>
      </>
    ),
  },
};

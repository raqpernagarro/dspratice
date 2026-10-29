import { useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutDashboard, LayoutGrid, List, Map } from 'lucide-react';
import { Button } from '../../atoms/Button';
import type { ChoiceListItem, ChoiceListSection } from '../../molecules/ChoiceList';
import { PopoverMenu, type PopoverMenuProps } from './PopoverMenu';
import spec from './PopoverMenu.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const VIEW_MODE_OPTIONS = [
  { label: 'List', icon: <List size={16} aria-hidden="true" /> },
  { label: 'Grid', icon: <LayoutGrid size={16} aria-hidden="true" /> },
  { label: 'Board', icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { label: 'Timeline', icon: <Map size={16} aria-hidden="true" /> },
] as const;

function buildMenuCellSelectionItems(
  options: readonly { label: string; icon?: ReactNode }[],
  selectedIndex = 0,
): ChoiceListItem[] {
  return options.map((option, index) => ({
    id: `view-${index}`,
    kind: 'menu-cell' as const,
    props: {
      label: option.label,
      selected: index === selectedIndex,
      showLeadingIcon: Boolean(option.icon),
      leadingIcon: option.icon,
      showTrailingIcon: true,
    },
  }));
}

function buildRadioSection(
  id: string,
  title: string,
  labels: string[],
  checkedIndex = 0,
): ChoiceListSection {
  return {
    id,
    title,
    items: labels.map((label, index) => ({
      id: `${id}-${index}`,
      kind: 'radio-cell' as const,
      props: {
        label,
        checked: index === checkedIndex,
        showLeadingIcon: false,
        showTrailingIcon: false,
      },
    })),
  };
}

function buildCheckboxSection(
  id: string,
  title: string,
  labels: string[],
  checkedIndices: number[] = [],
): ChoiceListSection {
  return {
    id,
    title,
    items: labels.map((label, index) => ({
      id: `${id}-${index}`,
      kind: 'checkbox-cell' as const,
      props: {
        label,
        checked: checkedIndices.includes(index),
        showLeadingIcon: false,
        showTrailingIcon: false,
      },
    })),
  };
}

const menuCellSelectionItems = buildMenuCellSelectionItems(VIEW_MODE_OPTIONS, 1);

const sortRadioSections: ChoiceListSection[] = [
  buildRadioSection('sort-by', 'Sort by', ['Name', 'Date', 'Status'], 0),
  buildRadioSection('order', 'Order', ['Ascending', 'Descending'], 1),
];

const filterCheckboxSections: ChoiceListSection[] = [
  buildCheckboxSection('status', 'Status', ['Open', 'In progress', 'Done'], [0, 2]),
  buildCheckboxSection('priority', 'Priority', ['Low', 'Medium', 'High', 'Urgent'], [1, 3]),
];

const meta: Meta<typeof PopoverMenu> = {
  title: 'Overlays/Popover Menu',
  component: PopoverMenu,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof PopoverMenu>;

export const Playground: Story = {
  args: {
    variant: 'rich',
    showHeader: true,
    title: 'Title',
    showSegmentControl: true,
    showSearch: true,
    showBottomBar: true,
    choiceLists: [
      {
        id: 'list-a',
        showSectionHeaders: true,
        sections: [
          {
            id: 'a',
            title: 'Title',
            items: Array.from({ length: 4 }, (_, index) => ({
              id: `a-${index}`,
              kind: 'menu-cell' as const,
              props: { label: 'Label', showLeadingIcon: false, showTrailingIcon: false },
            })),
          },
        ],
      },
      {
        id: 'list-b',
        showSectionHeaders: true,
        sections: [
          {
            id: 'b',
            title: 'Title',
            items: Array.from({ length: 4 }, (_, index) => ({
              id: `b-${index}`,
              kind: 'menu-cell' as const,
              props: { label: 'Label', showLeadingIcon: false, showTrailingIcon: false },
            })),
          },
        ],
      },
    ],
  },
};

export const Simple: Story = {
  args: {
    variant: 'simple',
    showHeader: false,
  },
};

export const SingleSelect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Immediate single selection. Menu cells show a trailing checkmark; selection applies on row click and the popover closes. No bottom bar.',
      },
    },
  },
  args: {
    variant: 'rich',
    title: 'View mode',
    'aria-label': 'View mode',
    showHeader: true,
    showSegmentControl: true,
    segmentControlOptions: [
      { value: 'views', label: 'Views' },
      { value: 'saved', label: 'Saved' },
    ],
    showSearch: true,
    showBottomBar: false,
    choiceLists: [
      {
        id: 'view-mode',
        showSectionHeaders: true,
        sections: [
          {
            id: 'layouts',
            title: 'Layout',
            items: menuCellSelectionItems,
          },
        ],
      },
    ],
  },
};

export const SimpleSingleSelect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Compact immediate single selection. Flat list with trailing checkmarks; no header, search, segment, or bottom bar.',
      },
    },
  },
  args: {
    variant: 'simple',
    showHeader: false,
    'aria-label': 'View mode',
    simpleItems: menuCellSelectionItems,
  },
};

export const SectionRadioSelect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Deferred single selection per section. Radio cells with one choice per section; Cancel and Confirm apply the combined result.',
      },
    },
  },
  args: {
    variant: 'rich',
    title: 'Sort',
    'aria-label': 'Sort options',
    showHeader: true,
    showSegmentControl: false,
    showSearch: false,
    showBottomBar: true,
    choiceLists: [
      {
        id: 'sort',
        showSectionHeaders: true,
        sections: sortRadioSections,
      },
    ],
  },
};

const multiSelectArgs: PopoverMenuProps = {
  variant: 'rich',
  title: 'Filters',
  'aria-label': 'Filter options',
  showHeader: true,
  showSegmentControl: false,
  showSearch: false,
  showBottomBar: true,
  choiceLists: [
    {
      id: 'filters',
      showSectionHeaders: true,
      sections: filterCheckboxSections,
    },
  ],
};

function AnchoredMultiSelectHarness(args: PopoverMenuProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: 'var(--space-xl)', minHeight: '28rem' }}>
      <div ref={anchorRef}>
        <Button
          variant="secondary"
          size="md"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Filters
        </Button>
      </div>
      {open && (
        <PopoverMenu
          {...args}
          anchorRef={anchorRef}
          onEscape={() => {
            setOpen(false);
            anchorRef.current?.querySelector('button')?.focus();
          }}
        />
      )}
    </div>
  );
}

export const MultiSelect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Deferred multi-selection across sections. Checkbox cells with mixed checked states; header Clear appears when any filter is selected; Cancel and Confirm apply the selection.',
      },
    },
  },
  args: multiSelectArgs,
};

export const MultiSelectAnchored: Story = {
  render: (args) => <AnchoredMultiSelectHarness {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Supported app integration: pass `anchorRef` to `PopoverMenu` so one `PopoverWrapper` owns positioning and full popover width. Do not wrap `PopoverMenu` in another `PopoverWrapper`. Header Clear resets draft checkbox selection when any filter is active. Cancel and Confirm stay visible at `--popover-width-md`.',
      },
    },
  },
  args: multiSelectArgs,
};

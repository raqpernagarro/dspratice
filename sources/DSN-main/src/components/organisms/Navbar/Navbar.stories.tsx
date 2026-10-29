import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleHelp, Diamond, ChevronDown } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { Navbar } from './Navbar';
import spec from './Navbar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Navbar> = {
  title: 'Navigation/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['title', 'breadcrumbs'],
    },
    showDescription: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Navbar>;

function NavbarActions() {
  return (
    <>
      <Button variant="secondary" size="md" showLeadingIcon leadingIcon={<Diamond size={16} />}>
        Button
      </Button>
      <Button variant="secondary" size="md" showLeadingIcon leadingIcon={<Diamond size={16} />}>
        Button
      </Button>
      <Button
        variant="primary"
        size="md"
        showLeadingIcon
        showTrailingIcon
        leadingIcon={<Diamond size={16} />}
        trailingIcon={<ChevronDown size={16} />}
      >
        Button
      </Button>
    </>
  );
}

export const Playground: Story = {
  args: {
    variant: 'title',
    title: 'Title',
    rightActions: <NavbarActions />,
  },
};

export const TitleWithDescription: Story = {
  args: {
    variant: 'title',
    title: 'Title',
    showDescription: true,
    description: 'Description',
    descriptionIcon: <CircleHelp size={16} />,
    rightActions: <NavbarActions />,
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    variant: 'breadcrumbs',
    breadcrumbItems: [
      { id: 'home', label: 'Title', showDisclosure: false },
      { id: 'ellipsis', label: '...', variant: 'ellipsis', showDisclosure: false },
      { id: 'parent', label: 'Title', showDisclosure: false },
      { id: 'current', label: 'Title', variant: 'current' },
    ],
    rightActions: <NavbarActions />,
  },
};

export const WithLongBreadcrumbTrail: Story = {
  args: {
    variant: 'breadcrumbs',
    breadcrumbItems: [
      { id: 'root', label: 'Workspace', showDisclosure: false },
      { id: 'team', label: 'Design Systems', showDisclosure: false },
      { id: 'section', label: 'Component Library', showDisclosure: false },
      { id: 'group', label: 'Navigation', showDisclosure: false },
      { id: 'current', label: 'Navbar', variant: 'current' },
    ],
    rightActions: <NavbarActions />,
  },
};

export const ResponsiveBackOnlyAtMobile: Story = {
  args: {
    variant: 'breadcrumbs',
    breadcrumbItems: [
      { id: 'root', label: 'Workspace', showDisclosure: false },
      { id: 'team', label: 'Design Systems', showDisclosure: false },
      { id: 'section', label: 'Component Library', showDisclosure: false },
      { id: 'current', label: 'Navbar', variant: 'current' },
    ],
    backOnlyBreakpointPx: 640,
    rightActions: <NavbarActions />,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

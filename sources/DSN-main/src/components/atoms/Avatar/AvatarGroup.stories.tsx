import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from './Avatar';
import spec from './Avatar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const TEAM = [
  { name: 'Ana Costa', initials: 'AC' },
  { name: 'João Silva', initials: 'JS' },
  { name: 'Maria Nunes', initials: 'MN' },
  { name: 'Pedro Dias', initials: 'PD' },
  { name: 'Sara Ferreira', initials: 'SF' },
] as const;

const meta: Meta<typeof AvatarGroup> = {
  title: 'Data Display/Avatar Group',
  component: AvatarGroup,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    size: 'sm',
    maxVisible: 5,
    avatars: [...TEAM],
    showLabel: false,
    showButton: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xxs', 'xs', 'sm'],
      description: 'Size of each avatar in the stack.',
      table: { defaultValue: { summary: 'sm' } },
    },
    maxVisible: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Avatars shown before a "+N" overflow counter.',
      table: { defaultValue: { summary: '5' } },
    },
    showLabel: {
      control: 'boolean',
      description: 'Show the `label` text after the stack.',
      table: { defaultValue: { summary: 'false' } },
    },
    showButton: {
      control: 'boolean',
      description: 'Show an icon-only add-person button after the stack.',
      table: { defaultValue: { summary: 'false' } },
    },
    label: {
      control: 'text',
      description: 'Caption when `showLabel` is true (e.g. "12 members").',
    },
    avatars: { table: { disable: true } },
    className: { table: { disable: true } },
    'aria-label': { table: { disable: true } },
    buttonAriaLabel: { table: { disable: true } },
    onButtonClick: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', paddingBlock: 'var(--space-md)' }}>
      {(['xxs', 'xs', 'sm'] as const).map((size) => (
        <AvatarGroup key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', paddingBlock: 'var(--space-md)' }}>
      <AvatarGroup {...args} />
      <AvatarGroup
        {...args}
        avatars={[
          ...TEAM,
          { name: 'Carlos Melo', initials: 'CM' },
          { name: 'Rita Campos', initials: 'RC' },
          { name: 'Tiago Borges', initials: 'TB' },
        ]}
        maxVisible={5}
      />
      <AvatarGroup {...args} showLabel label="5 members" />
      <AvatarGroup {...args} showButton buttonAriaLabel="Add team member" />
    </div>
  ),
};

export const WithPictures: Story = {
  render: (args) => (
    <div style={{ paddingBlock: 'var(--space-md)' }}>
      <AvatarGroup
        {...args}
        maxVisible={4}
        avatars={[
          { name: 'Ana Costa', src: 'https://i.pravatar.cc/40?img=47', fill: 'picture' },
          { name: 'João Silva', src: 'https://i.pravatar.cc/40?img=12', fill: 'picture' },
          { name: 'Maria Nunes', src: 'https://i.pravatar.cc/40?img=5', fill: 'picture' },
          { name: 'Pedro Dias', src: 'https://i.pravatar.cc/40?img=32', fill: 'picture' },
          { name: 'Sara Ferreira', initials: 'SF' },
          { name: 'Carlos Melo', initials: 'CM' },
        ]}
      />
    </div>
  ),
};

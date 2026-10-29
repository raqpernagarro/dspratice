import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Switcher } from '../Switcher';
import { Tag } from '../Tag';
import { SectionHeader } from './SectionHeader';
import spec from './SectionHeader.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof SectionHeader> = {
  title: 'Layout/Section Header',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  argTypes: {
    size: {
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large'],
    },
    flush: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Playground: Story = {
  args: {
    size: 'large',
    title: 'Title',
  },
};

/** Smallest to largest. Match the size to the heading level of the section. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['xsmall', 'small', 'medium', 'large'] as const).map((size) => (
        <SectionHeader key={size} {...args} size={size} title={size} />
      ))}
    </div>
  ),
};

export const Flush: Story = {
  args: {
    size: 'medium',
    title: 'Title',
    flush: true,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          paddingInline: 'var(--space-md)',
          background: 'var(--color-background-neutral-secondary)',
        }}
      >
        <Story />
        <div
          style={{
            width: '100%',
            paddingBlock: 'var(--space-xs)',
            borderTop: 'var(--size-border-sm) solid var(--color-border-neutral-primary)',
            color: 'var(--color-foreground-neutral-secondary)',
            fontFamily: 'var(--font-family-default)',
            fontSize: 'var(--font-size-body-sm)',
          }}
        >
          Flush body content aligns with the title edge.
        </div>
      </div>
    ),
  ],
};

export const WithDescription: Story = {
  args: {
    size: 'large',
    title: 'Title',
    description: 'Description',
  },
};

export const WithActions: Story = {
  args: {
    size: 'large',
    title: 'Title',
    leadingControl: (
      <Button
        variant="ghost"
        size="md"
        showLabel={false}
        showLeadingIcon
        leadingIcon={<ChevronDown size={16} />}
        aria-label="Expand section"
      />
    ),
    trailingControl: (
      <ButtonGroup size="md" spaceBetween aria-label="Section actions">
        <Button variant="secondary" size="md">
          Action
        </Button>
        <Button
          variant="ghost"
          size="md"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<X size={16} />}
          aria-label="Close section"
        />
      </ButtonGroup>
    ),
  },
};

export const WithSwitcherAndTag: Story = {
  args: {
    size: 'large',
    title: 'Title',
    leadingControl: (
      <Button
        variant="ghost"
        size="md"
        showLabel={false}
        showLeadingIcon
        leadingIcon={<ChevronDown size={16} />}
        aria-label="Expand section"
      />
    ),
    trailingControl: (
      <>
        <Tag label="Label" variant="neutral" size="md" />
        <Switcher checked={false} onChange={() => {}} size="md" aria-label="Toggle setting" />
        <Button
          variant="ghost"
          size="md"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<X size={16} />}
          aria-label="Close section"
        />
      </>
    ),
  },
};

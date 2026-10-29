import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor, type RichTextEditorAttachment } from './RichTextEditor';
import { PlaceholderIcon } from '../../atoms/_dev/PlaceholderIcon';
import spec from './RichTextEditor.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const DEMO_ATTACHMENTS: RichTextEditorAttachment[] = [
  { id: 'file-1', fileName: 'Label', fileSize: '10 Mb' },
  { id: 'file-2', fileName: 'Label', fileSize: '10 Mb' },
];

const meta: Meta<typeof RichTextEditor> = {
  title: 'Inputs & Controls/Rich Text Editor',
  component: RichTextEditor,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

export const Playground: Story = {
  args: {
    label: 'Label',
    placeholder: 'Type here...',
    helperText: 'Help text',
    maxLength: 200,
    attachments: DEMO_ATTACHMENTS,
  },
};

export const CommentComposer: Story = {
  name: 'Comment composer (footer)',
  args: {
    label: 'Add a comment',
    placeholder: 'Write a comment…',
    helperText: '',
    showFooter: true,
    footerLabel: 'Notify followers',
    confirmLabel: 'Post comment',
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Description',
    helperText: 'Supports headings, lists and links.',
    helperIcon: <PlaceholderIcon />,
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('<p>Type here...</p>');

    return (
      <RichTextEditor
        label="Label"
        value={value}
        onChange={setValue}
        helperText="Help text"
        maxLength={300}
        attachments={DEMO_ATTACHMENTS}
      />
    );
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Label',
    readOnly: true,
    value: '<p>This content is read-only.</p>',
    helperText: 'You can review but not edit this content.',
    attachments: DEMO_ATTACHMENTS,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    disabled: true,
    value: '<p>Disabled editor value.</p>',
    helperText: 'Help text',
    attachments: DEMO_ATTACHMENTS,
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    error: true,
    errorMessage: 'Please add a more descriptive message.',
    maxLength: 40,
    value: '<p>This content intentionally exceeds the limit.</p>',
    attachments: DEMO_ATTACHMENTS,
  },
};

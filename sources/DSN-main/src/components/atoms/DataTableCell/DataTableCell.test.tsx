import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DataTableFieldType } from '../../../types/common';
import { DataTableCell } from './DataTableCell';

function getCell(container: HTMLElement) {
  const cell = container.querySelector('.dsn-data-table-cell');
  expect(cell).toBeTruthy();
  return cell as HTMLElement;
}

const actionNames = () => screen.queryAllByRole('button').map((button) => button.getAttribute('aria-label'));

describe('DataTableCell', () => {
  it('renders string cell content', () => {
    const { container } = render(<DataTableCell fieldType="string" value="Label" />);
    expect(getCell(container)).toHaveTextContent('Label');
  });

  it('renders number value with right alignment', () => {
    const { container } = render(<DataTableCell fieldType="number" value={12345} align="right" />);
    const cell = getCell(container);
    expect(cell).toHaveTextContent('12,345');
    expect(cell).toHaveAttribute('data-align', 'right');
  });

  it('resolves legacy aliases user → single-user and tag → tags-multi', () => {
    const { container, rerender } = render(
      <DataTableCell fieldType="user" value={{ name: 'Profile Name', initials: 'PN' }} />,
    );
    expect(getCell(container)).toHaveTextContent('Profile Name');
    expect(getCell(container)).toHaveAttribute('data-field-type', 'single-user');

    rerender(<DataTableCell fieldType="tag" value={['A']} />);
    expect(getCell(container)).toHaveAttribute('data-field-type', 'tags-multi');
  });

  it('renders loading skeleton when loading is true', () => {
    const { container } = render(<DataTableCell fieldType="string" loading />);
    expect(getCell(container).querySelector('.dsn-data-table-cell-skeleton')).toBeInTheDocument();
  });

  it.each<[DataTableFieldType, unknown, string]>([
    ['main', { name: 'Label' }, 'Label'],
    ['range', [1, 9], '1 — 9'],
    ['multi-choice', ['A', 'B'], 'A, B'],
    ['multi-user', [{ name: 'Ada' }, { name: 'Grace' }], 'Ada, Grace'],
    ['contact', { name: 'Profile Name' }, 'Profile Name'],
    ['contacts-list', [{ name: 'One' }, { name: 'Two' }], 'Two'],
    ['file', 'doc.pdf', 'doc.pdf'],
    ['tags-single', 'Open', 'Open'],
    ['url-readonly', 'https://link.com', 'https://link.com'],
    ['email', 'a@b.com', 'a@b.com'],
  ])('renders %s content', (fieldType, value, text) => {
    const { container } = render(<DataTableCell fieldType={fieldType} value={value} />);
    expect(getCell(container)).toHaveTextContent(text);
  });

  it('renders buttons field type', () => {
    const onClick = vi.fn();
    render(<DataTableCell fieldType="buttons" value={[{ label: 'Approve', onClick }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onClick).toHaveBeenCalled();
  });

  it.each<[DataTableFieldType, string[]]>([
    ['main', ['Open record', 'Open in side panel']],
    ['string', ['Copy value']],
    ['text', ['Copy value', 'Edit value', 'Delete value']],
    ['number', ['Edit value', 'Delete value']],
    ['date', ['Open date picker', 'Delete value']],
    ['single-user', ['Show options', 'Delete value']],
    ['tags-multi', ['Show options']],
    ['email', ['Send email', 'Copy value', 'Edit value', 'Delete value']],
    ['phone', ['Send message', 'Call', 'Edit value', 'Delete value']],
    ['file', ['Upload file', 'Delete value']],
    ['contacts-list', ['Add item', 'Delete value']],
    ['url', ['Edit value', 'Delete value']],
    ['url-readonly', ['Open link in new tab']],
    ['empty', []],
  ])('renders Figma hover actions for %s', (fieldType, expected) => {
    render(<DataTableCell fieldType={fieldType} value={fieldType === 'tags-multi' ? [] : 'x'} state="hover" />);
    expect(actionNames()).toEqual(expected);
  });

  it('does not render actions in default state unless revealActionsOnHover is set', () => {
    const { rerender } = render(<DataTableCell fieldType="number" value={1} />);
    expect(actionNames()).toEqual([]);
    rerender(<DataTableCell fieldType="number" value={1} revealActionsOnHover />);
    // Rendered but CSS-hidden until pointer hover / focus-within.
    const hidden = screen.queryAllByRole('button', { hidden: true }).map((button) => button.getAttribute('aria-label'));
    expect(hidden).toEqual(['Edit value', 'Delete value']);
  });

  it('fires onAction and copies to clipboard by default', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onAction = vi.fn();
    render(<DataTableCell fieldType="string" value="Hello" state="hover" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy value' }));
    expect(onAction).toHaveBeenCalledWith('copy', 'Hello', expect.anything());
    expect(writeText).toHaveBeenCalledWith('Hello');
  });

  it('skips the built-in behaviour when onAction prevents default', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <DataTableCell fieldType="string" value="Hello" state="hover" onAction={(_, __, event) => event.preventDefault()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy value' }));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('expand toggle reflects value and emits expand', () => {
    const onAction = vi.fn();
    render(<DataTableCell fieldType="expand" value onAction={onAction} />);
    const toggle = screen.getByRole('button', { name: 'Collapse row' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(onAction).toHaveBeenCalledWith('expand', true, expect.anything());
  });
});

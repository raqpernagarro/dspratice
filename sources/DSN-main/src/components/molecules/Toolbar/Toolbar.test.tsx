import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../../atoms/Button';
import { SearchBar } from '../../atoms/SearchBar';
import { SegmentControl } from '../../atoms/SegmentControl';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  it('renders left and right action areas', () => {
    render(
      <Toolbar
        leftActions={<button type="button">Left action</button>}
        rightActions={<button type="button">Right action</button>}
      />,
    );

    expect(screen.getByRole('toolbar', { name: 'Toolbar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Left action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Right action' })).toBeInTheDocument();
  });

  it('applies selected size variant', () => {
    render(<Toolbar size="sm" leftActions="Left" rightActions="Right" aria-label="Bottom actions" />);

    expect(screen.getByRole('toolbar', { name: 'Bottom actions' })).toHaveAttribute(
      'data-size',
      'sm',
    );
  });

  it('applies filter-bar variant data attribute', () => {
    render(<Toolbar variant="filter-bar" leftActions="Left" rightActions="Right" aria-label="Filter actions" />);

    expect(screen.getByRole('toolbar', { name: 'Filter actions' })).toHaveAttribute(
      'data-variant',
      'filter-bar',
    );
  });

  it('forces SegmentControl to hug content in filter-bar', () => {
    render(
      <Toolbar
        variant="filter-bar"
        leftActions={
          <SegmentControl
            fullWidth
            aria-label="View"
            options={[
              { value: 'table', label: 'Table' },
              { value: 'board', label: 'Board' },
            ]}
          />
        }
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'View' })).toHaveAttribute('data-full-width', 'false');
  });

  it('forces dsn button sizes to md for lg/md toolbars', () => {
    render(
      <Toolbar
        size="lg"
        rightActions={
          <Button variant="secondary" size="sm">
            Action
          </Button>
        }
      />,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('data-size', 'md');
  });

  it('forces dsn button sizes to sm for small toolbar', () => {
    render(
      <Toolbar
        size="sm"
        rightActions={
          <Button variant="secondary" size="md">
            Action
          </Button>
        }
      />,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('data-size', 'sm');
  });

  it('normalizes plain button variant to secondary in toolbar', () => {
    render(
      <Toolbar
        size="md"
        rightActions={
          <Button variant="plain" size="md">
            Cancel
          </Button>
        }
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-variant', 'secondary');
  });

  it('stretches a lone action only when singleActionFullWidth is set', () => {
    render(
      <Toolbar
        singleActionFullWidth
        rightActions={
          <Button variant="primary" size="md">
            Sign in
          </Button>
        }
        aria-label="Submit"
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: 'Submit' });
    expect(toolbar).toHaveAttribute('data-single-action', 'true');
    expect(toolbar.querySelector('.dsn-toolbar-side-left')).toBeEmptyDOMElement();
  });

  it('does not mark a bottom bar with more than one action as single-action', () => {
    render(
      <Toolbar
        rightActions={
          <>
            <Button variant="ghost" size="md">
              Cancel
            </Button>
            <Button variant="primary" size="md">
              Confirm
            </Button>
          </>
        }
        aria-label="Confirm"
      />,
    );

    expect(screen.getByRole('toolbar', { name: 'Confirm' })).not.toHaveAttribute('data-single-action');
  });

  it('keeps a lone action content-sized by default', () => {
    render(
      <Toolbar
        variant="plain"
        rightActions={
          <Button variant="secondary" size="sm">
            Upgrade
          </Button>
        }
        aria-label="Callout actions"
      />,
    );

    expect(screen.getByRole('toolbar', { name: 'Callout actions' })).not.toHaveAttribute(
      'data-single-action',
    );
  });

  it('forces a SearchBar to the ghost variant with no label or helper row', () => {
    render(
      <Toolbar
        variant="filter-bar"
        leftActions={<SearchBar label="Label" helperText="Help text" placeholder="Search people" />}
      />,
    );

    expect(screen.queryByText('Label')).not.toBeInTheDocument();
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Label' })).toBeInTheDocument();
  });
});

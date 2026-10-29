import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Star, AlertTriangle } from 'lucide-react';
import { Chip, ChipGroup } from './Chip';
import type { ChipSize } from './Chip';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderChip(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getChip(container: HTMLElement) {
  return container.querySelector('.dsn-chip') as HTMLElement;
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe('Chip — defaults', () => {
  it('renders a <div> element', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(getChip(container).tagName.toLowerCase()).toBe('div');
  });

  it('has class dsn-chip', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(getChip(container)).toBeTruthy();
  });

  it('defaults to size=md', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(getChip(container).dataset.size).toBe('md');
  });

  it('defaults to selected=false (data-selected is "false")', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(getChip(container).dataset.selected).toBe('false');
  });

  it('has role=checkbox', () => {
    renderChip(<Chip label="Active" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('has aria-checked=false by default', () => {
    renderChip(<Chip label="Active" />);
    const chip = screen.getByRole('checkbox');
    expect(chip.getAttribute('aria-checked')).toBe('false');
  });

  it('is focusable (tabIndex=0) by default', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(getChip(container).getAttribute('tabindex')).toBe('0');
  });

  it('renders the label text', () => {
    renderChip(<Chip label="In review" />);
    expect(screen.getByText('In review')).toBeInTheDocument();
  });
});

// ─── Label ────────────────────────────────────────────────────────────────────

describe('Chip — label', () => {
  it('renders the label inside dsn-chip-label', () => {
    const container = renderChip(<Chip label="Pending" />);
    const labelEl = container.querySelector('.dsn-chip-label') as HTMLElement;
    expect(labelEl.textContent).toBe('Pending');
  });

  it('renders long label text', () => {
    renderChip(<Chip label="In progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });
});

// ─── Sizes ────────────────────────────────────────────────────────────────────

describe('Chip — sizes', () => {
  const sizes: ChipSize[] = ['md', 'sm'];

  sizes.forEach((size) => {
    it(`sets data-size="${size}"`, () => {
      const container = renderChip(<Chip label="Label" size={size} />);
      expect(getChip(container).dataset.size).toBe(size);
    });
  });
});

// ─── Selected state ───────────────────────────────────────────────────────────

describe('Chip — selected state', () => {
  it('sets data-selected="true" when selected=true', () => {
    const container = renderChip(<Chip label="Active" selected={true} />);
    expect(getChip(container).dataset.selected).toBe('true');
  });

  it('sets data-selected="false" when selected=false', () => {
    const container = renderChip(<Chip label="Active" selected={false} />);
    expect(getChip(container).dataset.selected).toBe('false');
  });

  it('sets aria-checked="true" when selected=true', () => {
    renderChip(<Chip label="Active" selected={true} />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  });

  it('sets aria-checked="false" when selected=false', () => {
    renderChip(<Chip label="Active" selected={false} />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
  });
});

// ─── Disabled state ───────────────────────────────────────────────────────────

describe('Chip — disabled state', () => {
  it('sets aria-disabled="true" when disabled=true', () => {
    const container = renderChip(<Chip label="Active" disabled={true} />);
    expect(getChip(container).getAttribute('aria-disabled')).toBe('true');
  });

  it('does NOT set aria-disabled when disabled=false', () => {
    const container = renderChip(<Chip label="Active" disabled={false} />);
    expect(getChip(container).getAttribute('aria-disabled')).toBeNull();
  });

  it('is removed from tab order when disabled', () => {
    const container = renderChip(<Chip label="Active" disabled={true} />);
    expect(getChip(container).getAttribute('tabindex')).toBe('-1');
  });

  it('does NOT call onClick when disabled chip is clicked', () => {
    const onClick = vi.fn();
    const container = renderChip(<Chip label="Active" disabled={true} onClick={onClick} />);
    fireEvent.click(getChip(container));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ─── onClick interaction ──────────────────────────────────────────────────────

describe('Chip — onClick', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const container = renderChip(<Chip label="Active" onClick={onClick} />);
    fireEvent.click(getChip(container));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when no onClick provided', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(() => fireEvent.click(getChip(container))).not.toThrow();
  });
});

// ─── Keyboard interaction ─────────────────────────────────────────────────────

describe('Chip — keyboard interaction', () => {
  it('calls onClick on Space key', () => {
    const onClick = vi.fn();
    const container = renderChip(<Chip label="Active" onClick={onClick} />);
    fireEvent.keyDown(getChip(container), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Enter key', () => {
    const onClick = vi.fn();
    const container = renderChip(<Chip label="Active" onClick={onClick} />);
    fireEvent.keyDown(getChip(container), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick on Space key when disabled', () => {
    const onClick = vi.fn();
    const container = renderChip(<Chip label="Active" disabled={true} onClick={onClick} />);
    fireEvent.keyDown(getChip(container), { key: ' ' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does NOT call onClick on Enter key when disabled', () => {
    const onClick = vi.fn();
    const container = renderChip(<Chip label="Active" disabled={true} onClick={onClick} />);
    fireEvent.keyDown(getChip(container), { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does NOT call onClick on other keys (e.g. Tab)', () => {
    const onClick = vi.fn();
    const container = renderChip(<Chip label="Active" onClick={onClick} />);
    fireEvent.keyDown(getChip(container), { key: 'Tab' });
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ─── Leading icon ─────────────────────────────────────────────────────────────

describe('Chip — leading icon', () => {
  it('renders dsn-chip-leading by default', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(container.querySelector('.dsn-chip-leading')).toBeTruthy();
  });

  it('dsn-chip-leading is aria-hidden', () => {
    const container = renderChip(<Chip label="Active" />);
    const leading = container.querySelector('.dsn-chip-leading') as HTMLElement;
    expect(leading.getAttribute('aria-hidden')).toBe('true');
  });

  it('does NOT set data-icon on leading when no leadingIcon provided (CSS diamond)', () => {
    const container = renderChip(<Chip label="Active" />);
    const leading = container.querySelector('.dsn-chip-leading') as HTMLElement;
    expect(leading.getAttribute('data-icon')).toBeNull();
  });

  it('renders no SVG in leading when no custom icon (CSS diamond is ::before)', () => {
    const container = renderChip(<Chip label="Active" />);
    const leading = container.querySelector('.dsn-chip-leading') as HTMLElement;
    expect(leading.querySelector('svg')).toBeNull();
  });

  it('renders custom Lucide icon in leading when leadingIcon provided', () => {
    const container = renderChip(<Chip label="Featured" leadingIcon={Star} />);
    const leading = container.querySelector('.dsn-chip-leading') as HTMLElement;
    expect(leading.querySelector('svg')).toBeTruthy();
  });

  it('sets data-icon="custom" on leading when leadingIcon provided', () => {
    const container = renderChip(<Chip label="Featured" leadingIcon={Star} />);
    const leading = container.querySelector('.dsn-chip-leading') as HTMLElement;
    expect(leading.getAttribute('data-icon')).toBe('custom');
  });
});

// ─── Trailing icon ────────────────────────────────────────────────────────────

describe('Chip — trailing icon', () => {
  it('renders dsn-chip-trailing by default (no onDismiss)', () => {
    const container = renderChip(<Chip label="Active" />);
    expect(container.querySelector('.dsn-chip-trailing')).toBeTruthy();
  });

  it('dsn-chip-trailing is aria-hidden', () => {
    const container = renderChip(<Chip label="Active" />);
    const trailing = container.querySelector('.dsn-chip-trailing') as HTMLElement;
    expect(trailing.getAttribute('aria-hidden')).toBe('true');
  });

  it('does NOT set data-icon on trailing when no trailingIcon provided', () => {
    const container = renderChip(<Chip label="Active" />);
    const trailing = container.querySelector('.dsn-chip-trailing') as HTMLElement;
    expect(trailing.getAttribute('data-icon')).toBeNull();
  });

  it('renders custom Lucide icon in trailing when trailingIcon provided', () => {
    const container = renderChip(<Chip label="Featured" trailingIcon={AlertTriangle} />);
    const trailing = container.querySelector('.dsn-chip-trailing') as HTMLElement;
    expect(trailing.querySelector('svg')).toBeTruthy();
  });

  it('sets data-icon="custom" on trailing when trailingIcon provided', () => {
    const container = renderChip(<Chip label="Featured" trailingIcon={AlertTriangle} />);
    const trailing = container.querySelector('.dsn-chip-trailing') as HTMLElement;
    expect(trailing.getAttribute('data-icon')).toBe('custom');
  });
});

// ─── Dismiss button ───────────────────────────────────────────────────────────

describe('Chip — dismiss', () => {
  it('renders dsn-chip-dismiss button when onDismiss provided', () => {
    const container = renderChip(<Chip label="Active" onDismiss={() => {}} />);
    expect(container.querySelector('.dsn-chip-dismiss')).toBeTruthy();
  });

  it('does NOT render dsn-chip-trailing when onDismiss provided', () => {
    const container = renderChip(<Chip label="Active" onDismiss={() => {}} />);
    expect(container.querySelector('.dsn-chip-trailing')).toBeNull();
  });

  it('dismiss button has aria-label="Remove {label}"', () => {
    const container = renderChip(<Chip label="TypeScript" onDismiss={() => {}} />);
    const btn = container.querySelector('.dsn-chip-dismiss') as HTMLElement;
    expect(btn.getAttribute('aria-label')).toBe('Remove TypeScript');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    const container = renderChip(<Chip label="Active" onDismiss={onDismiss} />);
    const btn = container.querySelector('.dsn-chip-dismiss') as HTMLElement;
    fireEvent.click(btn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick when dismiss button is clicked (stopPropagation)', () => {
    const onClick = vi.fn();
    const onDismiss = vi.fn();
    const container = renderChip(
      <Chip label="Active" onClick={onClick} onDismiss={onDismiss} />
    );
    const btn = container.querySelector('.dsn-chip-dismiss') as HTMLElement;
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onDismiss when chip is disabled', () => {
    const onDismiss = vi.fn();
    const container = renderChip(
      <Chip label="Active" disabled={true} onDismiss={onDismiss} />
    );
    const btn = container.querySelector('.dsn-chip-dismiss') as HTMLElement;
    fireEvent.click(btn);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Chip — accessibility', () => {
  it('passes aria-label to the root element', () => {
    const container = renderChip(<Chip label="Active" aria-label="Filter: Active" />);
    expect(getChip(container).getAttribute('aria-label')).toBe('Filter: Active');
  });

  it('has role=checkbox', () => {
    renderChip(<Chip label="Active" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('label text is accessible', () => {
    renderChip(<Chip label="Blocked" />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });
});

// ─── className pass-through ───────────────────────────────────────────────────

describe('Chip — className', () => {
  it('merges custom className', () => {
    const container = renderChip(<Chip label="Active" className="my-chip" />);
    const chip = getChip(container);
    expect(chip.classList.contains('dsn-chip')).toBe(true);
    expect(chip.classList.contains('my-chip')).toBe(true);
  });
});

// ─── Size smoke tests ─────────────────────────────────────────────────────────

describe('Chip — size smoke tests', () => {
  const sizes: ChipSize[] = ['md', 'sm'];

  sizes.forEach((size) => {
    it(`renders ${size} without errors`, () => {
      expect(() => renderChip(<Chip label="Label" size={size} />)).not.toThrow();
    });
  });
});

// ─── Selected × disabled combinations ────────────────────────────────────────

describe('Chip — selected × disabled', () => {
  it('can be both selected and disabled', () => {
    const container = renderChip(
      <Chip label="Active" selected={true} disabled={true} />
    );
    const chip = getChip(container);
    expect(chip.dataset.selected).toBe('true');
    expect(chip.getAttribute('aria-disabled')).toBe('true');
    expect(chip.getAttribute('aria-checked')).toBe('true');
  });

  it('selected+disabled chip does not fire onClick', () => {
    const onClick = vi.fn();
    const container = renderChip(
      <Chip label="Active" selected={true} disabled={true} onClick={onClick} />
    );
    fireEvent.click(getChip(container));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ─── ChipGroup ────────────────────────────────────────────────────────────────

describe('ChipGroup', () => {
  it('renders a <ul> element', () => {
    const { container } = render(
      <ChipGroup label="Filter by status">
        <Chip label="Active" />
      </ChipGroup>
    );
    expect(container.querySelector('.dsn-chip-group')?.tagName.toLowerCase()).toBe('ul');
  });

  it('has role=list', () => {
    render(
      <ChipGroup label="Filter by status">
        <Chip label="Active" />
      </ChipGroup>
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('has aria-label matching the label prop', () => {
    render(
      <ChipGroup label="Filter by status">
        <Chip label="Active" />
      </ChipGroup>
    );
    expect(screen.getByRole('list').getAttribute('aria-label')).toBe('Filter by status');
  });

  it('has class dsn-chip-group', () => {
    const { container } = render(
      <ChipGroup label="Test group">
        <Chip label="Active" />
      </ChipGroup>
    );
    expect(container.querySelector('.dsn-chip-group')).toBeTruthy();
  });

  it('merges custom className', () => {
    const { container } = render(
      <ChipGroup label="Test group" className="my-group">
        <Chip label="Active" />
      </ChipGroup>
    );
    const group = container.querySelector('.dsn-chip-group') as HTMLElement;
    expect(group.classList.contains('dsn-chip-group')).toBe(true);
    expect(group.classList.contains('my-group')).toBe(true);
  });

  it('renders multiple chips inside the group', () => {
    render(
      <ChipGroup label="Status">
        <Chip label="Active" />
        <Chip label="Pending" />
        <Chip label="Blocked" />
      </ChipGroup>
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });
});

describe('Chip — Figma API (Code Connect)', () => {
  it('accepts an icon element as well as a component', () => {
    const { container } = render(<Chip label="Label" leadingIcon={<Star />} />);
    expect(container.querySelector('.dsn-chip-leading svg')).not.toBeNull();
  });

  it('hides the visible label but keeps it as the accessible name', () => {
    render(<Chip label="Design" showLabel={false} onClick={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Design' })).toBeInTheDocument();
    expect(screen.queryByText('Design')).toBeNull();
  });

  it('renders an avatar group when showAvatar is set', () => {
    const { container } = render(
      <Chip label="Owner" showAvatar avatars={[{ name: 'Ana Costa', initials: 'AC' }]} />,
    );
    expect(container.querySelector('.dsn-avatar-group')).not.toBeNull();
  });
});

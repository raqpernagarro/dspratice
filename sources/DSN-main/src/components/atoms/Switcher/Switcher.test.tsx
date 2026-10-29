import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switcher } from './Switcher';
import type { SwitcherSize } from './Switcher';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderSwitcher(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getSwitcher(container: HTMLElement) {
  return container.querySelector('.dsn-switcher') as HTMLElement;
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe('Switcher — defaults', () => {
  it('renders a <button> element', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(getSwitcher(container).tagName.toLowerCase()).toBe('button');
  });

  it('has class dsn-switcher', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(getSwitcher(container)).toBeTruthy();
  });

  it('has role="switch"', () => {
    renderSwitcher(<Switcher checked={false} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('defaults to size=md', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(getSwitcher(container).dataset.size).toBe('md');
  });

  it('defaults to disabled=false (no aria-disabled)', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(getSwitcher(container).getAttribute('aria-disabled')).toBeNull();
  });

  it('is focusable when enabled', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(getSwitcher(container).getAttribute('tabindex')).toBeNull();
  });
});

// ─── checked prop ─────────────────────────────────────────────────────────────

describe('Switcher — checked', () => {
  it('sets aria-checked="false" when checked=false', () => {
    renderSwitcher(<Switcher checked={false} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  it('sets aria-checked="true" when checked=true', () => {
    renderSwitcher(<Switcher checked={true} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('sets data-checked="false" when checked=false', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(getSwitcher(container).dataset.checked).toBe('false');
  });

  it('sets data-checked="true" when checked=true', () => {
    const container = renderSwitcher(<Switcher checked={true} />);
    expect(getSwitcher(container).dataset.checked).toBe('true');
  });
});

// ─── onChange interaction ─────────────────────────────────────────────────────

describe('Switcher — onChange', () => {
  it('calls onChange(!checked) when clicked and checked=false', () => {
    const onChange = vi.fn();
    const container = renderSwitcher(<Switcher checked={false} onChange={onChange} />);
    fireEvent.click(getSwitcher(container));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange(!checked) when clicked and checked=true', () => {
    const onChange = vi.fn();
    const container = renderSwitcher(<Switcher checked={true} onChange={onChange} />);
    fireEvent.click(getSwitcher(container));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('does not throw when no onChange provided', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(() => fireEvent.click(getSwitcher(container))).not.toThrow();
  });

  it('calls onChange exactly once per click', () => {
    const onChange = vi.fn();
    const container = renderSwitcher(<Switcher checked={false} onChange={onChange} />);
    fireEvent.click(getSwitcher(container));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

// ─── Disabled state ───────────────────────────────────────────────────────────

describe('Switcher — disabled', () => {
  it('sets aria-disabled="true" when disabled=true', () => {
    const container = renderSwitcher(<Switcher checked={false} disabled={true} />);
    expect(getSwitcher(container).getAttribute('aria-disabled')).toBe('true');
  });

  it('does NOT set aria-disabled when disabled=false', () => {
    const container = renderSwitcher(<Switcher checked={false} disabled={false} />);
    expect(getSwitcher(container).getAttribute('aria-disabled')).toBeNull();
  });

  it('is removed from tab order when disabled', () => {
    const container = renderSwitcher(<Switcher checked={false} disabled={true} />);
    expect(getSwitcher(container)).toBeDisabled();
  });

  it('does NOT call onChange when disabled and clicked', () => {
    const onChange = vi.fn();
    const container = renderSwitcher(
      <Switcher checked={false} disabled={true} onChange={onChange} />
    );
    fireEvent.click(getSwitcher(container));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('can be disabled in on state (selected+disabled combination)', () => {
    const container = renderSwitcher(
      <Switcher checked={true} disabled={true} />
    );
    const sw = getSwitcher(container);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('aria-disabled')).toBe('true');
  });
});

// ─── Size ─────────────────────────────────────────────────────────────────────

describe('Switcher — sizes', () => {
  const sizes: SwitcherSize[] = ['md', 'sm'];

  sizes.forEach((size) => {
    it(`sets data-size="${size}"`, () => {
      const container = renderSwitcher(<Switcher checked={false} size={size} />);
      expect(getSwitcher(container).dataset.size).toBe(size);
    });

    it(`renders ${size} without errors`, () => {
      expect(() =>
        renderSwitcher(<Switcher checked={false} size={size} />)
      ).not.toThrow();
    });
  });
});

// ─── Internal structure ───────────────────────────────────────────────────────

describe('Switcher — internal structure', () => {
  it('renders dsn-switcher-track inside the button', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(container.querySelector('.dsn-switcher-track')).toBeTruthy();
  });

  it('renders dsn-switcher-thumb inside the track', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(container.querySelector('.dsn-switcher-thumb')).toBeTruthy();
  });

  it('track is aria-hidden (purely decorative)', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    const track = container.querySelector('.dsn-switcher-track') as HTMLElement;
    expect(track.getAttribute('aria-hidden')).toBe('true');
  });
});

// ─── id prop ──────────────────────────────────────────────────────────────────

describe('Switcher — id', () => {
  it('forwards id to the root button', () => {
    const container = renderSwitcher(<Switcher checked={false} id="notifications" />);
    expect(getSwitcher(container).getAttribute('id')).toBe('notifications');
  });

  it('does not set id when not provided', () => {
    const container = renderSwitcher(<Switcher checked={false} />);
    expect(getSwitcher(container).getAttribute('id')).toBeNull();
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Switcher — accessibility', () => {
  it('sets aria-label when provided', () => {
    const container = renderSwitcher(
      <Switcher checked={false} aria-label="Enable notifications" />
    );
    expect(getSwitcher(container).getAttribute('aria-label')).toBe('Enable notifications');
  });

  it('sets aria-labelledby when provided', () => {
    const container = renderSwitcher(
      <Switcher checked={false} aria-labelledby="lbl-notifications" />
    );
    expect(getSwitcher(container).getAttribute('aria-labelledby')).toBe('lbl-notifications');
  });

  it('has role=switch', () => {
    renderSwitcher(<Switcher checked={false} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('switch with checked=true is queryable as checked', () => {
    renderSwitcher(<Switcher checked={true} aria-label="Toggle" />);
    // aria-checked="true" on role=switch means it is "checked" in testing-library
    expect(screen.getByRole('switch', { checked: true })).toBeInTheDocument();
  });

  it('switch with checked=false is queryable as unchecked', () => {
    renderSwitcher(<Switcher checked={false} aria-label="Toggle" />);
    expect(screen.getByRole('switch', { checked: false })).toBeInTheDocument();
  });
});

// ─── className ────────────────────────────────────────────────────────────────

describe('Switcher — className', () => {
  it('merges custom className with dsn-switcher', () => {
    const container = renderSwitcher(<Switcher checked={false} className="my-switch" />);
    const sw = getSwitcher(container);
    expect(sw.classList.contains('dsn-switcher')).toBe(true);
    expect(sw.classList.contains('my-switch')).toBe(true);
  });
});

// ─── Size × checked smoke tests ───────────────────────────────────────────────

describe('Switcher — size × checked smoke tests', () => {
  const sizes: SwitcherSize[] = ['md', 'sm'];
  const states = [true, false];

  sizes.forEach((size) => {
    states.forEach((checked) => {
      it(`renders ${size} × checked=${checked} without errors`, () => {
        expect(() =>
          renderSwitcher(<Switcher size={size} checked={checked} />)
        ).not.toThrow();
      });
    });
  });

  // disabled combinations
  sizes.forEach((size) => {
    states.forEach((checked) => {
      it(`renders ${size} × checked=${checked} × disabled without errors`, () => {
        expect(() =>
          renderSwitcher(<Switcher size={size} checked={checked} disabled={true} />)
        ).not.toThrow();
      });
    });
  });
});

describe('Switcher — Figma API (Code Connect)', () => {
  it('renders a label and icon inside the track', () => {
    const { container } = render(
      <Switcher checked aria-label="Dark mode" label="On" showLabel icon={<svg data-testid="icon" />} showIcon />,
    );
    expect(container.querySelector('.dsn-switcher')).toHaveAttribute('data-has-content');
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument();
  });

  it('ignores label and icon unless their show flags are set', () => {
    const { container } = render(<Switcher checked={false} aria-label="x" label="Off" />);
    expect(container.querySelector('.dsn-switcher')).not.toHaveAttribute('data-has-content');
    expect(screen.queryByText('Off')).toBeNull();
  });
});

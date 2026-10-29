import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { VerticalButton } from './VerticalButton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderButton(ui: React.ReactElement) {
  return render(ui);
}

const TestIcon = () => <svg data-testid="test-icon" aria-hidden="true" />;

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Button', () => {
  describe('rendering', () => {
    it('renders a <button> element', () => {
      renderButton(<Button>Save</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders the label text', () => {
      renderButton(<Button>Save changes</Button>);
      expect(screen.getByText('Save changes')).toBeInTheDocument();
    });

    it('defaults type to "button"', () => {
      renderButton(<Button>Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('accepts type="submit"', () => {
      renderButton(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('forwards className to the root element', () => {
      renderButton(<Button className="my-class">Save</Button>);
      expect(screen.getByRole('button')).toHaveClass('my-class');
    });

    it('hides the label when showLabel={false}', () => {
      renderButton(
        <Button showLabel={false} aria-label="More options">
          Hidden label
        </Button>
      );
      expect(screen.queryByText('Hidden label')).not.toBeInTheDocument();
    });
  });

  // ─── Variants ─────────────────────────────────────────────────────────────

  describe('variants', () => {
    const variants = ['primary', 'secondary', 'ghost', 'plain'] as const;

    variants.forEach((variant) => {
      it(`renders variant="${variant}" without error`, () => {
        const { container } = renderButton(
          <Button variant={variant} size="sm">
            {variant}
          </Button>
        );
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  // ─── Sizes ────────────────────────────────────────────────────────────────

  describe('sizes', () => {
    const sizes = ['md', 'sm'] as const;

    sizes.forEach((size) => {
      it(`renders size="${size}" without error`, () => {
        const { container } = renderButton(<Button size={size}>Label</Button>);
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  // ─── Disabled state ───────────────────────────────────────────────────────

  describe('disabled', () => {
    it('applies the disabled attribute when disabled={true}', () => {
      renderButton(<Button disabled>Save</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderButton(
        <Button disabled onClick={handleClick}>
          Save
        </Button>
      );
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is not focusable when disabled', () => {
      renderButton(<Button disabled>Save</Button>);
      // Native disabled removes the element from the tab order
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  describe('loading', () => {
    it('disables the button when loading', () => {
      renderButton(<Button loading>Saving…</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('sets aria-busy="true" when loading', () => {
      renderButton(<Button loading>Saving…</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('does not set aria-busy when not loading', () => {
      renderButton(<Button>Save</Button>);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });

    it('renders a spinner (aria-hidden) when loading', () => {
      renderButton(<Button loading>Saving…</Button>);
      // Spinner is hidden from the a11y tree — look via container
      const { container } = renderButton(<Button loading>Saving…</Button>);
      const spinner = container.querySelector('span[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderButton(
        <Button loading onClick={handleClick}>
          Saving…
        </Button>
      );
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ─── Icons ────────────────────────────────────────────────────────────────

  describe('icons', () => {
    it('renders leading icon when showLeadingIcon=true and leadingIcon provided', () => {
      renderButton(
        <Button showLeadingIcon leadingIcon={<TestIcon />}>
          Create
        </Button>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('does not render leading icon when showLeadingIcon=false', () => {
      renderButton(
        <Button showLeadingIcon={false} leadingIcon={<TestIcon />}>
          Create
        </Button>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('does not render leading icon when leadingIcon is not provided', () => {
      renderButton(<Button showLeadingIcon>Create</Button>);
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('renders trailing icon when showTrailingIcon=true and trailingIcon provided', () => {
      renderButton(
        <Button showTrailingIcon trailingIcon={<TestIcon />}>
          Export
        </Button>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('hides leading icon when loading (replaced by spinner)', () => {
      renderButton(
        <Button loading showLeadingIcon leadingIcon={<TestIcon />}>
          Saving…
        </Button>
      );
      // Icon should be replaced by spinner
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('hides trailing icon when loading', () => {
      renderButton(
        <Button loading showTrailingIcon trailingIcon={<TestIcon />}>
          Saving…
        </Button>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  // ─── Shortcut badge ───────────────────────────────────────────────────────

  describe('shortcut badge', () => {
    it('renders shortcut badge when shortcut=true and shortcutAriaLabel provided', () => {
      renderButton(
        <Button shortcut shortcutLabel="⌘K" shortcutAriaLabel="Command K">
          Save
        </Button>
      );
      expect(screen.getByText('⌘K')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Command K' })).toBeInTheDocument();
    });

    it('does not render shortcut badge when shortcut=false', () => {
      renderButton(
        <Button shortcut={false} shortcutLabel="⌘K" shortcutAriaLabel="Command K">
          Save
        </Button>
      );
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('does not render shortcut badge when shortcutAriaLabel is missing', () => {
      renderButton(
        <Button shortcut shortcutLabel="⌘K">
          Save
        </Button>
      );
      // Without ariaLabel the badge is suppressed to avoid inaccessible output
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('hides shortcut badge when loading', () => {
      renderButton(
        <Button loading shortcut shortcutLabel="⌘K" shortcutAriaLabel="Command K">
          Save
        </Button>
      );
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('applies aria-label to the button', () => {
      renderButton(
        <Button showLabel={false} aria-label="Delete record">
          Delete
        </Button>
      );
      expect(screen.getByRole('button', { name: 'Delete record' })).toBeInTheDocument();
    });

    it('is keyboard-activatable (fires onClick on Enter)', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderButton(<Button onClick={handleClick}>Save</Button>);
      screen.getByRole('button').focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is keyboard-activatable (fires onClick on Space)', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderButton(<Button onClick={handleClick}>Save</Button>);
      screen.getByRole('button').focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Interactions ─────────────────────────────────────────────────────────

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderButton(<Button onClick={handleClick}>Save</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onClick is not provided', async () => {
      const user = userEvent.setup();
      renderButton(<Button>Save</Button>);
      await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
    });
  });
});

// ─── Button — Destructive ─────────────────────────────────────────────────────

describe('Button — destructive', () => {
  it('sets data-destructive attribute when destructive={true}', () => {
    render(<Button destructive>Delete</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-destructive');
  });

  it('does NOT set data-destructive attribute when destructive={false}', () => {
    render(<Button destructive={false}>Delete</Button>);
    // The attribute should be absent entirely, not set to "false"
    expect(screen.getByRole('button')).not.toHaveAttribute('data-destructive');
  });

  it('does NOT set data-destructive attribute by default', () => {
    render(<Button>Delete</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-destructive');
  });

  it('renders destructive primary without throwing', () => {
    expect(() => render(<Button variant="primary" destructive>Delete</Button>)).not.toThrow();
  });

  it('renders destructive secondary without throwing', () => {
    expect(() => render(<Button variant="secondary" destructive>Delete</Button>)).not.toThrow();
  });

  it('renders destructive ghost without throwing', () => {
    expect(() => render(<Button variant="ghost" destructive>Delete</Button>)).not.toThrow();
  });

  it('renders destructive plain without throwing', () => {
    expect(() => render(<Button variant="plain" size="sm" destructive>Delete</Button>)).not.toThrow();
  });

  it('still applies disabled state on destructive button', () => {
    render(<Button destructive disabled>Delete</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy when destructive + loading', () => {
    render(<Button destructive loading>Delete</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});

// ─── VerticalButton ───────────────────────────────────────────────────────────

const VBIcon = () => <svg data-testid="vb-icon" aria-hidden="true" />;

describe('VerticalButton', () => {
  describe('rendering', () => {
    it('renders a <button> element', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders the icon area', () => {
      const { container } = render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(container.querySelector('.dsn-vertical-button__icon-area')).toBeInTheDocument();
    });

    it('renders the label text inside a label span', () => {
      const { container } = render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      const label = container.querySelector('.dsn-vertical-button__label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Home');
    });

    it('renders the icon inside the icon area', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByTestId('vb-icon')).toBeInTheDocument();
    });

    it('defaults type to "button"', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('data attributes', () => {
    it('sets data-variant attribute', () => {
      render(<VerticalButton variant="primary" icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primary');
    });

    it('defaults data-variant to ghost', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'ghost');
    });

    it('sets data-size attribute', () => {
      render(<VerticalButton size="sm" icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm');
    });

    it('defaults data-size to md', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).toHaveAttribute('data-size', 'md');
    });

    it('sets data-loading when loading={true}', () => {
      render(<VerticalButton icon={<VBIcon />} loading>Home</VerticalButton>);
      expect(screen.getByRole('button')).toHaveAttribute('data-loading');
    });

    it('does NOT set data-loading when loading={false}', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).not.toHaveAttribute('data-loading');
    });
  });

  describe('showLabel', () => {
    it('shows the label by default', () => {
      const { container } = render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(container.querySelector('.dsn-vertical-button__label')).toBeInTheDocument();
    });

    it('hides the label when showLabel={false}', () => {
      const { container } = render(
        <VerticalButton icon={<VBIcon />} showLabel={false} aria-label="Home" />
      );
      expect(container.querySelector('.dsn-vertical-button__label')).not.toBeInTheDocument();
    });

    it('does not render label span when children is absent', () => {
      const { container } = render(<VerticalButton icon={<VBIcon />} aria-label="Home" />);
      expect(container.querySelector('.dsn-vertical-button__label')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('sets aria-busy when loading', () => {
      render(<VerticalButton icon={<VBIcon />} loading>Home</VerticalButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('renders a spinner element when loading', () => {
      const { container } = render(<VerticalButton icon={<VBIcon />} loading>Home</VerticalButton>);
      expect(container.querySelector('.dsn-vertical-button__spinner')).toBeInTheDocument();
    });

    it('hides the icon when loading', () => {
      render(<VerticalButton icon={<VBIcon />} loading>Home</VerticalButton>);
      expect(screen.queryByTestId('vb-icon')).not.toBeInTheDocument();
    });

    it('does not set aria-busy when not loading', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });
  });

  describe('badge', () => {
    it('renders badge dot when badge={true}', () => {
      const { container } = render(
        <VerticalButton icon={<VBIcon />} badge>Inbox</VerticalButton>
      );
      expect(container.querySelector('.dsn-vertical-button__badge')).toBeInTheDocument();
    });

    it('does not render badge by default', () => {
      const { container } = render(<VerticalButton icon={<VBIcon />}>Inbox</VerticalButton>);
      expect(container.querySelector('.dsn-vertical-button__badge')).not.toBeInTheDocument();
    });

    it('badge element is aria-hidden', () => {
      const { container } = render(
        <VerticalButton icon={<VBIcon />} badge>Inbox</VerticalButton>
      );
      expect(container.querySelector('.dsn-vertical-button__badge')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('disabled', () => {
    it('sets the disabled attribute', () => {
      render(<VerticalButton icon={<VBIcon />} disabled>Home</VerticalButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is not disabled by default', () => {
      render(<VerticalButton icon={<VBIcon />}>Home</VerticalButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<VerticalButton icon={<VBIcon />} disabled onClick={handleClick}>Home</VerticalButton>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('aria-label', () => {
    it('sets aria-label when provided', () => {
      render(<VerticalButton icon={<VBIcon />} aria-label="Navigate home" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Navigate home');
    });
  });

  describe('click interaction', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<VerticalButton icon={<VBIcon />} onClick={handleClick}>Home</VerticalButton>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('variants', () => {
    it.each(['ghost', 'secondary', 'primary'] as const)(
      'renders %s variant without throwing',
      (variant) => {
        expect(() =>
          render(<VerticalButton variant={variant} icon={<VBIcon />}>Home</VerticalButton>)
        ).not.toThrow();
      }
    );
  });
});

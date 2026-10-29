import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Shortcut } from './Shortcut';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderShortcut(ui: React.ReactElement) {
  return render(ui);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Shortcut', () => {
  describe('rendering', () => {
    it('renders the label text', () => {
      renderShortcut(<Shortcut label="⌘K" aria-label="Command K" />);
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('uses the default label when no label prop is provided', () => {
      renderShortcut(<Shortcut aria-label="Command Enter" />);
      expect(screen.getByText('⌘ ↵')).toBeInTheDocument();
    });

    it('renders as a non-interactive element (role="img")', () => {
      renderShortcut(<Shortcut label="⌘K" aria-label="Command K" />);
      expect(screen.getByRole('img', { name: 'Command K' })).toBeInTheDocument();
    });

    it('forwards className to the root element', () => {
      renderShortcut(
        <Shortcut label="⌘K" aria-label="Command K" className="custom-class" />
      );
      expect(screen.getByRole('img')).toHaveClass('custom-class');
    });
  });

  // ─── Accessibility ──────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('applies aria-label to the wrapper', () => {
      renderShortcut(<Shortcut label="⌘ ⇧ P" aria-label="Command Shift P" />);
      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label',
        'Command Shift P'
      );
    });

    it('hides the <kbd> from assistive technology via aria-hidden', () => {
      renderShortcut(<Shortcut label="⌘K" aria-label="Command K" />);
      expect(screen.getByText('⌘K')).toHaveAttribute('aria-hidden', 'true');
    });

    it('is not focusable (non-interactive)', () => {
      renderShortcut(<Shortcut label="⌘K" aria-label="Command K" />);
      expect(screen.getByRole('img')).not.toHaveAttribute('tabindex');
    });
  });

  // ─── Props ──────────────────────────────────────────────────────────────────

  describe('props', () => {
    it('defaults contentColor to "default"', () => {
      const { container } = renderShortcut(
        <Shortcut label="⌘K" aria-label="Command K" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts contentColor="inverted" without error', () => {
      const { container } = renderShortcut(
        <Shortcut label="⌘K" aria-label="Command K" contentColor="inverted" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders a custom label correctly', () => {
      renderShortcut(<Shortcut label="Ctrl+K" aria-label="Control K" />);
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
    });
  });

  // ─── Both contentColor variants ─────────────────────────────────────────────

  describe('contentColor variants', () => {
    const colors = ['default', 'inverted'] as const;

    colors.forEach((contentColor) => {
      it(`renders contentColor="${contentColor}" without error`, () => {
        const { container } = renderShortcut(
          <Shortcut
            contentColor={contentColor}
            label="⌘K"
            aria-label="Command K"
          />
        );
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });
});

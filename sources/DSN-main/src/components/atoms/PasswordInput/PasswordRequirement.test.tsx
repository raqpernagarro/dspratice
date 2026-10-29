import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PasswordRequirement } from './PasswordRequirement';

describe('PasswordRequirement', () => {
  describe('rendering', () => {
    it('renders the label text', () => {
      render(<PasswordRequirement label="8+ characters" met={false} />);
      expect(screen.getByText('8+ characters')).toBeInTheDocument();
    });

    it('renders in Default (unmet) state without data-met attribute', () => {
      render(<PasswordRequirement label="8+ characters" met={false} />);
      expect(document.querySelector('.dsn-pw-requirement')).not.toHaveAttribute('data-met');
    });

    it('renders in Completed (met) state with data-met attribute', () => {
      render(<PasswordRequirement label="8+ characters" met={true} />);
      expect(document.querySelector('.dsn-pw-requirement')).toHaveAttribute('data-met');
    });

    it('forwards className to root element', () => {
      render(<PasswordRequirement label="8+ characters" met={false} className="custom" />);
      expect(document.querySelector('.dsn-pw-requirement')).toHaveClass('custom');
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<PasswordRequirement label="1 number" met={false} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('aria-label reads "not satisfied" when unmet', () => {
      render(<PasswordRequirement label="1 number" met={false} />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        '1 number: not satisfied',
      );
    });

    it('aria-label reads "satisfied" when met', () => {
      render(<PasswordRequirement label="1 number" met={true} />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        '1 number: satisfied',
      );
    });

    it('indicator icons are aria-hidden', () => {
      const { container } = render(<PasswordRequirement label="1 number" met={false} />);
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('states', () => {
    it('renders a radio span in unmet state', () => {
      render(<PasswordRequirement label="1 number" met={false} />);
      expect(document.querySelector('.dsn-pw-req-radio')).toBeInTheDocument();
      expect(document.querySelector('.dsn-pw-req-check')).not.toBeInTheDocument();
    });

    it('renders a check svg in met state', () => {
      render(<PasswordRequirement label="1 number" met={true} />);
      expect(document.querySelector('.dsn-pw-req-check')).toBeInTheDocument();
      expect(document.querySelector('.dsn-pw-req-radio')).not.toBeInTheDocument();
    });
  });
});

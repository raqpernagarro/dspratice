import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button/Button';

describe('ButtonGroup', () => {
  it('renders as an accessible group', () => {
    render(
      <ButtonGroup aria-label="Primary actions">
        <Button variant="secondary">One</Button>
        <Button variant="secondary">Two</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole('group', { name: 'Primary actions' })).toBeInTheDocument();
  });

  it('applies small size variant', () => {
    render(
      <ButtonGroup size="sm" aria-label="Small actions">
        <Button variant="secondary" size="sm">One</Button>
        <Button variant="secondary" size="sm">Two</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole('group', { name: 'Small actions' })).toHaveAttribute('data-size', 'sm');
  });

  it('enables space-between distribution when requested', () => {
    render(
      <ButtonGroup spaceBetween aria-label="Spaced actions">
        <Button variant="secondary">One</Button>
        <Button variant="secondary">Two</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole('group', { name: 'Spaced actions' })).toHaveAttribute('data-space-between');
  });

  it('defaults to glued mode when spaceBetween is false', () => {
    render(
      <ButtonGroup aria-label="Glued actions">
        <Button variant="secondary">One</Button>
        <Button variant="secondary">Two</Button>
        <Button variant="secondary">Three</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole('group', { name: 'Glued actions' })).not.toHaveAttribute('data-space-between');
  });

  it('accepts custom class names and keeps group semantics', () => {
    render(
      <ButtonGroup className="custom-actions" aria-label="Custom actions">
        <Button variant="secondary">One</Button>
        <Button variant="secondary">Two</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole('group', { name: 'Custom actions' });
    expect(group).toHaveClass('dsn-button-group');
    expect(group).toHaveClass('custom-actions');
  });

  it('supports a single glued button without changing mode attributes', () => {
    render(
      <ButtonGroup size="sm" aria-label="Single action">
        <Button variant="secondary" size="sm">One</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole('group', { name: 'Single action' });
    expect(group).toHaveAttribute('data-size', 'sm');
    expect(group).not.toHaveAttribute('data-space-between');
    expect(group.querySelectorAll('.dsn-button')).toHaveLength(1);
  });
});

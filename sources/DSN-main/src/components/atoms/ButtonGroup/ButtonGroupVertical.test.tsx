import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ButtonGroupVertical } from './ButtonGroupVertical';
import { Button } from '../Button/Button';

describe('ButtonGroupVertical', () => {
  it('renders as an accessible group', () => {
    render(
      <ButtonGroupVertical aria-label="Primary actions">
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="One">One</Button>
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="Two">Two</Button>
      </ButtonGroupVertical>,
    );

    expect(screen.getByRole('group', { name: 'Primary actions' })).toBeInTheDocument();
  });

  it('applies small size variant', () => {
    render(
      <ButtonGroupVertical size="sm" aria-label="Small actions">
        <Button variant="secondary" size="sm" showLabel={false} showLeadingIcon aria-label="One">One</Button>
        <Button variant="secondary" size="sm" showLabel={false} showLeadingIcon aria-label="Two">Two</Button>
      </ButtonGroupVertical>,
    );

    expect(screen.getByRole('group', { name: 'Small actions' })).toHaveAttribute('data-size', 'sm');
  });

  it('enables space-between distribution when requested', () => {
    render(
      <ButtonGroupVertical spaceBetween aria-label="Spaced actions">
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="One">One</Button>
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="Two">Two</Button>
      </ButtonGroupVertical>,
    );

    expect(screen.getByRole('group', { name: 'Spaced actions' })).toHaveAttribute('data-space-between');
  });

  it('defaults to glued mode when spaceBetween is false', () => {
    render(
      <ButtonGroupVertical aria-label="Glued actions">
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="One">One</Button>
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="Two">Two</Button>
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="Three">Three</Button>
      </ButtonGroupVertical>,
    );

    expect(screen.getByRole('group', { name: 'Glued actions' })).not.toHaveAttribute('data-space-between');
  });

  it('accepts custom class names and keeps group semantics', () => {
    render(
      <ButtonGroupVertical className="custom-actions" aria-label="Custom actions">
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="One">One</Button>
        <Button variant="secondary" showLabel={false} showLeadingIcon aria-label="Two">Two</Button>
      </ButtonGroupVertical>,
    );

    const group = screen.getByRole('group', { name: 'Custom actions' });
    expect(group).toHaveClass('dsn-button-group-vertical');
    expect(group).toHaveClass('custom-actions');
  });

  it('supports a single glued button without changing mode attributes', () => {
    render(
      <ButtonGroupVertical size="sm" aria-label="Single action">
        <Button variant="secondary" size="sm" showLabel={false} showLeadingIcon aria-label="One">One</Button>
      </ButtonGroupVertical>,
    );

    const group = screen.getByRole('group', { name: 'Single action' });
    expect(group).toHaveAttribute('data-size', 'sm');
    expect(group).not.toHaveAttribute('data-space-between');
    expect(group.querySelectorAll('.dsn-button')).toHaveLength(1);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextInput } from '../../atoms/TextInput';
import { Fieldset } from './Fieldset';

describe('Fieldset', () => {
  it('renders a native fieldset and legend', () => {
    render(
      <Fieldset legend="Address">
        <TextInput label="Street" />
      </Fieldset>,
    );

    expect(screen.getByRole('group', { name: 'Address' })).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
  });

  it('renders optional suffix on the legend', () => {
    render(
      <Fieldset legend="Billing details" optional>
        <TextInput label="Tax id" />
      </Fieldset>,
    );

    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  it('links description via aria-describedby', () => {
    render(
      <Fieldset legend="Notification preferences" description="Choose how we contact you.">
        <TextInput label="Email" />
      </Fieldset>,
    );

    const group = screen.getByRole('group', { name: 'Notification preferences' });
    const descriptionId = group.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)).toHaveTextContent('Choose how we contact you.');
  });

  it('applies the field spacing contract on the fields stack', () => {
    render(
      <Fieldset legend="Address">
        <TextInput label="Street" />
      </Fieldset>,
    );

    const fieldsStack = screen.getByRole('group', { name: 'Address' }).querySelector('.dsn-fieldset-fields');
    expect(fieldsStack).not.toBeNull();
    expect(fieldsStack).toHaveStyle({ gap: 'var(--space-md)' });
  });

  it('warns in development when SingleChoice is nested', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { SingleChoice } = await import('../SingleChoice/SingleChoice');

    render(
      <Fieldset legend="Priority">
        <SingleChoice label="Priority level" options={[{ id: 'high', label: 'High' }]} />
      </Fieldset>,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Do not nest SingleChoice or MultiChoice inside Fieldset'),
    );

    warnSpy.mockRestore();
  });
});

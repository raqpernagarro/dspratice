import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from '../../atoms/Select';
import { TextInput } from '../../atoms/TextInput';
import { Fieldset } from '../Fieldset/Fieldset';
import { Form } from './Form';

describe('Form', () => {
  it('renders a native form element', () => {
    render(
      <Form id="test-form">
        <TextInput label="Project name" />
      </Form>,
    );

    const form = document.querySelector('form.dsn-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('id', 'test-form');
  });

  it('applies the form vertical spacing token on the root', () => {
    render(
      <Form>
        <TextInput label="Project name" />
      </Form>,
    );

    const form = document.querySelector('form.dsn-form');
    expect(form).toHaveClass('dsn-form');
    expect(form).toHaveStyle({ gap: 'var(--space-md)' });
  });

  it('submits on Enter in a single-line field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <Form onSubmit={onSubmit}>
        <TextInput label="Project name" defaultValue="Roadmap" />
        <button type="submit">Save changes</button>
      </Form>,
    );

    await user.click(screen.getByRole('textbox', { name: 'Project name' }));
    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not call onSubmit when onValidate returns errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValidate = vi.fn(() => ({ 'project-name': 'Enter a project name.' }));

    render(
      <Form onSubmit={onSubmit} onValidate={onValidate}>
        <TextInput id="project-name" label="Project name" defaultValue="Roadmap" />
        <button type="submit">Save changes</button>
      </Form>,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a project name.')).toBeInTheDocument();
  });

  it('focuses the first invalid field on failed submit', async () => {
    const user = userEvent.setup();

    render(
      <Form onValidate={() => ({ 'project-name': 'Enter a project name.' })}>
        <TextInput id="project-name" label="Project name" defaultValue="Roadmap" />
        <TextInput id="status-note" label="Status note" defaultValue="Draft" />
        <button type="submit">Save changes</button>
      </Form>,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveFocus();
    });
  });

  it('reports mandatory-field completeness via onValidityChange', async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn();

    render(
      <Form onValidityChange={onValidityChange}>
        <TextInput id="project-name" label="Project name" />
        <TextInput id="team" label="Team" optional />
      </Form>,
    );

    await waitFor(() => {
      expect(onValidityChange).toHaveBeenCalledWith(false);
    });

    onValidityChange.mockClear();

    await user.type(screen.getByRole('textbox', { name: 'Project name' }), 'Roadmap');

    await waitFor(() => {
      expect(onValidityChange).toHaveBeenCalledWith(true);
    });
  });
});

describe('Form integration', () => {
  it('coordinates Form, Fieldset, TextInput, Select, and optional field on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValidate = vi.fn(({ name, status }: { name: string; status: string }) => {
      const errors: Record<string, string | undefined> = {};
      if (!name.trim()) {
        errors['project-name'] = 'Enter a project name.';
      }
      if (!status) {
        errors.status = 'Choose a status.';
      }
      return errors;
    });

    function DemoForm() {
      const [name, setName] = useState('');
      const [status, setStatus] = useState('');
      const [notes, setNotes] = useState('');

      return (
        <Form
          id="project-form"
          onSubmit={onSubmit}
          onValidate={() => onValidate({ name, status })}
        >
          <TextInput
            id="project-name"
            label="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Fieldset legend="Delivery details">
            <Select
              id="status"
              label="Status"
              value={status}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
              ]}
              onChange={(nextValue) => setStatus(nextValue)}
            />
            <TextInput
              id="notes"
              label="Notes"
              optional
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Fieldset>
          <button type="submit">Save changes</button>
        </Form>
      );
    }

    render(<DemoForm />);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveFocus();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a project name.')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Project name' }), 'Roadmap');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Status' })).toHaveFocus();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Choose a status.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Status' }));
    await user.click(screen.getByRole('option', { name: 'Active' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button';
import { Select } from '../../atoms/Select';
import { Shortcut } from '../../atoms/Shortcut';
import { TextInput } from '../../atoms/TextInput';
import { Fieldset } from '../Fieldset/Fieldset';
import { Form } from './Form';
import spec from './Form.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Form> = {
  title: 'Inputs & Controls/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Playground: Story = {
  render: function DefaultStory() {
    const [name, setName] = useState('Q3 planning');
    const [status, setStatus] = useState('active');

    return (
      <Form id="project-form" onSubmit={() => undefined}>
        <TextInput
          label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Select
          label="Status"
          value={status}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'paused', label: 'Paused' },
          ]}
          onChange={(nextValue) => setStatus(nextValue)}
        />
      </Form>
    );
  },
};

export const WithFieldsetGrouping: Story = {
  render: function WithFieldsetGroupingStory() {
    const [name, setName] = useState('Roadmap refresh');
    const [startDate, setStartDate] = useState('2026-07-01');
    const [dueDate, setDueDate] = useState('');

    return (
      <Form id="schedule-form" onSubmit={() => undefined}>
        <TextInput
          label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Fieldset legend="Schedule">
          <TextInput
            label="Start date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <TextInput
            label="Due date"
            optional
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Fieldset>
      </Form>
    );
  },
};

export const ValidationFailure: Story = {
  render: function ValidationFailureStory() {
    const [name, setName] = useState('');
    const [status, setStatus] = useState('');
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    function validate() {
      const nextErrors: Record<string, string | undefined> = {};
      if (!name.trim()) {
        nextErrors['project-name'] = 'Enter a project name.';
      }
      if (!status) {
        nextErrors.status = 'Choose a status.';
      }
      setErrors(nextErrors);
      return nextErrors;
    }

    return (
      <Form
        id="validation-form"
        fieldErrors={errors}
        onValidate={validate}
        onSubmit={() => undefined}
      >
        <TextInput
          id="project-name"
          label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
        <Button type="submit" variant="primary">
          Save changes{' '}
          <Shortcut label="⌘↵" aria-label="Command Enter" contentColor="inverted" />
        </Button>
      </Form>
    );
  },
};

export const OptionalField: Story = {
  render: function OptionalFieldStory() {
    const [name, setName] = useState('Roadmap refresh');
    const [team, setTeam] = useState('');
    const [isValid, setIsValid] = useState(false);

    return (
      <Form
        id="optional-form"
        onSubmit={() => undefined}
        onValidityChange={setIsValid}
      >
        <TextInput
          label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextInput
          label="Team"
          optional
          value={team}
          onChange={(event) => setTeam(event.target.value)}
        />
        <Button type="submit" variant="primary" disabled={!isValid}>
          Save changes{' '}
          <Shortcut label="⌘↵" aria-label="Command Enter" contentColor="inverted" />
        </Button>
      </Form>
    );
  },
};

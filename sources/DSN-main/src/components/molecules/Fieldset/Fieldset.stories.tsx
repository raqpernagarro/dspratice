import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxField } from '../CheckboxField/CheckboxField';
import { TextInput } from '../../atoms/TextInput';
import { Fieldset } from './Fieldset';
import spec from './Fieldset.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Fieldset> = {
  title: 'Inputs & Controls/Fieldset',
  component: Fieldset,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof Fieldset>;

export const Playground: Story = {
  render: function DefaultStory() {
    const [street, setStreet] = useState('221B Baker Street');
    const [city, setCity] = useState('London');
    const [postalCode, setPostalCode] = useState('NW1 6XE');

    return (
      <Fieldset legend="Address">
        <TextInput label="Street" value={street} onChange={(event) => setStreet(event.target.value)} />
        <TextInput label="City" value={city} onChange={(event) => setCity(event.target.value)} />
        <TextInput
          label="Postal code"
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
        />
      </Fieldset>
    );
  },
};

export const WithDescription: Story = {
  render: function WithDescriptionStory() {
    const [digest, setDigest] = useState(true);
    const [sms, setSms] = useState(false);

    return (
      <Fieldset legend="Notification preferences" description="Choose how we contact you.">
        <CheckboxField
          label="Notifications"
          checkboxLabel="Email digest"
          checked={digest}
          onCheckedChange={setDigest}
          helperText=""
        />
        <CheckboxField
          label="Alerts"
          checkboxLabel="SMS alerts"
          optional
          checked={sms}
          onCheckedChange={setSms}
          helperText=""
        />
      </Fieldset>
    );
  },
};

export const OptionalGroup: Story = {
  args: {
    legend: 'Billing details',
    optional: true,
    children: <TextInput label="Tax id" />,
  },
};

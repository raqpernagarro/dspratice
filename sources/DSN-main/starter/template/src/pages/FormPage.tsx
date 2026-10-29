import { useState } from 'react';
import { Button, Card, SectionHeader, Select, TextArea, TextInput } from 'ds-ngr';
import { Layout } from '../Layout';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On hold' },
];

const peopleOptions = [
  { value: 'ana', label: 'Ana Costa' },
  { value: 'liam', label: 'Liam Becker' },
  { value: 'priya', label: 'Priya Nair' },
];

export default function Home() {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const nameError = touched && name.trim() === '';

  return (
    <Layout title="New project">
      <SectionHeader title="New project" size="large" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%', maxWidth: '48rem' }}>
        <Card title="Project details" headerSize="medium" showBottomBar={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <TextInput
              label="Project name"
              placeholder="e.g. Customer portal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              error={nameError}
              errorMessage="Enter a project name"
            />
            <TextArea label="Description" placeholder="What is this project about?" optional minRows={3} />
            <Select label="Status" options={statusOptions} defaultValue="draft" />
          </div>
        </Card>

        <Card
          title="Team"
          headerSize="medium"
          showBottomBar
          bottomBarRightActions={
            <>
              <Button variant="ghost" size="md">Cancel</Button>
              <Button variant="primary" size="md" disabled={name.trim() === ''}>
                Create project
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Select label="Project lead" options={peopleOptions} placeholder="Choose a person" />
          </div>
        </Card>
      </div>
    </Layout>
  );
}

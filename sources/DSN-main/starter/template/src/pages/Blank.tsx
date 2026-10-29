import { Button, Card, SectionHeader } from 'ds-ngr';
import { Layout } from '../Layout';

export default function Home() {
  return (
    <Layout title="Home">
      <SectionHeader title="Welcome" description="Your DS-Ngr starter is running with your theme." size="large" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
        <Card
          title="Next steps"
          headerSize="medium"
          showBottomBar
          bottomBarRightActions={<Button variant="primary" size="md">Get started</Button>}
        >
          Replace this page with your own content. Read node_modules/ds-ngr/AI.md for component rules, or ask your AI agent —
          CLAUDE.md and AGENTS.md already point it at the design system docs.
        </Card>
      </div>
    </Layout>
  );
}

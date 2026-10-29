import { AppShell, Navbar, Sidebar, Button, SectionHeader, Avatar, Tag, AttachmentChip, PromptInput, DataListCell, SidebarMenuSelector } from 'ds-ngr';
import { Plus, MessageSquare, Sparkles, FileText, Share2, Check, Search, FilePen, Pin, Settings } from 'lucide-react';

const pinned = [
  { id: 'p1', label: 'Release checklist' },
  { id: 'p2', label: 'Client status update' },
];

const conversations = [
  { id: 'c1', label: 'Token refresh bug', selected: true },
  { id: 'c2', label: 'Q4 roadmap summary' },
  { id: 'c3', label: 'Onboarding copy review' },
  { id: 'c4', label: 'Sprint 14 retro notes' },
];

const messages = [
  {
    id: 'm1',
    role: 'user',
    text: 'Can you review the auth files? The JWT refresh seems broken — tokens expire but the middleware never refreshes them.',
    attachments: [
      { id: 'f1', name: 'auth-service.ts', size: '4 KB' },
      { id: 'f2', name: 'middleware.ts', size: '2 KB' },
    ],
  },
  {
    id: 'm2',
    role: 'assistant',
    steps: [
      { id: 's1', label: 'Read auth-service.ts', icon: <FileText size={14} /> },
      { id: 's2', label: 'Read middleware.ts', icon: <FileText size={14} /> },
      { id: 's3', label: 'Searched for refreshToken', icon: <Search size={14} /> },
    ],
    text: 'Found it. The middleware validates the token before checking for a refresh, so an expired token is rejected with 401 and refreshToken() is never reached. I catch TokenExpiredError, attempt a silent refresh, and only return 401 if that fails.',
  },
  { id: 'm3', role: 'user', text: 'Nice. Can you write up a short design doc for the team?' },
  {
    id: 'm4',
    role: 'assistant',
    steps: [{ id: 's4', label: 'Drafted token-refresh.md', icon: <FilePen size={14} /> }],
    text: 'Done — the doc covers the problem, the fix, the test matrix and a staged rollout. It is open on the right.',
  },
];

const bubble = {
  user: { alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--color-background-neutral-secondary)', borderRadius: 'var(--card-radius)', padding: 'var(--space-sm) var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  assistant: { alignSelf: 'stretch', display: 'flex', gap: 'var(--space-sm)' },
};

export default function AssistantChatPage() {
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell
        header={
          <Navbar
            variant="title"
            title="Token refresh bug"
            rightActions={<Button variant="secondary" size="md" showLeadingIcon leadingIcon={<Share2 size={16} />}>Share</Button>}
          />
        }
        sidebar={
          <Sidebar
            selectorProps={{ label: 'Assistant', avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'AI', name: 'Assistant' } }}
            actions={[{ id: 'new-chat', label: 'New chat', icon: <Plus size={16} /> }]}
            sections={[
              { id: 'pinned', title: 'Pinned', showDisclosure: true, items: pinned.map((c) => ({ id: c.id, label: c.label, icon: <Pin size={16} /> })) },
              { id: 'recent', title: 'Recent', showDisclosure: true, items: conversations.map((c) => ({ id: c.id, label: c.label, selected: c.selected, icon: <MessageSquare size={16} /> })) },
            ]}
            bottomContent={
              <>
                <SidebarMenuSelector variant="full" label="Settings" showIcon icon={<Settings size={16} />} />
                <SidebarMenuSelector variant="full" label="Ana Costa" showAvatar avatarProps={{ size: 'xs', fill: 'initials', initials: 'AC', name: 'Ana Costa' }} />
              </>
            }
          />
        }
        rightPanel={
          <div style={{ width: 'clamp(var(--size-container-md), 36vw, var(--size-container-xl))', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-md)' }}>
            <SectionHeader
              title="JWT token refresh: design & rollout"
              description="Document · updated just now"
              size="medium"
              trailingControl={<Tag variant="highlight" size="sm" label="v2" />}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', color: 'var(--color-foreground-neutral-primary)' }}>
              <SectionHeader title="Problem" size="small" flush />
              <p style={{ margin: 0 }}>Token validation ran before any refresh logic, so an expired access token returned 401 even when the user still held a valid refresh token.</p>
              <SectionHeader title="Fix" size="small" flush />
              <p style={{ margin: 0 }}>The middleware now catches TokenExpiredError and attempts a silent refresh before rejecting. Valid sessions are never interrupted.</p>
              <SectionHeader title="Rollout" size="small" flush />
            </div>
            <>
              <DataListCell alignment="inline" title="Flag" description="silent_refresh at 5%" showIcon={false} showActions={false} />
              <DataListCell alignment="inline" title="Alert" description="Failure rate > 2% / 5 min" showIcon={false} showActions={false} />
              <DataListCell alignment="inline" title="Ramp" description="100% after 24 h stable" showIcon={false} showActions={false} />
            </>
          </div>
        }
      >
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} style={bubble.user}>
                  <span>{m.text}</span>
                  {m.attachments ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                      {m.attachments.map((a) => <AttachmentChip key={a.id} fileName={a.name} fileSize={a.size} size="sm" />)}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div key={m.id} style={bubble.assistant}>
                  <Avatar size="xs" variant="organization" fill="icon" icon={Sparkles} name="Assistant" />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                      {m.steps.map((s) => (
                        <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2xs)', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-secondary)' }}>
                          <Check size={14} /> {s.icon} {s.label}
                        </span>
                      ))}
                    </div>
                    <span style={{ color: 'var(--color-foreground-neutral-primary)' }}>{m.text}</span>
                  </div>
                </div>
              ),
            )}
          </div>
          <div style={{ position: 'sticky', bottom: 0, background: 'var(--color-background-neutral-primary)', paddingBlock: 'var(--space-xs)' }}>
            <PromptInput
              placeholder="Ask anything…"
              quickActions={[
                { id: 'tests', label: 'Add tests' },
                { id: 'pr', label: 'Open a PR' },
                { id: 'explain', label: 'Explain the fix' },
              ]}
              modelOptions={[
                { value: 'fast', label: 'Fast' },
                { value: 'deep', label: 'Deep reasoning' },
              ]}
              defaultModelValue="deep"
            />
          </div>
        </div>
      </AppShell>
    </div>
  );
}

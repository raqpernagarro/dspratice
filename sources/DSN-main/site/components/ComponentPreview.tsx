'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, Bell, Image as ImageIcon, Bold, Copy, Download, FileText, Folder, Home, Inbox, Italic, Mail, MoreHorizontal,
  Plus, Scissors, Search, Settings, Share2, Star, Trash2, Underline, Upload, Users,
} from 'lucide-react';
import {
  Accordion, AreaChart, AspectRatio, AttachmentCard, AttachmentChip, AttachmentField, Avatar, AvatarGroup,
  Badge, BarChart, Breadcrumbs, CalendarView, BrushLineChart, BulkActionBar, Button, ButtonGroup,
  ButtonGroupVertical, Callout, Card, Carousel, CarouselSlide, ChartCard, Checkbox, CheckboxField, Chip,
  ChipField, ChipGroup, ChoiceList, Combobox, Command, CommandGroup, CommandInput, CommandItem, CommandList,
  CustomViewTab, DataListCell, DataTable, DataTableCell, DataTableHeaderCell, DateTimePicker, DonutChart,
  EmptyState, Fieldset, FileRow, FileThumbnail, Form, HeatmapChart, HorizontalInput, HorizontalStackedBarChart,
  LineChart, LoadingBar, MenuCell, MultiChoice, Navbar, NumberInput, OTPInput, Pagination, PasswordInput,
  PhoneInput, PopoverMenu, ProgressBar, ProgressRing, PromptInput, Radio, RichTextEditor, SearchBar,
  SectionHeader, SegmentControl, Select, Separator, Shortcut, Sidebar, SidebarMenuSelector, SingleChoice,
  SkeletonLoading, Slider, SplitButton, Stat, StreamgraphChart, Switcher, Tab, Tag, TextArea, TextInput,
  Toast, ToggleButton, Toolbar, UploadArea, VerticalButton, XYLineChart,
} from 'ds-ngr';

/**
 * Live thumbnails for the components index. Each entry renders the real
 * component from ../src with sample data, so the gallery never drifts from
 * the library. Overlays (Modal, Drawer, …) are shown as static compositions
 * because the real ones portal to <body>.
 */

type Preview = {
  render: () => ReactNode;
  /** Natural layout width; the tile scales the result down to fit. */
  width?: number;
  /** Draw edge to edge inside the tile instead of centred and scaled (overlay mocks). */
  fill?: boolean;
  /** Render after mount only — for components that touch browser APIs during render. */
  clientOnly?: boolean;
};

const noop = () => {};

const TEAM = [
  { name: 'Ana Costa', initials: 'AC' },
  { name: 'Bruno Lima', initials: 'BL' },
  { name: 'Carla Reis', initials: 'CR' },
  { name: 'Diogo Sá', initials: 'DS' },
  { name: 'Eva Nunes', initials: 'EN' },
  { name: 'Filipe Rocha', initials: 'FR' },
];

const SERIES_DATA = [
  { month: 'Jan', revenue: 42, forecast: 40 },
  { month: 'Feb', revenue: 48, forecast: 45 },
  { month: 'Mar', revenue: 45, forecast: 50 },
  { month: 'Apr', revenue: 61, forecast: 55 },
  { month: 'May', revenue: 58, forecast: 60 },
  { month: 'Jun', revenue: 72, forecast: 66 },
];
const SERIES = [{ key: 'revenue', label: 'Revenue' }, { key: 'forecast', label: 'Forecast' }];
const STACKED = [
  { team: 'Design', done: 12, open: 4 },
  { team: 'Eng', done: 20, open: 9 },
  { team: 'PM', done: 7, open: 3 },
];
const HEATMAP = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((x, i) => ({
  x,
  bins: ['AM', 'Mid', 'PM'].map((y, j) => ({ y, value: ((i + 1) * (j + 2) * 7) % 30 })),
}));
const CHANNELS = [
  { id: 'web', label: 'Web', value: 46 },
  { id: 'mobile', label: 'Mobile', value: 32 },
  { id: 'partners', label: 'Partners', value: 22 },
];
const ROLES = [
  { value: 'design', label: 'Designer' },
  { value: 'eng', label: 'Engineer' },
  { value: 'pm', label: 'Product manager' },
];

/** Neutral image placeholder so previews need no network assets. */
const Picture = () => (
  <div className="pv-picture"><ImageIcon size={24} strokeWidth={1.5} /></div>
);

/** Static stand-in for portal-based overlays: dimmed page + centred surface. */
const OverlayMock = ({ side = false, children }: { side?: boolean; children: ReactNode }) => (
  <div className={`pv-overlay${side ? ' side' : ''}`}>
    <div className="pv-overlay-surface">{children}</div>
  </div>
);

/** Toast auto-dismisses by design; remount it after it leaves so the tile loops. */
function LoopingToast() {
  const [key, setKey] = useState(0);
  return (
    <div className="pv-toast">
      <Toast
        key={key}
      variant="rich"
      severity="success"
      title="Prototype shared"
      description="Anyone with the link can view it."
      actionLabel="Copy link"
        onDismiss={() => window.setTimeout(() => setKey((k) => k + 1), 300)}
      />
    </div>
  );
}

const ChartTile = ({ children }: { children: ReactNode }) => <div className="pv-chart">{children}</div>;

const commandPreview: Preview = {
  render: () => (
    <div className="pv-surface" style={{ width: 300 }}>
      <Command>
        <CommandInput placeholder="Search commands…" />
        <CommandList>
          <CommandGroup heading="Actions">
            <CommandItem value="new" label="New file" leadingIcon={<Plus size={16} />} shortcutLabel="⌘N" shortcutAriaLabel="Command N" />
            <CommandItem value="share" label="Share" leadingIcon={<Share2 size={16} />} shortcutLabel="⌘S" shortcutAriaLabel="Command S" />
            <CommandItem value="settings" label="Settings" leadingIcon={<Settings size={16} />} />
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
};

const sidebarSections = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', icon: <Home size={16} />, selected: true },
      { id: 'inbox', label: 'Inbox', icon: <Inbox size={16} />, showBadge: true, badgeCount: 4 },
      { id: 'projects', label: 'Projects', icon: <Folder size={16} /> },
      { id: 'team', label: 'Team', icon: <Users size={16} /> },
    ],
  },
];

const PREVIEWS: Record<string, Preview> = {
  // ── Action ──────────────────────────────────────────────────────────────
  Button: {
    render: () => (
      <div className="pv-row">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    ),
  },
  ToggleButton: {
    render: () => (
      <div className="pv-row">
        <ToggleButton icon={<Star size={16} />} aria-label="Star" />
        <ToggleButton icon={<Bell size={16} />} selected aria-label="Notifications" />
        <ToggleButton icon={<Bold size={16} />} variant="ghost" aria-label="Bold" />
      </div>
    ),
  },
  VerticalButton: {
    render: () => (
      <div className="pv-row">
        <VerticalButton icon={<Mail size={16} />}>Mail</VerticalButton>
        <VerticalButton icon={<Bell size={16} />} badge>Alerts</VerticalButton>
        <VerticalButton icon={<Settings size={16} />}>Settings</VerticalButton>
      </div>
    ),
  },
  ButtonGroup: {
    render: () => (
      <ButtonGroup aria-label="Clipboard">
        <Button variant="secondary" showLeadingIcon leadingIcon={<Copy size={16} />}>Copy</Button>
        <Button variant="secondary" showLeadingIcon leadingIcon={<Scissors size={16} />}>Cut</Button>
        <Button variant="secondary">Paste</Button>
      </ButtonGroup>
    ),
  },
  ButtonGroupVertical: {
    render: () => (
      <ButtonGroupVertical aria-label="Alignment">
        <Button variant="secondary" showLabel={false} showLeadingIcon leadingIcon={<AlignLeft size={16} />} aria-label="Align left" />
        <Button variant="secondary" showLabel={false} showLeadingIcon leadingIcon={<AlignCenter size={16} />} aria-label="Align center" />
        <Button variant="secondary" showLabel={false} showLeadingIcon leadingIcon={<AlignRight size={16} />} aria-label="Align right" />
      </ButtonGroupVertical>
    ),
  },
  SplitButton: { render: () => <SplitButton variant="primary">Save</SplitButton> },
  SegmentControl: {
    render: () => (
      <SegmentControl aria-label="View" defaultValue="grid" options={[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }, { value: 'table', label: 'Table' }]} />
    ),
  },
  Shortcut: {
    render: () => (
      <div className="pv-row">
        <Shortcut label="⌘K" aria-label="Command K" />
        <Shortcut label="⌘ ⇧ P" aria-label="Command Shift P" />
        <Shortcut label="Ctrl ↵" aria-label="Control Enter" />
      </div>
    ),
  },
  Toolbar: {
    width: 360,
    render: () => (
      <Toolbar
        aria-label="Editor"
        leftActions={
          <div className="pv-row tight">
            <ToggleButton icon={<Bold size={16} />} variant="ghost" aria-label="Bold" />
            <ToggleButton icon={<Italic size={16} />} variant="ghost" selected aria-label="Italic" />
            <ToggleButton icon={<Underline size={16} />} variant="ghost" aria-label="Underline" />
          </div>
        }
        rightActions={<Button variant="primary" size="sm">Publish</Button>}
      />
    ),
  },
  BulkActionBar: {
    render: () => (
      <BulkActionBar
        selectedCount={4}
        onDismiss={noop}
        actions={[
          { label: 'Download', icon: <Download size={16} />, onClick: noop },
          { label: 'Delete', icon: <Trash2 size={16} />, onClick: noop, destructive: true },
        ]}
      />
    ),
  },

  // ── Data display ────────────────────────────────────────────────────────
  Avatar: {
    render: () => (
      <div className="pv-row">
        <Avatar size="lg" initials="AC" name="Ana Costa" />
        <Avatar size="lg" fill="icon" name="Guest" />
        <Avatar size="lg" variant="organization" initials="NG" name="Nagarro" />
      </div>
    ),
  },
  AvatarGroup: { render: () => <AvatarGroup avatars={TEAM} maxVisible={4} size="sm" /> },
  Badge: {
    render: () => (
      <div className="pv-row">
        <Badge variant="highlight-soft" count={3} />
        <Badge variant="highlight-strong" count={12} />
        <Badge variant="critical" count={120} />
        <Badge size="dot" variant="critical" />
      </div>
    ),
  },
  Tag: {
    render: () => (
      <div className="pv-row wrap">
        <Tag label="Approved" variant="success" />
        <Tag label="In review" variant="highlight" />
        <Tag label="At risk" variant="warning" />
        <Tag label="Blocked" variant="error" />
      </div>
    ),
  },
  Chip: {
    render: () => (
      <div className="pv-row">
        <Chip label="Design" selected showLeadingIcon={false} showTrailingIcon={false} />
        <Chip label="Engineering" showLeadingIcon={false} showTrailingIcon={false} />
        <Chip label="Remote" onDismiss={noop} showLeadingIcon={false} />
      </div>
    ),
  },
  ChipGroup: {
    render: () => (
      <ChipGroup label="Categories">
        <Chip label="News" showLeadingIcon={false} showTrailingIcon={false} />
        <Chip label="Travel" selected showLeadingIcon={false} showTrailingIcon={false} />
        <Chip label="Gaming" showLeadingIcon={false} showTrailingIcon={false} />
      </ChipGroup>
    ),
  },
  Stat: {
    render: () => (
      <div className="pv-row">
        <Stat variant="card" title="Active users" value="2,481" />
        <Stat variant="card" title="Uptime" value="99.9%" />
      </div>
    ),
  },
  DataListCell: {
    width: 300,
    render: () => (
      <div className="pv-stack">
        <DataListCell title="Owner" content="Ana Costa" />
        <DataListCell title="Status" content={<Tag label="Active" variant="success" size="sm" />} />
        <DataListCell title="Updated" content="2 hours ago" />
      </div>
    ),
  },
  DataTableCell: {
    render: () => (
      <div className="pv-stack">
        <DataTableCell fieldType="string" value="Q3 roadmap" width={200} />
        <DataTableCell fieldType="number" value={1280} width={200} />
        <DataTableCell fieldType="boolean" value width={200} />
      </div>
    ),
  },
  DataTableHeaderCell: {
    render: () => (
      <div className="pv-row tight">
        <DataTableHeaderCell label="Name" sortable sortDirection="asc" width={160} />
        <DataTableHeaderCell label="Owner" sortable width={140} />
      </div>
    ),
  },
  AttachmentCard: {
    render: () => (
      <div className="pv-row">
        <AttachmentCard variant="file" title="Brief.pdf" metaData="1.2 MB" />
        <AttachmentCard variant="file" title="Notes.docx" metaData="84 KB" />
      </div>
    ),
  },
  AttachmentChip: {
    render: () => (
      <div className="pv-stack">
        <AttachmentChip fileName="Proposal.pdf" fileSize="2.4 MB" action="remove" onRemove={noop} />
        <AttachmentChip fileName="Budget.xlsx" fileSize="320 KB" action="remove" onRemove={noop} loading />
      </div>
    ),
  },
  FileRow: {
    width: 320,
    render: () => (
      <div className="pv-stack">
        <FileRow fileName="Brand guidelines" fileType="PDF" fileSize="4.1 MB" />
        <FileRow fileName="Launch video" fileType="MP4" fileSize="38 MB" state="uploading" uploadProgress={62} />
      </div>
    ),
  },
  FileThumbnail: {
    render: () => (
      <div className="pv-row">
        <FileThumbnail variant="file" size="large" />
        <FileThumbnail variant="file" size="large" icon={<FileText size={20} />} />
        <FileThumbnail variant="image" size="large" />
      </div>
    ),
  },
  Separator: {
    width: 260,
    render: () => (
      <div className="pv-stack">
        <span className="pv-text">Account</span>
        <Separator />
        <div className="pv-row" style={{ height: 24 }}>
          <span className="pv-text">Profile</span>
          <Separator direction="vertical" />
          <span className="pv-text">Billing</span>
          <Separator direction="vertical" />
          <span className="pv-text">Team</span>
        </div>
      </div>
    ),
  },
  SectionHeader: {
    width: 320,
    render: () => (
      <SectionHeader title="Recent activity" description="Updates from your workspace" trailingControl={<Button variant="secondary" size="sm">View all</Button>} />
    ),
  },
  AspectRatio: {
    width: 240,
    render: () => (
      <AspectRatio ratio="16:9" shape="rounded">
        <Picture />
      </AspectRatio>
    ),
  },
  Accordion: {
    width: 320,
    render: () => (
      <div className="pv-stack">
        <Accordion title="What is DS-Ngr?" defaultExpanded bordered>
          <p className="pv-text">A React design system built for people and agents.</p>
        </Accordion>
        <Accordion title="Is it accessible?" bordered />
      </div>
    ),
  },
  Card: {
    width: 300,
    render: () => (
      <Card title="Start a prototype" description="Pick the AI you already use." showBottomBar bottomBarRightActions={<Button variant="primary" size="sm">Continue</Button>}>
        <p className="pv-text">Connect via MCP or use your own API key.</p>
      </Card>
    ),
  },

  // ── Feedback ────────────────────────────────────────────────────────────
  Callout: {
    width: 320,
    render: () => <Callout severity="success" title="Changes saved" description="Your workspace settings are up to date." />,
  },
  Toast: {
    width: 320,
    render: () => <LoopingToast />,
  },
  ProgressBar: {
    width: 260,
    render: () => (
      <div className="pv-stack">
        <ProgressBar value={72} label="Uploading" />
        <ProgressBar value={35} label="Syncing" />
      </div>
    ),
  },
  ProgressRing: {
    render: () => (
      <div className="pv-row">
        <ProgressRing value={25} size="xl" label="25%" />
        <ProgressRing value={68} size="xl" label="68%" />
        <ProgressRing size="xl" label="Loading" />
      </div>
    ),
  },
  LoadingBar: { width: 260, render: () => <LoadingBar value={60} label="Loading page" /> },
  SkeletonLoading: {
    render: () => (
      <div className="pv-row">
        <div style={{ flex: 'none' }}><SkeletonLoading type="avatar" /></div>
        <div className="pv-stack">
          <SkeletonLoading type="pill" />
          <SkeletonLoading type="pill" />
        </div>
      </div>
    ),
  },
  EmptyState: {
    render: () => (
      <EmptyState size="small" hasIcon icon={Inbox} hasTitle title="No messages" hasSubtitle subtitle="New messages will show up here." hasActions showMainCta mainCtaLabel="Compose" showSecondaryOption={false} showTertiaryOption={false} showLink={false} showHelpText={false} />
    ),
  },
  Tooltip: {
    render: () => (
      <div className="pv-stack center">
        <span className="pv-tooltip">Copy link</span>
        <Button variant="secondary" showLeadingIcon leadingIcon={<Copy size={16} />}>Copy</Button>
      </div>
    ),
  },

  // ── Inputs ──────────────────────────────────────────────────────────────
  TextInput: { width: 280, render: () => <TextInput label="Work email" placeholder="ana@nagarro.com" helperText="We'll never share it." /> },
  NumberInput: { width: 220, render: () => <NumberInput label="Seats" defaultValue={12} min={1} max={99} /> },
  PasswordInput: { width: 280, render: () => <PasswordInput label="Password" defaultValue="correct-horse" /> },
  PhoneInput: { width: 280, render: () => <PhoneInput label="Phone" placeholder="912 345 678" /> },
  OTPInput: { width: 320, render: () => <OTPInput length={6} defaultValue="4320" label="Verification code" /> },
  TextArea: { width: 280, render: () => <TextArea label="Message" placeholder="Tell us more…" minRows={3} /> },
  SearchBar: { width: 280, render: () => <SearchBar label="Search" helperText="" placeholder="Search projects" /> },
  Select: { width: 260, render: () => <Select label="Role" placeholder="Select one" options={ROLES} defaultValue="design" /> },
  Combobox: { width: 260, render: () => <Combobox label="Assignee" placeholder="Search people" options={ROLES} showHelper={false} /> },
  DateTimePicker: { width: 260, render: () => <DateTimePicker label="Due date" placeholder="Pick a date" helperText="" /> },
  Checkbox: {
    render: () => (
      <div className="pv-stack">
        <Checkbox showTrailingIcon={false} label="Email updates" checked />
        <Checkbox showTrailingIcon={false} label="Weekly digest" indeterminate />
        <Checkbox showTrailingIcon={false} label="Product news" />
      </div>
    ),
  },
  Radio: {
    render: () => (
      <div className="pv-stack">
        <Radio showTrailingIcon={false} label="Monthly" checked />
        <Radio showTrailingIcon={false} label="Yearly" />
        <Radio showTrailingIcon={false} label="Lifetime" disabled />
      </div>
    ),
  },
  Switcher: {
    render: () => (
      <div className="pv-row">
        <Switcher checked aria-label="On" />
        <Switcher checked={false} aria-label="Off" />
        <Switcher checked size="sm" aria-label="Small" />
      </div>
    ),
  },
  Slider: { width: 260, render: () => <Slider defaultValue={62} showValue aria-label="Budget" valueFormatter={(v) => `€${v}k`} /> },
  CheckboxField: { width: 280, render: () => <CheckboxField label="Terms" checkboxLabel="I agree to the terms" helperText="" defaultChecked checkboxProps={{ showTrailingIcon: false }} /> },
  ChipField: {
    width: 300,
    render: () => (
      <ChipField
        label="Interests"
        helperText=""
        defaultValue={['ux']}
        options={[{ id: 'ux', label: 'UX' }, { id: 'ui', label: 'UI' }, { id: 'research', label: 'Research' }]}
      />
    ),
  },
  MultiChoice: {
    width: 260,
    render: () => (
      <MultiChoice
        label="Notify me about"
        helperText=""
        options={[{ id: 'm', label: 'Mentions', checked: true }, { id: 'c', label: 'Comments', checked: true }, { id: 'r', label: 'Releases' }].map((o) => ({ ...o, checkboxProps: { showTrailingIcon: false } }))}
      />
    ),
  },
  SingleChoice: {
    width: 260,
    render: () => (
      <SingleChoice
        label="Plan"
        helperText=""
        defaultValue="pro"
        options={[{ id: 'free', label: 'Free' }, { id: 'pro', label: 'Pro' }, { id: 'team', label: 'Team' }].map((o) => ({ ...o, radioProps: { showTrailingIcon: false } }))}
      />
    ),
  },
  HorizontalInput: {
    width: 360,
    render: () => (
      <HorizontalInput label="Display name" description="Shown on your profile" showDescription>
        <TextInput aria-label="Display name" defaultValue="Ana Costa" />
      </HorizontalInput>
    ),
  },
  UploadArea: { width: 300, render: () => <UploadArea label="Attachments" helperText="" maxSizeText="Up to 10 MB" /> },
  AttachmentField: { width: 300, render: () => <AttachmentField label="Contract" helperText="PDF only" /> },
  Fieldset: {
    width: 280,
    render: () => (
      <Fieldset legend="Shipping" description="Where should we send it?">
        <TextInput label="City" defaultValue="Lisbon" />
      </Fieldset>
    ),
  },
  Form: {
    width: 280,
    render: () => (
      <Form>
        <div className="pv-stack">
          <TextInput label="Name" defaultValue="Ana Costa" />
          <Button variant="primary" type="submit">Save</Button>
        </div>
      </Form>
    ),
  },
  RichTextEditor: { width: 360, clientOnly: true, render: () => <RichTextEditor label="Comment" defaultValue="<p>Looks <strong>great</strong> — ship it!</p>" /> },
  PromptInput: {
    width: 380,
    clientOnly: true,
    render: () => (
      <PromptInput
        placeholder="Ask anything…"
        aria-label="Prompt"
        modelOptions={[{ value: 'opus', label: 'Opus' }, { value: 'sonnet', label: 'Sonnet' }]}
        defaultModelValue="opus"
      />
    ),
  },

  // ── Navigation ──────────────────────────────────────────────────────────
  Tab: {
    render: () => (
      <Tab aria-label="Sections" defaultValue="overview" tabs={[{ value: 'overview', label: 'Overview' }, { value: 'activity', label: 'Activity' }, { value: 'settings', label: 'Settings' }]} />
    ),
  },
  CustomViewTab: {
    render: () => (
      <CustomViewTab
        aria-label="Views"
        defaultValue="all"
        tabs={[{ value: 'all', label: 'All' }, { value: 'mine', label: 'Mine', removable: true }, { value: 'urgent', label: 'Urgent', removable: true }]}
        addActionLabel="Add view"
        onAddAction={noop}
      />
    ),
  },
  Breadcrumbs: {
    render: () => <Breadcrumbs items={[{ label: 'Home', href: '#' }, { label: 'Projects', href: '#' }, { label: 'Atlas' }]} />,
  },
  Pagination: { width: 360, render: () => <Pagination page={3} totalPages={12} onPageChange={noop} /> },
  MenuCell: {
    width: 260,
    render: () => (
      <div className="pv-surface">
        <MenuCell fullWidth label="New file" showLeadingIcon leadingIcon={<Plus size={16} />} shortcut shortcutLabel="⌘ N" shortcutAriaLabel="Command N" />
        <MenuCell fullWidth label="Share" showLeadingIcon leadingIcon={<Share2 size={16} />} />
        <MenuCell fullWidth destructive label="Delete" showLeadingIcon leadingIcon={<Trash2 size={16} />} />
      </div>
    ),
  },
  ChoiceList: {
    width: 260,
    render: () => (
      <div className="pv-surface">
        <ChoiceList
          title="Status"
          sections={[{
            id: 's',
            title: 'Status',
            items: [
              { id: 'a', kind: 'checkbox-cell', props: { label: 'Active', checked: true, showTrailingIcon: false } },
              { id: 'p', kind: 'checkbox-cell', props: { label: 'Pending', showTrailingIcon: false } },
              { id: 'c', kind: 'checkbox-cell', props: { label: 'Closed', showTrailingIcon: false } },
            ],
          }]}
        />
      </div>
    ),
  },
  SidebarMenuSelector: {
    width: 240,
    render: () => (
      <div className="pv-stack">
        <SidebarMenuSelector label="Home" showIcon icon={<Home size={16} />} selected />
        <SidebarMenuSelector label="Inbox" showIcon icon={<Inbox size={16} />} showBadge badgeCount={3} />
        <SidebarMenuSelector label="Settings" showIcon icon={<Settings size={16} />} />
      </div>
    ),
  },
  Sidebar: { render: () => <div className="pv-tall"><Sidebar aria-label="Main" sections={sidebarSections} /></div> },
  Navbar: {
    width: 520,
    render: () => (
      <Navbar
        title="Projects"
        description="12 active"
        showDescription
        rightActions={<Button variant="primary" size="sm" showLeadingIcon leadingIcon={<Plus size={16} />}>New</Button>}
      />
    ),
  },
  AppShell: {
    width: 900,
    render: () => (
      <div className="pv-appshell">
        <div className="pv-appshell-side"><Sidebar aria-label="Main" sections={sidebarSections} /></div>
        <div className="pv-appshell-main">
          <Navbar title="Dashboard" rightActions={<Button variant="primary" size="sm">Share</Button>} />
          <div className="pv-row" style={{ padding: 16 }}>
            <Stat variant="card" title="Active projects" value="128" />
            <Stat variant="card" title="Prototypes" value="342" />
          </div>
        </div>
      </div>
    ),
  },

  // ── Overlays (static compositions) ─────────────────────────────────────
  Modal: {
    fill: true,
    render: () => (
      <OverlayMock>
        <SectionHeader title="Invite teammates" description="They'll get an email." size="small" />
        <div className="pv-pad"><TextInput aria-label="Email" placeholder="name@nagarro.com" /></div>
        <div className="pv-actions"><Button variant="secondary" size="sm">Cancel</Button><Button variant="primary" size="sm">Invite</Button></div>
      </OverlayMock>
    ),
  },
  AlertDialog: {
    fill: true,
    render: () => (
      <OverlayMock>
        <SectionHeader title="Delete project?" description="This can't be undone." size="small" />
        <div className="pv-actions"><Button variant="secondary" size="sm">Cancel</Button><Button variant="primary" size="sm" destructive>Delete</Button></div>
      </OverlayMock>
    ),
  },
  Drawer: {
    fill: true,
    render: () => (
      <OverlayMock side>
        <SectionHeader title="Filters" size="small" />
        <div className="pv-pad pv-stack">
          <Checkbox showTrailingIcon={false} label="Assigned to me" checked />
          <Checkbox showTrailingIcon={false} label="Has attachments" />
        </div>
        <div className="pv-actions"><Button variant="primary" size="sm">Apply</Button></div>
      </OverlayMock>
    ),
  },
  MediaViewer: {
    fill: true,
    render: () => (
      <div className="pv-media">
        <div className="pv-media-bar"><span>2 / 8</span><MoreHorizontal size={16} /></div>
        <div className="pv-media-frame"><Picture /></div>
      </div>
    ),
  },
  PopoverMenu: {
    width: 260,
    render: () => (
      <PopoverMenu
        variant="simple"
        showHeader={false}
        aria-label="Actions"
        simpleItems={[
          { id: 'n', kind: 'menu-cell', props: { label: 'Rename', showLeadingIcon: true, leadingIcon: <FileText size={16} /> } },
          { id: 's', kind: 'menu-cell', props: { label: 'Share', showLeadingIcon: true, leadingIcon: <Share2 size={16} /> } },
          { id: 'd', kind: 'menu-cell', props: { label: 'Delete', destructive: true, showLeadingIcon: true, leadingIcon: <Trash2 size={16} /> } },
        ]}
      />
    ),
  },
  PopoverWrapper: {
    width: 260,
    render: () => (
      <div className="pv-surface">
        <SectionHeader title="Quick actions" size="xsmall" />
        <MenuCell fullWidth label="Upload" showLeadingIcon leadingIcon={<Upload size={16} />} />
        <MenuCell fullWidth label="Search" showLeadingIcon leadingIcon={<Search size={16} />} />
      </div>
    ),
  },
  NotificationCenter: {
    width: 300,
    render: () => (
      <div className="pv-surface">
        <SectionHeader title="Notifications" size="xsmall" trailingControl={<Badge variant="critical" count={2} />} />
        <MenuCell fullWidth label="Ana commented" description="“Looks great — ship it!”" showDescription showAvatar avatarProps={{ initials: 'AC', name: 'Ana Costa' }} />
        <MenuCell fullWidth label="Build passed" description="main · 2 min ago" showDescription showLeadingIcon leadingIcon={<Bell size={16} />} />
      </div>
    ),
  },
  Command: commandPreview,
  CommandDialog: commandPreview,

  // ── Media ───────────────────────────────────────────────────────────────
  Carousel: {
    width: 260,
    render: () => (
      <Carousel label="Photos" ratio="16:9" shape="rounded" showDots>
        <CarouselSlide><Picture /></CarouselSlide>
        <CarouselSlide><Picture /></CarouselSlide>
        <CarouselSlide><Picture /></CarouselSlide>
      </Carousel>
    ),
  },

  // ── Data ────────────────────────────────────────────────────────────────
  CalendarView: {
    width: 560,
    render: () => {
      const d = (day: number, h: number) => new Date(2026, 9, day, h);
      return (
        <CalendarView
          defaultView="month"
          height={420}
          events={[
            { id: '1', title: 'Design review', start: d(6, 10), end: d(6, 11) },
            { id: '2', title: 'Sprint demo', start: d(14, 15), end: d(14, 16) },
            { id: '3', title: 'Offsite', start: d(21, 9), end: d(23, 17), allDay: true },
          ]}
        />
      );
    },
  },
  DataTable: {
    width: 560,
    render: () => (
      <DataTable
        aria-label="Projects"
        columns={[
          { id: 'name', header: 'Project', fieldType: 'string', width: 200 },
          { id: 'status', header: 'Status', fieldType: 'tag', width: 140 },
          { id: 'budget', header: 'Budget', fieldType: 'number', width: 140 },
        ]}
        rows={[
          { id: '1', cells: { name: 'Atlas', status: 'Active', budget: 42000 } },
          { id: '2', cells: { name: 'Borealis', status: 'Paused', budget: 18500 } },
          { id: '3', cells: { name: 'Cobalt', status: 'Active', budget: 27300 } },
        ]}
      />
    ),
  },
  Charts: { width: 320, render: () => <ChartTile><LineChart data={SERIES_DATA} xKey="month" series={SERIES} height={160} /></ChartTile> },
  LineChart: { width: 320, render: () => <ChartTile><LineChart data={SERIES_DATA} xKey="month" series={SERIES} height={160} /></ChartTile> },
  BarChart: { width: 320, render: () => <ChartTile><BarChart data={SERIES_DATA} xKey="month" series={SERIES} height={160} /></ChartTile> },
  AreaChart: { width: 320, render: () => <ChartTile><AreaChart data={SERIES_DATA} xKey="month" series={SERIES} height={160} /></ChartTile> },
  DonutChart: { width: 320, render: () => <ChartTile><DonutChart data={CHANNELS} height={170} /></ChartTile> },
  StreamgraphChart: { width: 320, render: () => <ChartTile><StreamgraphChart data={SERIES_DATA} xKey="month" series={SERIES} height={160} /></ChartTile> },
  BrushLineChart: { width: 320, render: () => <ChartTile><BrushLineChart data={SERIES_DATA} xKey="month" series={SERIES} height={140} /></ChartTile> },
  XYLineChart: { width: 320, render: () => <ChartTile><XYLineChart data={SERIES_DATA} xKey="month" series={SERIES} height={160} /></ChartTile> },
  HeatmapChart: { width: 320, render: () => <ChartTile><HeatmapChart data={HEATMAP} height={160} /></ChartTile> },
  HorizontalStackedBarChart: {
    width: 320,
    render: () => (
      <ChartTile>
        <HorizontalStackedBarChart data={STACKED} categoryKey="team" series={[{ key: 'done', label: 'Done' }, { key: 'open', label: 'Open' }]} height={160} />
      </ChartTile>
    ),
  },
  ChartCard: {
    width: 340,
    render: () => (
      <ChartCard title="Revenue" description="€ thousands">
        <AreaChart data={SERIES_DATA} xKey="month" series={SERIES} height={140} />
      </ChartCard>
    ),
  },
};

// Sub-components share their parent's preview.
const ALIASES: Record<string, string> = {
  CustomViewTabs: 'CustomViewTab',
  LineChart: 'Charts',
  BarChart: 'Charts',
  AreaChart: 'Charts',
  DonutChart: 'Charts',
  StreamgraphChart: 'Charts',
  BrushLineChart: 'Charts',
  XYLineChart: 'Charts',
  HeatmapChart: 'Charts',
  HorizontalStackedBarChart: 'Charts',
  ChartCard: 'Charts',
};

export const hasPreview = (name: string) => Boolean(PREVIEWS[ALIASES[name] ?? name]);

export function ComponentPreview({ name }: { name: string }) {
  const preview = PREVIEWS[ALIASES[name] ?? name];
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  useEffect(() => setMounted(true), []);

  // Shrink the preview to fit the tile; never enlarge it.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;
    const fit = () => {
      const { offsetWidth: w, offsetHeight: h } = content;
      if (!w || !h) return;
      setScale(Math.min(1, frame.clientWidth / w, frame.clientHeight / h));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    observer.observe(content);
    return () => observer.disconnect();
  }, [mounted]);

  if (!preview) {
    return <span className="pv-fallback" aria-hidden>{name.replace(/[a-z]/g, '').slice(0, 2) || name[0]}</span>;
  }
  const { render, width, fill, clientOnly } = preview;
  if (clientOnly && !mounted) return null;
  if (fill) return <>{render()}</>;
  return (
    <div ref={frameRef} className="pv-frame">
      <div ref={contentRef} className="pv-content" style={{ width, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {render()}
      </div>
    </div>
  );
}

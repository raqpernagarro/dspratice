'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FilePlus, Pencil, Trash2, Sparkles, Mail } from 'lucide-react';
import {
  AreaChart, AvatarGroup, BarChart, Button, Callout, Card, Checkbox, DonutChart, HeatmapChart,
  HorizontalStackedBarChart, LineChart, MenuCell, OTPInput, ProgressRing, Radio, SegmentControl, Select,
  Slider, Stat, StreamgraphChart, Switcher, Tag, TextInput, Toast,
} from 'ds-ngr';
import { StyleguideSections } from './StyleguideSections';

/**
 * The home-page "cloud": live DS-Ngr components, not screenshots. Every piece
 * here is imported from ../src, so the hero always shows the current library.
 */

const SCENES = [
  { value: 'components', label: 'Components' },
  { value: 'dashboard', label: 'Dashboard' },
];
const SCENES_WITH_STYLEGUIDE = [...SCENES, { value: 'styleguide', label: 'Styleguide' }];

const TEAM = [
  { name: 'Ana Costa', initials: 'AC' },
  { name: 'Bruno Lima', initials: 'BL' },
  { name: 'Carla Reis', initials: 'CR' },
  { name: 'Diogo Sá', initials: 'DS' },
  { name: 'Eva Nunes', initials: 'EN' },
  { name: 'Filipe Rocha', initials: 'FR' },
  { name: 'Gil Matos', initials: 'GM' },
];

const REVENUE = [
  { month: 'Jan', revenue: 42, forecast: 40 },
  { month: 'Feb', revenue: 48, forecast: 45 },
  { month: 'Mar', revenue: 45, forecast: 50 },
  { month: 'Apr', revenue: 61, forecast: 55 },
  { month: 'May', revenue: 58, forecast: 60 },
  { month: 'Jun', revenue: 72, forecast: 66 },
  { month: 'Jul', revenue: 80, forecast: 72 },
];

const CHANNELS = [
  { id: 'web', label: 'Web', value: 46 },
  { id: 'mobile', label: 'Mobile', value: 32 },
  { id: 'partners', label: 'Partners', value: 22 },
];

const PROTOTYPES_BY_TEAM = [
  { team: 'Web', thisWeek: 128, lastWeek: 104 },
  { team: 'Mobile', thisWeek: 86, lastWeek: 92 },
  { team: 'Data', thisWeek: 64, lastWeek: 51 },
  { team: 'Platform', thisWeek: 64, lastWeek: 58 },
];

const ADOPTION = [
  { week: 'W1', apps: 12 },
  { week: 'W2', apps: 15 },
  { week: 'W3', apps: 19 },
  { week: 'W4', apps: 22 },
  { week: 'W5', apps: 28 },
  { week: 'W6', apps: 31 },
];

const COMPONENT_STATUS = [
  { tier: 'Atoms', stable: 38, beta: 6, planned: 2 },
  { tier: 'Molecules', stable: 24, beta: 5, planned: 3 },
  { tier: 'Organisms', stable: 14, beta: 4, planned: 4 },
];

const USAGE_BY_FRAMEWORK = [
  { month: 'Jan', react: 32, vue: 10, angular: 8 },
  { month: 'Feb', react: 36, vue: 12, angular: 8 },
  { month: 'Mar', react: 41, vue: 13, angular: 9 },
  { month: 'Apr', react: 47, vue: 15, angular: 9 },
  { month: 'May', react: 52, vue: 18, angular: 10 },
  { month: 'Jun', react: 58, vue: 20, angular: 11 },
  { month: 'Jul', react: 66, vue: 23, angular: 12 },
];

const HOURS = ['09:00', '12:00', '15:00', '18:00'];
const ACTIVITY = [
  { x: 'Mon', counts: [12, 28, 19, 8] },
  { x: 'Tue', counts: [14, 31, 21, 9] },
  { x: 'Wed', counts: [18, 36, 26, 11] },
  { x: 'Thu', counts: [11, 29, 20, 7] },
  { x: 'Fri', counts: [9, 22, 14, 4] },
].map(({ x, counts }) => ({ x, bins: counts.map((value, i) => ({ y: HOURS[i], value })) }));

function ComponentsScene() {
  const [notify, setNotify] = useState(true);
  const [checked, setChecked] = useState(true);
  const [toggle, setToggle] = useState(true);
  const [range, setRange] = useState('7d');
  // The toast stays until "×" is pressed; it then animates out and lands again. The tile keeps
  // its height while the toast is gone so the column below doesn't jump.
  const [toastKey, setToastKey] = useState(0);
  const toastTileRef = useRef<HTMLDivElement>(null);
  const replayToast = () => {
    const tile = toastTileRef.current;
    if (tile) tile.style.minHeight = `${tile.offsetHeight}px`;
    window.setTimeout(() => setToastKey((k) => k + 1), 600);
  };
  useEffect(() => {
    if (toastKey === 0) return;
    const id = window.setTimeout(() => toastTileRef.current?.style.removeProperty('min-height'), 400);
    return () => window.clearTimeout(id);
  }, [toastKey]);

  return (
    <div className="bento">
      {/* Column 1 — form controls */}
      <div className="bento-col">
        <div className="bento-tile plain">
          <TextInput label="Work email" placeholder="ana@nagarro.com" helperText="We only use this to share prototypes." />
        </div>
        <div className="bento-tile plain">
          <Select
            label="Role"
            placeholder="Select one"
            options={[
              { value: 'design', label: 'Designer' },
              { value: 'eng', label: 'Engineer' },
              { value: 'pm', label: 'Product manager' },
            ]}
          />
        </div>
        <div className="bento-tile plain bento-controls">
          <Checkbox checked={checked} onCheckedChange={setChecked} showContent={false} aria-label="Accept" />
          <Switcher checked={toggle} onChange={setToggle} aria-label="Enable" />
          <Radio checked showContent={false} aria-label="Selected option" />
          <ProgressRing value={68} size="sm" label="Uploading" />
        </div>
        <div className="bento-tile plain">
          <Slider defaultValue={62} showValue aria-label="Budget" valueFormatter={(v) => `€${v}k`} />
        </div>
        <div className="bento-tile plain">
          <SegmentControl
            aria-label="Date range"
            fullWidth
            value={range}
            onChange={setRange}
            options={[
              { value: '1d', label: '1D' },
              { value: '7d', label: '7D' },
              { value: '1m', label: '1M' },
              { value: '1y', label: '1Y' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>
        <div className="bento-tile menu">
          <MenuCell fullWidth label="New file" description="Create a new file" showDescription showLeadingIcon leadingIcon={<FilePlus size={16} />} shortcut shortcutLabel="⌘ N" shortcutAriaLabel="Command N" />
          <MenuCell fullWidth label="Edit file" description="Make changes" showDescription showLeadingIcon leadingIcon={<Pencil size={16} />} shortcut shortcutLabel="⌘ E" shortcutAriaLabel="Command E" />
          <MenuCell fullWidth destructive label="Delete file" description="Move to trash" showDescription showLeadingIcon leadingIcon={<Trash2 size={16} />} shortcut shortcutLabel="⌘ ⇧ D" shortcutAriaLabel="Command Shift D" />
        </div>
      </div>

      {/* Column 2 — identity, verification, actions */}
      <div className="bento-col">
        <div className="bento-tile plain center">
          <AvatarGroup avatars={TEAM} maxVisible={5} size="sm" aria-label="Design team" />
        </div>
        <div className="bento-tile">
          <OTPInput length={6} defaultValue="4320" label="Verify account" helperText="We sent a code to a****@nagarro.com" />
        </div>
        <div className="bento-tile plain bento-buttons">
          <Button variant="primary" size="md">Publish</Button>
          <Button variant="secondary" size="md">Preview</Button>
          <Button variant="ghost" size="md">Cancel</Button>
          <Button variant="primary" size="md" shortcut shortcutLabel="⌘ ↵" shortcutAriaLabel="Command Enter">Submit</Button>
        </div>
        <div className="bento-tile flush">
          <Callout
            title="You have 2 credits left"
            description="Upgrade for unlimited prototypes."
            actions={<Button variant="secondary" size="sm">Upgrade</Button>}
          />
        </div>
        <div className="bento-tile row">
          <div>
            <p className="bento-title">Allow notifications</p>
            <p className="bento-sub">Get pinged when a prototype is shared.</p>
          </div>
          <Switcher checked={notify} onChange={setNotify} aria-label="Allow notifications" />
        </div>
      </div>

      {/* Column 3 — composed surfaces */}
      <div className="bento-col">
        <div className="bento-tile flush">
          <Card title="Start a prototype" description="Pick the AI you already use.">
            <div className="bento-stack">
              <Button variant="primary" size="md" showLeadingIcon leadingIcon={<Sparkles size={16} />}>Connect via MCP</Button>
              <Button variant="secondary" size="md">Use my own API key</Button>
              <Button variant="secondary" size="md" showLeadingIcon leadingIcon={<Mail size={16} />}>Sign in with Nagarro</Button>
            </div>
          </Card>
        </div>
        <div className="bento-tile flush bento-toast" ref={toastTileRef}>
          <Toast
            key={toastKey}
            autoDismiss={false}
            variant="rich"
            severity="success"
            title="Prototype shared"
            description="Anyone with the link can view it."
            actionLabel="Copy link"
            onDismiss={replayToast}
          />
        </div>
        <div className="bento-tile plain bento-stats">
          <Stat variant="card" title="Components in use" value="95" />
          <Stat variant="card" title="Teams shipping" value="31" />
        </div>
        <div className="bento-tile plain bento-tags">
          <Tag label="Accessible" variant="success" />
          <Tag label="Tokens" variant="highlight" />
          <Tag label="Agent ready" variant="neutral" />
          <Tag label="Beta" variant="warning" />
        </div>
      </div>
    </div>
  );
}

function DashboardScene() {
  return (
    <div className="bento dashboard">
      <div className="bento-row">
        <Stat variant="card" title="Active projects" value="128" />
        <Stat variant="card" title="Prototypes this week" value="342" />
        <Stat variant="card" title="Avg. time to first screen" value="4m 12s" />
      </div>
      <div className="bento-row wide">
        <div className="bento-tile flush">
          <Card title="Revenue" description="Actual vs forecast, € thousands">
            <AreaChart
              data={REVENUE}
              xKey="month"
              series={[{ key: 'revenue', label: 'Revenue' }, { key: 'forecast', label: 'Forecast' }]}
              height={240}
            />
          </Card>
        </div>
        <div className="bento-tile flush">
          <Card title="Traffic by channel" description="Share of sessions">
            <DonutChart data={CHANNELS} height={240} />
          </Card>
        </div>
      </div>
      <div className="bento-row">
        <div className="bento-tile flush">
          <Card title="Prototypes by team" description="This week vs last week">
            <BarChart
              data={PROTOTYPES_BY_TEAM}
              xKey="team"
              series={[{ key: 'thisWeek', label: 'This week' }, { key: 'lastWeek', label: 'Last week' }]}
              height={200}
            />
          </Card>
        </div>
        <div className="bento-tile flush">
          <Card title="Adoption" description="Apps shipping DS-Ngr">
            <LineChart data={ADOPTION} xKey="week" series={[{ key: 'apps', label: 'Apps' }]} height={200} />
          </Card>
        </div>
        <div className="bento-tile flush">
          <Card title="Component status" description="By tier">
            <HorizontalStackedBarChart
              data={COMPONENT_STATUS}
              categoryKey="tier"
              series={[
                { key: 'stable', label: 'Stable' },
                { key: 'beta', label: 'Beta' },
                { key: 'planned', label: 'Planned' },
              ]}
              height={200}
            />
          </Card>
        </div>
      </div>
      <div className="bento-row wide">
        <div className="bento-tile flush">
          <Card title="Usage by framework" description="Weekly installs, thousands">
            <StreamgraphChart
              data={USAGE_BY_FRAMEWORK}
              xKey="month"
              series={[
                { key: 'react', label: 'React' },
                { key: 'vue', label: 'Vue' },
                { key: 'angular', label: 'Angular' },
              ]}
              height={240}
            />
          </Card>
        </div>
        <div className="bento-tile flush">
          <Card title="Peak activity" description="Sessions by day and hour">
            <HeatmapChart data={ACTIVITY} height={240} />
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * `withStyleguide` adds a token styleguide scene — used by the theme configurator preview.
 * `controls` sit at the right end of the scene bar (the configurator's brand picker).
 */
export function HomeShowcase({ withStyleguide = false, controls }: { withStyleguide?: boolean; controls?: ReactNode }) {
  const [scene, setScene] = useState('components');
  return (
    <section className="showcase" aria-label="Live component showcase">
      <div className="showcase-bar">
        <SegmentControl aria-label="Showcase scene" fullWidth={false} options={withStyleguide ? SCENES_WITH_STYLEGUIDE : SCENES} value={scene} onChange={setScene} />
        {controls}
      </div>
      <div className="showcase-frame">
        {scene === 'components' && <ComponentsScene />}
        {scene === 'dashboard' && <DashboardScene />}
        {scene === 'styleguide' && <div className="bento-tile showcase-styleguide"><StyleguideSections /></div>}
      </div>
    </section>
  );
}

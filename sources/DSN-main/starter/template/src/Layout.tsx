import { useState, type ReactNode } from 'react';
import { AppShell, Button, Navbar, Sidebar, SidebarMenuSelector } from 'ds-ngr';
// Icons come from lucide-react, which ships inside ds-ngr — don't install it separately.
import { FileText, FolderKanban, LayoutDashboard, Moon, Settings, Sun, Users } from 'lucide-react';

// Placeholder destinations — replace with your own routes.
const NAV_ITEMS = [
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} /> },
  { id: 'people', label: 'People', icon: <Users size={16} /> },
  { id: 'docs', label: 'Documents', icon: <FileText size={16} /> },
];

type Theme = 'light' | 'dark';

function useColorMode() {
  const [mode, setMode] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) ?? 'light');
  const toggle = () => {
    const next: Theme = mode === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setMode(next);
  };
  return { mode, toggle };
}

export type LayoutProps = {
  /** Page title shown in the Navbar. */
  title: string;
  /** Page-level actions, e.g. the primary CTA. Rendered in the Navbar. */
  actions?: ReactNode;
  children: ReactNode;
};

/** App frame: AppShell + Sidebar + Navbar. Every page renders inside it. */
export function Layout({ title, actions, children }: LayoutProps) {
  const { mode, toggle } = useColorMode();
  return (
    // AppShell needs a full-height parent — never put height on AppShell itself.
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell
        header={
          <Navbar
            variant="title"
            title={title}
            rightActions={
              <>
                <Button
                  variant="ghost"
                  size="md"
                  showLabel={false}
                  showLeadingIcon
                  leadingIcon={mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  onClick={toggle}
                />
                {actions}
              </>
            }
          />
        }
        sidebar={
          <Sidebar
            selectorProps={{
              label: '{{title}}',
              avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: '{{initials}}', name: '{{title}}' },
            }}
            sections={[
              {
                id: 'main',
                items: [
                  { id: 'home', label: title, icon: <LayoutDashboard size={16} />, selected: true },
                  ...NAV_ITEMS.filter((item) => item.label !== title),
                ],
              },
            ]}
            bottomContent={
              <SidebarMenuSelector variant="full" label="Settings" showIcon icon={<Settings size={16} />} />
            }
          />
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

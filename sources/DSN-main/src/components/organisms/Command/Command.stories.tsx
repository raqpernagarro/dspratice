import { useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  BookOpen,
  FilePlus,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Palette,
  Search,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '../../atoms/Button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './Command';
import spec from './Command.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const onSelect = fn();

/** The menu used by most stories — navigation, actions and settings. */
function AppCommands({ onRun = onSelect }: { onRun?: (value: string) => void }) {
  return (
    <>
      <CommandInput placeholder="Search pages and actions" />
      <CommandList>
        <CommandEmpty />
        <CommandGroup heading="Go to">
          <CommandItem value="Dashboard" leadingIcon={<LayoutDashboard size={16} />} keywords={['home', 'overview']} onSelect={onRun} />
          <CommandItem value="Projects" leadingIcon={<FolderKanban size={16} />} keywords={['work']} onSelect={onRun} />
          <CommandItem value="Team members" leadingIcon={<Users size={16} />} keywords={['people', 'users']} onSelect={onRun} />
          <CommandItem value="Documentation" leadingIcon={<BookOpen size={16} />} keywords={['docs', 'help']} onSelect={onRun} />
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="Create project"
            leadingIcon={<FilePlus size={16} />}
            keywords={['new']}
            shortcutLabel="⌘ N"
            shortcutAriaLabel="Command N"
            onSelect={onRun}
          />
          <CommandItem
            value="Invite member"
            leadingIcon={<UserPlus size={16} />}
            keywords={['add', 'people']}
            shortcutLabel="⌘ I"
            shortcutAriaLabel="Command I"
            onSelect={onRun}
          />
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem value="Appearance" description="Theme and density" leadingIcon={<Palette size={16} />} keywords={['dark mode', 'theme']} onSelect={onRun} />
          <CommandItem value="Account settings" leadingIcon={<Settings size={16} />} keywords={['profile', 'preferences']} onSelect={onRun} />
          <CommandItem value="Sign out" leadingIcon={<LogOut size={16} />} keywords={['log out']} disabled onSelect={onRun} />
        </CommandGroup>
      </CommandList>
    </>
  );
}

/** A bordered frame so the inline Command reads as a surface in the canvas. */
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 'var(--popover-width-max)',
      height: 360,
      display: 'flex',
      border: 'var(--size-border-sm) solid var(--color-border-neutral-primary)',
      borderRadius: 'var(--popover-radius)',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof Command> = {
  title: 'Navigation/Command',
  component: Command,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: { shouldFilter: true, loop: true },
  argTypes: {
    shouldFilter: { control: 'boolean' },
    loop: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Command>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Inline menu with groups, icons, a description, shortcut hints and a disabled item. */
export const Playground: Story = {
  render: (args) => (
    <Frame>
      <Command {...args}>
        <AppCommands />
      </Command>
    </Frame>
  ),
};

/**
 * The ⌘K palette. The trigger looks like a search field; ⌘K / Ctrl K opens it from anywhere.
 * The app binds the shortcut and closes the dialog in `onSelect`.
 */
export const Dialog: Story = {
  render: function DialogStory(args) {
    const [open, setOpen] = useState(false);
    const [last, setLast] = useState<string | null>(null);

    useEffect(() => {
      const onKey = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setOpen((current) => !current);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Button
          variant="secondary"
          size="md"
          leadingIcon={<Search size={16} />}
          showLeadingIcon
          shortcut
          shortcutLabel="⌘ K"
          shortcutAriaLabel="Command K"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Search
        </Button>
        {last && <p style={{ margin: 0, color: 'var(--color-foreground-neutral-secondary)' }}>Last run: {last}</p>}
        <CommandDialog {...args} open={open} onOpenChange={setOpen} aria-label="Search pages and actions">
          <AppCommands
            onRun={(value) => {
              onSelect(value);
              setLast(value);
              setOpen(false);
            }}
          />
        </CommandDialog>
      </div>
    );
  },
};

/** Typing filters and ranks across label and hidden keywords; groups with no matches disappear. */
export const Searching: Story = {
  render: (args) => (
    <Frame>
      <Command {...args} defaultSearch="people">
        <AppCommands />
      </Command>
    </Frame>
  ),
};

/** Nothing matches — CommandEmpty takes the place of the list. */
export const NoResults: Story = {
  render: (args) => (
    <Frame>
      <Command {...args} defaultSearch="invoices">
        <AppCommands />
      </Command>
    </Frame>
  ),
};

/**
 * Server-side search: the app filters the items itself, so `shouldFilter={false}` keeps
 * every item it renders visible and in source order.
 */
export const ExternalFiltering: Story = {
  args: { shouldFilter: false },
  render: function ExternalFilteringStory(args) {
    const people = ['Ana Silva', 'Marco Rossi', 'Priya Natarajan', 'Jonas Weber', 'Lea Dubois'];
    const [search, setSearch] = useState('');
    const results = useMemo(
      () => people.filter((name) => name.toLowerCase().split(' ').some((part) => part.startsWith(search.toLowerCase()))),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [search],
    );
    return (
      <Frame>
        <Command {...args} search={search} onSearchChange={setSearch}>
          <CommandInput placeholder="Search people by first or last name" />
          <CommandList>
            <CommandEmpty>No people match. Check the spelling or invite them.</CommandEmpty>
            <CommandGroup heading="People">
              {results.map((name) => (
                <CommandItem key={name} value={name} leadingIcon={<Users size={16} />} onSelect={onSelect} />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </Frame>
    );
  },
};

// ─── Interaction tests ────────────────────────────────────────────────────────

/** Arrow keys move the active option while focus stays in the input; Enter runs it. */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Frame>
      <Command {...args}>
        <AppCommands />
      </Command>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    onSelect.mockClear();
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Search' });
    await userEvent.click(input);
    await userEvent.type(input, 'invite');
    await waitFor(() => expect(canvas.getByRole('option', { name: /Invite member/ })).toHaveAttribute('aria-selected', 'true'));
    await userEvent.keyboard('{Enter}');
    await expect(onSelect).toHaveBeenCalledWith('Invite member');

    await userEvent.clear(input);
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('option', { name: 'Projects' })).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveFocus();
  },
};

/** Opening the palette puts focus in the search input; Escape closes and restores focus. */
export const DialogFocus: Story = {
  ...Dialog,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: /Search/ });
    await userEvent.click(trigger);
    const input = await body.findByRole('combobox', { name: 'Search' });
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

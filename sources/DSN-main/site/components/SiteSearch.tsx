'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Shortcut,
} from './ds';

export interface SearchItem {
  href: string;
  label: string;
  description: string;
  group: string;
  keywords?: string[];
}

/** Header search across components, patterns and guides. ⌘K / Ctrl K toggles the palette. */
export function SiteSearch({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <div className="site-search">
      <button
        type="button"
        className="site-search-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
      >
        <Search size={16} aria-hidden="true" />
        <span className="site-search-placeholder">Search</span>
        <Shortcut className="site-search-shortcut" label="⌘ K" aria-label="Command K" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} aria-label="Search the docs">
        <CommandInput placeholder="Search components, patterns and guides" aria-label="Search the docs" />
        <CommandList>
          <CommandEmpty>No matches. Try a component name like “Button”.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    description={item.description}
                    keywords={[group, item.description, ...(item.keywords ?? [])]}
                    onSelect={() => {
                      router.push(item.href);
                      setOpen(false);
                    }}
                  />
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}

'use client';

// Client boundary for DS-Ngr components used by server-rendered pages.
// `export *` is not allowed across a client boundary, so list what the site uses.
export {
  Button,
  Badge,
  Tag,
  Shortcut,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from 'ds-ngr';

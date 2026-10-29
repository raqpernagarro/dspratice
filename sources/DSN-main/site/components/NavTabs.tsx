'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Boxes, Coins, LayoutTemplate, MousePointerClick, Sparkles, SwatchBook } from 'lucide-react';
import { TabNav } from 'ds-ngr';

const TABS: { href: string; label: string; icon: typeof Boxes; match?: string[] }[] = [
  { href: '/docs', label: 'Docs', icon: BookOpen, match: ['/docs', '/guides', '/patterns'] },
  { href: '/components', label: 'Components', icon: Boxes },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/foundations/tokens', label: 'Tokens', icon: Coins },
  { href: '/brands', label: 'Brands', icon: SwatchBook },
  { href: '/skills', label: 'Skills', icon: Sparkles },
  { href: '/prototype', label: 'Prototype', icon: MousePointerClick },
];

export function NavTabs() {
  const pathname = usePathname();
  return (
    <TabNav
      aria-label="Main"
      className="site-tabs"
      linkAs={Link}
      items={TABS.map((t) => ({
        href: t.href,
        label: t.label,
        current: (t.match ?? [t.href]).some((m) => pathname.startsWith(m)),
        showLeadingIcon: true,
        leadingIcon: <t.icon size={16} />,
      }))}
    />
  );
}

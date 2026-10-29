import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen, Compass, House } from '@phosphor-icons/react';
import { NavigationMenu } from './components/navigation-menu/NavigationMenu';
import { navigationMenuItemSpec } from './components/navigation-menu/navigation-menu-item.spec';
import { navigationMenuLinkSpec } from './components/navigation-menu/navigation-menu-link.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const overview = [
  ['Quick start', 'Install and assemble your first component.'],
  ['Accessibility', 'Learn how we build accessible components.'],
  ['Releases', 'See what’s new in the latest versions.'],
];
const handbook = [
  ['Styling', 'Style components with plain CSS, Tailwind or CSS-in-JS.'],
  ['Animation', 'Animate with CSS transitions or JavaScript libraries.'],
  ['Composition', 'Replace and compose parts with your own components.'],
];

function NavigationMenuExample() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#" icon={House} active onClick={(e) => e.preventDefault()}>
            Home
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        {[
          ['Overview', Compass, overview],
          ['Handbook', BookOpen, handbook],
        ].map(([name, icon, links]) => (
          <NavigationMenu.Item key={name as string}>
            <NavigationMenu.Trigger icon={icon as typeof House}>{name as string}</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              {(links as string[][]).map(([title, description]) => (
                <NavigationMenu.Card key={title} href="#" title={title} description={description} onClick={(e) => e.preventDefault()} />
              ))}
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
      <NavigationMenu.Popup />
    </NavigationMenu.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Navigation Menu',
  component: NavigationMenuExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof NavigationMenuExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Home is the current page (filled icon). Hover Overview or Handbook: the open trigger’s icon fills too. */
export const Default: Story = {};

/** The bar with an open panel, as designed in Figma (static). */
export const Preview: Story = { render: () => <>{SPECIMENS['navigation-menu']({})}</> };

/** Every Navigation Menu Item variant (Type × State × Active). */
export const ItemMatrix: Story = {
  render: () => <SpecMatrix spec={navigationMenuItemSpec} render={SPECIMENS['navigation-menu-item']} />,
  parameters: { layout: 'padded' },
};

/** Every Navigation Menu Link variant. */
export const LinkMatrix: Story = {
  render: () => <SpecMatrix spec={navigationMenuLinkSpec} render={SPECIMENS['navigation-menu-link']} />,
  parameters: { layout: 'padded' },
};

/**
 * Where each component sits in the catalog: the breadcrumb on its Figma documentation panel
 * ("Components / Button & Actions / Icon Button"). Keyed by spec name.
 */
export const CATEGORIES: Record<string, string[]> = {
  'Button & Actions': ['Button', 'Icon Button', 'Toggle', 'Toggle Group', 'Toolbar'],
  'Form Controls': ['Input', 'Field', 'Fieldset', 'Form', 'Checkbox', 'Checkbox Group', 'Radio', 'Radio Group', 'Switch', 'Slider', 'Number Field', 'OTP Field', 'OTP Slot'],
  Selection: ['Select', 'Combobox', 'Autocomplete', 'Listbox', 'Option'],
  Menus: ['Menu', 'Menu Item', 'Menu Group Label', 'Menu Separator', 'Menubar', 'Menubar Item'],
  Navigation: ['Navigation Menu', 'Navigation Menu Item', 'Navigation Menu Link', 'Tabs', 'Tab', 'Breadcrumb Item', 'Breadcrumb', 'Pagination'],
  Overlays: ['Popover', 'Tooltip', 'Preview Card', 'Dialog', 'Alert Dialog', 'Drawer'],
  Feedback: ['Toast', 'Progress', 'Meter', 'Skeleton', 'Empty State'],
  'Layout & Disclosure': ['Accordion', 'Accordion Item', 'Collapsible', 'Separator', 'Scroll Area', 'Card'],
  Display: ['Avatar', 'Badge'],
}

export function categoryOf(name: string): string {
  const hit = Object.entries(CATEGORIES).find(([, names]) => names.includes(name))
  if (!hit) throw new Error(`No category for ${name}: add it to spec/categories.ts`)
  return hit[0]
}

/** The catalog order (category by category), which numbers the Figma frames: "03 · Toggle". */
export const CATALOG: string[] = Object.values(CATEGORIES).flat()

export function catalogNumber(name: string): string {
  const i = CATALOG.indexOf(name)
  if (i < 0) throw new Error(`${name} is not in the catalog: add it to spec/categories.ts`)
  return String(i + 1).padStart(2, '0')
}

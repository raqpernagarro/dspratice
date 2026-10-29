/** Starter pack choices — shared by the configurator UI and the zip builder. */
export const STARTER_PAGES = [
  { value: 'blank', label: 'Blank page', description: 'App frame and a welcome card', file: 'Blank.tsx' },
  { value: 'dashboard', label: 'Dashboard', description: 'KPI cards and charts', file: 'Dashboard.tsx' },
  { value: 'data-page', label: 'Data page', description: 'Filter bar and data table', file: 'DataPage.tsx' },
  { value: 'form-page', label: 'Form page', description: 'Sectioned form in cards', file: 'FormPage.tsx' },
] as const;

export type StarterPage = (typeof STARTER_PAGES)[number]['value'];

export const DEFAULT_STARTER_NAME = 'my-dsn-app';

/** Valid npm package name from free text ('My App!' → 'my-app'). */
export function toPackageName(input: string): string {
  const name = input.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return name || DEFAULT_STARTER_NAME;
}

import type { ReactNode } from 'react';

/**
 * Shared TypeScript interfaces for the DS-Ngr component library.
 *
 * Prop values map directly to Figma variant property names.
 * Size mapping: Small → "sm" | Medium → "md" | Large → "lg" | xLarge → "xl" | xxLarge → "2xl"
 */

/** Universal size scale used across all sizable components */
export type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Base props forwarded by every component */
export interface BaseProps {
  /** Additional CSS class names */
  className?: string;
  /** HTML id attribute */
  id?: string;
}

/** Props shared by all form control components */
export interface FormControlProps extends BaseProps {
  /** Visible label text */
  label?: string;
  /** Accessible label when no visible label is provided */
  'aria-label'?: string;
  /** Helper / description text rendered below the input */
  helpText?: string;
  /** Error message — also sets aria-invalid */
  errorMessage?: string;
  /** Whether the field is in an error state */
  error?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is read-only */
  readOnly?: boolean;
  /** Associates help and error text via aria-describedby */
  describedById?: string;
}

/**
 * Data table cell renderer, 1:1 with the Figma `Data table / Cell / Table cell` "Field type" property.
 * `tag` and `user` are legacy aliases of `tags-multi` and `single-user`.
 */
export type DataTableFieldType =
  /** Figma: Main — primary record column (avatar + emphasized label) */
  | 'main'
  /** Figma: String — read-only text */
  | 'string'
  /** Figma: Text field (single line) */
  | 'text'
  /** Figma: Text field (long text) */
  | 'long-text'
  /** Figma: Email */
  | 'email'
  /** Figma: Phone number */
  | 'phone'
  /** Figma: Address */
  | 'address'
  /** Figma: Contact — one person rendered as a pill */
  | 'contact'
  /** Figma: Contacts (table) — several pills in one line */
  | 'contacts'
  /** Figma: Contacts (description list) — pills stacked vertically. Description-list rows only — never a DataTable column (use `contacts`). */
  | 'contacts-list'
  /** Figma: Date and time */
  | 'datetime'
  /** Figma: Date */
  | 'date'
  /** Figma: Month and year */
  | 'month-year'
  /** Figma: Number */
  | 'number'
  /** Figma: Range — `[min, max]` */
  | 'range'
  /** Figma: Single choice */
  | 'single-choice'
  /** Figma: Multi choice */
  | 'multi-choice'
  /** Figma: Single user or team */
  | 'single-user'
  /** Figma: Multiple users or teams */
  | 'multi-user'
  /** Figma: URL — editable link */
  | 'url'
  /** Figma: URL read-only */
  | 'url-readonly'
  /** Figma: Boolean */
  | 'boolean'
  /** Figma: Buttons */
  | 'buttons'
  /** Figma: Tags single choice */
  | 'tags-single'
  /** Figma: Tags multi choice */
  | 'tags-multi'
  /** Figma: Tags read-only */
  | 'tags-readonly'
  /** Figma: File (single) */
  | 'file'
  /** Figma: Checkbox (row selection) */
  | 'checkbox'
  /** Figma: Expand — row expand toggle */
  | 'expand'
  /** Figma: Empty — placeholder prompt */
  | 'empty'
  /** Figma: Icon — single icon */
  | 'icon'
  /** @deprecated alias of `tags-multi` */
  | 'tag'
  /** @deprecated alias of `single-user` */
  | 'user';

/** Hover action emitted by a DataTableCell */
export type DataTableCellAction =
  | 'copy'
  | 'edit'
  | 'delete'
  | 'open'
  | 'side-panel'
  | 'menu'
  | 'calendar'
  | 'email'
  | 'call'
  | 'message'
  | 'upload'
  | 'add'
  | 'open-external'
  | 'expand';

/** Column sizing strategy */
export type DataTableColumnWidthMode = 'fixed' | 'hug' | 'stretch';

/** Text alignment used for headers and cells */
export type DataTableCellAlign = 'left' | 'center' | 'right';

/** Sort direction for sortable column headers */
export type DataTableSortDirection = 'none' | 'asc' | 'desc';

/** Column definition used by DataTable */
export interface DataTableColumnDef {
  id: string;
  header: string;
  fieldType: DataTableFieldType;
  headerVariant?: 'title' | 'checkbox';
  widthMode?: DataTableColumnWidthMode;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  reorderable?: boolean;
  frozen?: boolean;
  align?: DataTableCellAlign;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

/** Row model used by DataTable */
export interface DataTableRow {
  id: string;
  cells: Record<string, unknown>;
}

/** Shared state model for data visualization components */
export type ChartState = 'default' | 'loading' | 'empty' | 'error';

/** Generic cartesian data point model used by line/bar charts */
export interface ChartDataPoint {
  [key: string]: string | number | null | undefined;
}

/** Shared series descriptor for cartesian charts */
export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

/** Donut/pie slice model */
export interface ChartDonutSlice {
  id: string;
  label: string;
  value: number;
  color?: string;
}

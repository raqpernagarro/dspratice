/**
 * DS-Ngr Component Library — Public API
 *
 * All components are exported from here. Import order follows the
 * generation order defined in CLAUDE.md (atoms → molecules → organisms).
 */

// ─── Atoms ───────────────────────────────────────────────────────────────────
export { Button, VerticalButton } from './components/atoms/Button';
export { ToggleButton } from './components/atoms/Button';
export { SplitButton } from './components/atoms/ButtonGroup';
export { ButtonGroup } from './components/atoms/ButtonGroup';
export { ButtonGroupVertical } from './components/atoms/ButtonGroup';
export type {
  ButtonGroupProps,
  ButtonGroupSize,
  ButtonGroupVerticalProps,
  ButtonGroupVerticalSize,
  SplitButtonProps,
  SplitButtonSize,
  SplitButtonVariant,
} from './components/atoms/ButtonGroup';
export type { ButtonProps, ButtonVariant, ButtonSize, VerticalButtonProps, VerticalButtonVariant, VerticalButtonSize } from './components/atoms/Button';
export type { ToggleButtonProps, ToggleButtonVariant, ToggleButtonSize } from './components/atoms/Button';
export { Shortcut } from './components/atoms/Shortcut';
export type { ShortcutProps, ShortcutContentColor } from './components/atoms/Shortcut';
export { Avatar, AvatarGroup } from './components/atoms/Avatar';
export type { AvatarProps, AvatarSize, AvatarVariant, AvatarFill, AvatarGroupProps, AvatarGroupSize, AvatarItem } from './components/atoms/Avatar';
export { Badge } from './components/atoms/Badge';
export type { BadgeProps, BadgeSize, BadgeVariant } from './components/atoms/Badge';
export { Stat } from './components/atoms/Stat';
export type { StatProps, StatVariant } from './components/atoms/Stat';
export { Tag } from './components/atoms/Tag';
export type { TagProps, TagVariant, TagSize } from './components/atoms/Tag';
export { Chip, ChipGroup } from './components/atoms/Chip';
export type { ChipProps, ChipGroupProps, ChipSize } from './components/atoms/Chip';
export { AttachmentChip } from './components/atoms/Attachment';
export type {
  AttachmentChipProps,
  AttachmentChipAction,
  AttachmentChipSize,
  AttachmentChipMenuOption,
} from './components/atoms/Attachment';
export { AttachmentField } from './components/atoms/Attachment';
export type { AttachmentFieldProps } from './components/atoms/Attachment';
export { AttachmentCard } from './components/atoms/Attachment';
export type {
  AttachmentCardProps,
  AttachmentCardVariant,
  AttachmentCardDescriptionPosition,
  AttachmentCardAction,
} from './components/atoms/Attachment';
export { FileRow } from './components/atoms/Attachment';
export type { FileRowProps, FileRowState } from './components/atoms/Attachment';
export { AspectRatio } from './components/atoms/AspectRatio';
export type {
  AspectRatioProps,
  AspectRatioRatio,
  AspectRatioFit,
  AspectRatioShape,
} from './components/atoms/AspectRatio';
export { Separator } from './components/atoms/Separator';
export type { SeparatorProps, SeparatorDirection } from './components/atoms/Separator';
export { Switcher } from './components/atoms/Switcher';
export type { SwitcherProps, SwitcherSize } from './components/atoms/Switcher';
export { ProgressBar } from './components/atoms/ProgressBar';
export type { ProgressBarProps } from './components/atoms/ProgressBar';
export { LoadingBar } from './components/atoms/LoadingBar';
export type { LoadingBarProps } from './components/atoms/LoadingBar';
export { SkeletonLoading } from './components/atoms/SkeletonLoading';
export type { SkeletonLoadingProps, SkeletonLoadingType } from './components/atoms/SkeletonLoading';
export { ProgressRing } from './components/atoms/ProgressRing';
export type { ProgressRingProps, ProgressRingSize } from './components/atoms/ProgressRing';
export { Checkbox } from './components/atoms/Checkbox';
export type { CheckboxProps, CheckboxSize } from './components/atoms/Checkbox';
export { Radio } from './components/atoms/Radio';
export type { RadioProps, RadioSize } from './components/atoms/Radio';
export { TextInput } from './components/atoms/TextInput';
export type { TextInputProps } from './components/atoms/TextInput';
export { NumberInput } from './components/atoms/NumberInput';
export type { NumberInputProps } from './components/atoms/NumberInput';
export { PasswordInput, PasswordRequirement } from './components/atoms/PasswordInput';
export type { PasswordInputProps, PasswordRequirementProps } from './components/atoms/PasswordInput';
export { OTPInput } from './components/atoms/OTPInput';
export type { OTPInputProps } from './components/atoms/OTPInput';
export { PhoneInput } from './components/atoms/PhoneInput';
export type { PhoneInputProps, PhoneCountryOption } from './components/atoms/PhoneInput';
export { TextArea } from './components/atoms/TextArea';
export type { TextAreaProps } from './components/atoms/TextArea';
export { SearchBar } from './components/atoms/SearchBar';
export type { SearchBarProps, SearchBarVariant } from './components/atoms/SearchBar';
export { Select } from './components/atoms/Select';
export type { SelectProps, SelectOption } from './components/atoms/Select';
export { Combobox } from './components/atoms/Combobox';
export type { ComboboxProps, ComboboxOption } from './components/atoms/Combobox';
export { DateTimePicker } from './components/atoms/DateTimePicker';
export type {
  DateTimePickerProps,
  DateTimePickerSelectionMode,
  DateTimePickerPreset,
  DateTimePickerValue,
  DateRangeValue,
} from './components/atoms/DateTimePicker';
export { UploadArea } from './components/atoms/UploadArea';
export type { UploadAreaProps } from './components/atoms/UploadArea';
export { MenuCell } from './components/atoms/MenuCell';
export type { MenuCellProps, MenuCellVariant } from './components/atoms/MenuCell';
export { FileThumbnail } from './components/atoms/Attachment';
export type { FileThumbnailProps, FileThumbnailVariant, FileThumbnailSize } from './components/atoms/Attachment';
export { SectionHeader } from './components/atoms/SectionHeader';
export type { SectionHeaderProps, SectionHeaderSize } from './components/atoms/SectionHeader';
export { SegmentControl } from './components/atoms/SegmentControl';
export type { SegmentControlProps, SegmentControlOption } from './components/atoms/SegmentControl';
export { Tab, TabNav } from './components/atoms/Tab';
export type { TabProps, TabItem, TabNavProps, TabNavItem } from './components/atoms/Tab';
export { CustomViewTab, CustomViewTabs } from './components/atoms/CustomViewTab';
export type { CustomViewTabProps, CustomViewTabsProps, CustomViewTabItem } from './components/atoms/CustomViewTab';
export { DataTableHeaderCell } from './components/atoms/DataTableHeaderCell';
export type {
  DataTableHeaderCellProps,
  DataTableHeaderCellVariant,
  DataTableHeaderCellState,
  DataTableHeaderReorderDirection,
  DataTableHeaderResizeDirection,
} from './components/atoms/DataTableHeaderCell';
export { DataTableCell } from './components/atoms/DataTableCell';
export type { DataTableCellProps, DataTableCellState } from './components/atoms/DataTableCell';
export { DataListCell } from './components/atoms/DataListCell';
export type {
  DataListCellProps,
  DataListCellAlignment,
  DataListCellVariant,
  DataListCellState,
} from './components/atoms/DataListCell';

// ─── Molecules ───────────────────────────────────────────────────────────────
export { ChoiceList } from './components/molecules/ChoiceList';
export type {
  ChoiceListProps,
  ChoiceListSection,
  ChoiceListItem,
  ChoiceListItemKind,
  ChoiceListMenuItem,
  ChoiceListCheckboxItem,
  ChoiceListRadioItem,
  ChoiceListVariant,
} from './components/molecules/ChoiceList';
export { Toolbar } from './components/molecules/Toolbar';
export type { ToolbarProps, ToolbarSize } from './components/molecules/Toolbar';
export { CheckboxField } from './components/molecules/CheckboxField';
export type { CheckboxFieldProps } from './components/molecules/CheckboxField';
export { HorizontalInput } from './components/molecules/HorizontalInput';
export type { HorizontalInputProps } from './components/molecules/HorizontalInput';
export { MultiChoice } from './components/molecules/MultiChoice';
export type { MultiChoiceProps, MultiChoiceOption } from './components/molecules/MultiChoice';
export { SingleChoice } from './components/molecules/SingleChoice';
export type { SingleChoiceProps, SingleChoiceOption } from './components/molecules/SingleChoice';
export { BulkActionBar } from './components/molecules/BulkActionBar';
export type { BulkActionBarProps, BulkAction } from './components/molecules/BulkActionBar';
export { ChipField } from './components/molecules/ChipField';
export type { ChipFieldProps, ChipFieldOption } from './components/molecules/ChipField';
export { Slider } from './components/molecules/Slider';
export type { SliderProps } from './components/molecules/Slider';
export { PopoverWrapper } from './components/molecules/PopoverWrapper';
export type {
  PopoverWrapperProps,
  PopoverWrapperRole,
  PopoverWrapperContentPadding,
  PopoverPreferredPlacement,
} from './components/molecules/PopoverWrapper';
export { Toast } from './components/molecules/Toast';
export type { ToastProps, ToastSeverity, ToastVariant } from './components/molecules/Toast';
export { Carousel, CarouselSlide } from './components/molecules/Carousel';
export type { CarouselProps, CarouselSlideProps, CarouselShape } from './components/molecules/Carousel';
export { Callout } from './components/molecules/Callout';
export type { CalloutProps, CalloutSeverity } from './components/molecules/Callout';
export { Form } from './components/molecules/Form';
export type { FormProps } from './components/molecules/Form';
export { Fieldset } from './components/molecules/Fieldset';
export type { FieldsetProps } from './components/molecules/Fieldset';
export { Tooltip } from './components/molecules/Tooltip';
export type { TooltipProps, TooltipPlacement } from './components/molecules/Tooltip';
export { Accordion } from './components/molecules/Accordion';
export type { AccordionProps, AccordionDisclosure } from './components/molecules/Accordion';
export { Pagination } from './components/atoms/Pagination';
export type { PaginationProps } from './components/atoms/Pagination';
export { PageSelector } from './components/atoms/Pagination';
export type { PageSelectorProps } from './components/atoms/Pagination';
export { Breadcrumbs } from './components/molecules/Breadcrumbs';
export type {
  BreadcrumbsProps,
  BreadcrumbsSize,
  BreadcrumbItem,
  BreadcrumbItemVariant,
} from './components/molecules/Breadcrumbs';
export { SidebarMenuSelector } from './components/molecules/SidebarMenuSelector';
export type {
  SidebarMenuSelectorProps,
  SidebarMenuSelectorVariant,
} from './components/molecules/SidebarMenuSelector';
export { EmptyState } from './components/molecules/EmptyState';
export type { EmptyStateProps, EmptyStateSize } from './components/molecules/EmptyState';
export { RichTextEditor } from './components/molecules/RichTextEditor';
export type { RichTextEditorProps, RichTextEditorAttachment } from './components/molecules/RichTextEditor';
export { PromptInput } from './components/molecules/PromptInput';
export type {
  PromptInputProps,
  PromptInputQuickAction,
  PromptInputAttachment,
  PromptInputModelOption,
} from './components/molecules/PromptInput';
export { useVoiceInput } from './hooks';
export type { UseVoiceInputOptions, UseVoiceInputReturn, VoiceError, VoiceErrorType } from './hooks';

// ─── Organisms ───────────────────────────────────────────────────────────────
export { PopoverMenu } from './components/organisms/PopoverMenu';
export type {
  PopoverMenuProps,
  PopoverMenuAnchorProps,
  PopoverMenuVariant,
  PopoverMenuChoiceList,
} from './components/organisms/PopoverMenu';
export { Modal } from './components/organisms/Modal';
export type { ModalProps } from './components/organisms/Modal';
export { MediaViewer, getFileTypeLabel } from './components/organisms/MediaViewer';
export type {
  MediaViewerProps,
  MediaViewerItem,
  MediaViewerItemType,
  MediaViewerOwner,
} from './components/organisms/MediaViewer';
export { NotificationCenter } from './components/organisms/NotificationCenter';
export type {
  NotificationCenterProps,
  NotificationFilter,
  NotificationItem,
} from './components/organisms/NotificationCenter';
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandDialog,
  commandScore,
} from './components/organisms/Command';
export type {
  CommandProps,
  CommandInputProps,
  CommandListProps,
  CommandEmptyProps,
  CommandGroupProps,
  CommandItemProps,
  CommandSeparatorProps,
  CommandDialogProps,
  CommandFilter,
} from './components/organisms/Command';
export { Drawer } from './components/organisms/Drawer';
export type { DrawerProps, DrawerVariant, DrawerPlacement } from './components/organisms/Drawer';
export { AlertDialog } from './components/organisms/AlertDialog';
export type { AlertDialogProps, AlertDialogVariant } from './components/organisms/AlertDialog';
export { DataTable } from './components/organisms/DataTable';
export type { DataTableProps, DataTableSortState } from './components/organisms/DataTable';
export { Card } from './components/organisms/Card';
export type { CardProps } from './components/organisms/Card';
export {
  LineChart,
  BarChart,
  DonutChart,
  AreaChart,
  HorizontalStackedBarChart,
  StreamgraphChart,
  BrushLineChart,
  XYLineChart,
  HeatmapChart,
  ChartCard,
} from './components/organisms/Charts';
export type {
  LineChartProps,
  BarChartProps,
  DonutChartProps,
  AreaChartProps,
  HorizontalStackedBarChartProps,
  StreamgraphChartProps,
  BrushLineChartProps,
  XYLineChartProps,
  HeatmapChartProps,
  HeatmapChartColumn,
  HeatmapChartCell,
  ChartCardProps,
} from './components/organisms/Charts';
export { Navbar } from './components/organisms/Navbar';
export type { NavbarProps, NavbarVariant } from './components/organisms/Navbar';
export { Sidebar } from './components/organisms/Sidebar';
export type { SidebarProps, SidebarMenuItem, SidebarSection, SidebarAction } from './components/organisms/Sidebar';
export { AppShell } from './components/organisms/AppShell';
export type { AppShellProps } from './components/organisms/AppShell';
export { CalendarView } from './components/organisms/CalendarView';
export type {
  CalendarEvent,
  CalendarViewMode,
  CalendarViewProps,
} from './components/organisms/CalendarView';

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  Size,
  BaseProps,
  FormControlProps,
  DataTableFieldType,
  DataTableCellAction,
  DataTableColumnWidthMode,
  DataTableCellAlign,
  DataTableSortDirection,
  DataTableColumnDef,
  DataTableRow,
  ChartState,
  ChartDataPoint,
  ChartSeries,
  ChartDonutSlice,
} from './types/common';
export type { IconSource } from './types/icon';

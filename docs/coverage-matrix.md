# Coverage matrix — DSN × DS Starter Pack

Generated 2026-10-21T17:52:41.476Z by `node scripts/build-registry.mjs` from the registry in `src/library/generated/`. Do not edit by hand; the hand-written overlaps file (unified equivalents) comes later and will replace the `tbd` column.

## Summary

### DSN (`ds-ngr`)

- Components: **105** (97 top-level, 8 parts with a parent)
- With spec: 104 · with stories: 104 · with tests: 101 · with Code Connect: 77
- Heavy (lazy): 22 · preserved: 8 · rendered from source: 81
- Figma file: `9Lqv0lrj1pRM14NVs4TsSk` · package: `ds-ngr@0.1.44`

### DS Starter Pack

- Components: **57** (44 top-level, 13 parts with a parent)
- With spec: 56 · with stories: 57 · with tests: 0 · with Code Connect: 44
- Heavy (lazy): 0 · preserved: 12 · rendered from source: 45
- Figma file: `0lCfWZBgpscbrOKQ7iIRi8` · package: `nagarro-ds-starter-pack@1.0.0`

Legend — **Reused how**: `source import` = rendered straight from the source repo; `lazy` = heavy dependency or size, loaded on demand; `preserved` = kept as reference only (DSN AppShell, sub-parts that need a parent). **Implementation status**: `renderer` is `no` until the unified tool registers a renderer for the id; `tests in source` / `stories` refer to the source repo. **Design parity**: Code Connect presence and the Figma node id are read from the repos; live parity against Figma is never verified by this script.

## DSN

| Source asset | Reused how | Unified equivalent or preserved alternative | Implementation status | Design parity |
|---|---|---|---|---|
| **Accordion** `dsn:accordion` — molecule · Layout | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8246:322090 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AlertDialog** `dsn:alert-dialog` — organism · Overlays | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 4552:110701 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AppShell** `dsn:app-shell` — organism · Layout | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AreaChart** `dsn:area-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AspectRatio** `dsn:aspect-ratio` — atom · Layout | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 9647:51145 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AttachmentCard** `dsn:attachment-card` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 4529:112526 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AttachmentChip** `dsn:attachment-chip` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 4533:107444 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AttachmentField** `dsn:attachment-field` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8772:601900 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Avatar** `dsn:avatar` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 111:5684 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **AvatarGroup** `dsn:avatar-group` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 3058:116174 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Badge** `dsn:badge` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 642:18316 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **BarChart** `dsn:bar-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8868:25923 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Breadcrumbs** `dsn:breadcrumbs` — molecule · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1393:46853 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **BrushLineChart** `dsn:brush-line-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **BulkActionBar** `dsn:bulk-action-bar` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 8922:15948 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Button** `dsn:button` — atom · Actions | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 19:574 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ButtonGroup** `dsn:button-group` — atom · Actions | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 947:10906 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ButtonGroupVertical** `dsn:button-group-vertical` — atom · Actions | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8488:52442 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CalendarView** `dsn:calendar-view` — organism · Data Display | lazy | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Callout** `dsn:callout` — molecule · Feedback | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8683:47493 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Card** `dsn:card` — organism · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8949:22777 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Carousel** `dsn:carousel` — molecule · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 9650:333831 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CarouselSlide** `dsn:carousel-slide` — part · Data Display (part of `dsn:carousel`) | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ChartCard** `dsn:chart-card` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Checkbox** `dsn:checkbox` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8441:154815 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CheckboxField** `dsn:checkbox-field` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8515:38459 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Chip** `dsn:chip` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1544:19006 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ChipField** `dsn:chip-field` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8515:41820 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ChipGroup** `dsn:chip-group` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8515:36008 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ChoiceList** `dsn:choice-list` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8572:15962 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Combobox** `dsn:combobox` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8822:61813 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Command** `dsn:command` — organism · Navigation | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CommandDialog** `dsn:command-dialog` — organism · Navigation (part of `dsn:command`) | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CommandEmpty** `dsn:command-empty` — part · Navigation (part of `dsn:command`) | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CommandGroup** `dsn:command-group` — part · Navigation (part of `dsn:command`) | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CommandInput** `dsn:command-input` — part · Navigation (part of `dsn:command`) | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CommandItem** `dsn:command-item` — part · Navigation (part of `dsn:command`) | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CommandList** `dsn:command-list` — part · Navigation (part of `dsn:command`) | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CommandSeparator** `dsn:command-separator` — part · Navigation (part of `dsn:command`) | preserved | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CustomViewTab** `dsn:custom-view-tab` — atom · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 132:7427 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **CustomViewTabs** `dsn:custom-view-tabs` — atom · Navigation | source import | tbd | renderer no · tests in source no · stories no | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **DataListCell** `dsn:data-list-cell` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1719:67872 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **DataTable** `dsn:data-table` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **DataTableCell** `dsn:data-table-cell` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 179:2495 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **DataTableHeaderCell** `dsn:data-table-header-cell` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 179:2156 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **DateTimePicker** `dsn:date-time-picker` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1697:33038 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **DonutChart** `dsn:donut-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8868:25925 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Drawer** `dsn:drawer` — organism · Overlays | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8784:10454 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **EmptyState** `dsn:empty-state` — molecule · Feedback | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8512:21029 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Fieldset** `dsn:fieldset` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **FileRow** `dsn:file-row` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 4540:121392 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **FileThumbnail** `dsn:file-thumbnail` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Form** `dsn:form` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **HeatmapChart** `dsn:heatmap-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **HorizontalInput** `dsn:horizontal-input` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 5190:212002 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **HorizontalStackedBarChart** `dsn:horizontal-stacked-bar-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **LineChart** `dsn:line-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8868:25924 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **LoadingBar** `dsn:loading-bar` — atom · Feedback | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8570:51729 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **MediaViewer** `dsn:media-viewer` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **MenuCell** `dsn:menu-cell` — atom · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 204:19436 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Modal** `dsn:modal` — organism · Overlays | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1229:16497 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **MultiChoice** `dsn:multi-choice` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8515:36405 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Navbar** `dsn:navbar` — organism · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8620:54668 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **NotificationCenter** `dsn:notification-center` — organism · Overlays | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **NumberInput** `dsn:number-input` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1613:49241 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **OTPInput** `dsn:otp-input` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8572:19405 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **PageSelector** `dsn:page-selector` — atom · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Pagination** `dsn:pagination` — atom · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 609:16611 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **PasswordInput** `dsn:password-input` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8572:18974 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **PasswordRequirement** `dsn:password-requirement` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **PhoneInput** `dsn:phone-input` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 487:38022 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **PopoverMenu** `dsn:popover-menu` — organism · Overlays | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8567:27319 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **PopoverWrapper** `dsn:popover-wrapper` — molecule · Overlays | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1229:16495 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ProgressBar** `dsn:progress-bar` — atom · Feedback | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 5291:723275 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ProgressRing** `dsn:progress-ring` — atom · Feedback | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8570:51697 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **PromptInput** `dsn:prompt-input` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 9180:10128 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Radio** `dsn:radio` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8442:6760 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **RichTextEditor** `dsn:rich-text-editor` — molecule · Inputs & Controls | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 409:7293 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **SearchBar** `dsn:search-bar` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 390:24397 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **SectionHeader** `dsn:section-header` — atom · Layout | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 345:20068 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **SegmentControl** `dsn:segment-control` — atom · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 242:8752 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Select** `dsn:select` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 409:9847 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Separator** `dsn:separator` — atom · Layout | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 6006:357608 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Shortcut** `dsn:shortcut` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8508:59670 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Sidebar** `dsn:sidebar` — organism · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1359:12674 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **SidebarMenuSelector** `dsn:sidebar-menu-selector` — molecule · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 126:6836 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **SingleChoice** `dsn:single-choice` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8515:39160 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **SkeletonLoading** `dsn:skeleton-loading` — atom · Feedback | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 4016:242608 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Slider** `dsn:slider` — molecule · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 2514:45982 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **SplitButton** `dsn:split-button` — atom · Actions | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 5772:189085 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Stat** `dsn:stat` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8821:61808 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **StreamgraphChart** `dsn:streamgraph-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Switcher** `dsn:switcher` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 204:18242 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Tab** `dsn:tab` — atom · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **TabNav** `dsn:tab-nav` — atom · Navigation | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 132:8663 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Tag** `dsn:tag` — atom · Data Display | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 184:9584 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **TextArea** `dsn:text-area` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 390:23634 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **TextInput** `dsn:text-input` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 109:381 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Toast** `dsn:toast` — molecule · Feedback | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 2884:87110 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **ToggleButton** `dsn:toggle-button` — atom · Actions | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8412:66648 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Toolbar** `dsn:toolbar` — molecule · Actions | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 725:48320 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **Tooltip** `dsn:tooltip` — molecule · Overlays | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 1017:7179 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **UploadArea** `dsn:upload-area` — atom · Inputs & Controls | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 8586:53892 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **VerticalButton** `dsn:vertical-button` — atom · Actions | source import | tbd | renderer no · tests in source yes · stories yes | Code Connect yes · node 107:87 · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |
| **XYLineChart** `dsn:xy-line-chart` — organism · Data Display | lazy | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 9Lqv0lrj1pRM14NVs4TsSk · live parity unverified |

## DS Starter Pack

| Source asset | Reused how | Unified equivalent or preserved alternative | Implementation status | Design parity |
|---|---|---|---|---|
| **Accordion** `starter:accordion` — Layout & Disclosure | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7503 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Accordion Item** `starter:accordion-item` — part · Layout & Disclosure (part of `starter:accordion`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7353 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Alert Dialog** `starter:alert-dialog` — Overlays | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6908 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Autocomplete** `starter:autocomplete` — Selection | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node 2059:6709 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Avatar** `starter:avatar` — Display | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2058:5716 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Badge** `starter:badge` — Display | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Breadcrumb** `starter:breadcrumb` — Navigation | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Breadcrumb Item** `starter:breadcrumb-item` — part · Navigation (part of `starter:breadcrumb`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Button** `starter:button` — Button & Actions | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 221:2 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Card** `starter:card` — Layout & Disclosure | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Checkbox** `starter:checkbox` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:1742 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Checkbox Group** `starter:checkbox-group` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6558 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Collapsible** `starter:collapsible` — Layout & Disclosure | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7452 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Combobox** `starter:combobox` — Selection | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2057:5305 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Context Menu** `starter:context-menu` — Menus | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Dialog** `starter:dialog` — Overlays | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6798 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Drawer** `starter:drawer` — Overlays | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7066 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Empty State** `starter:empty-state` — Feedback | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Field** `starter:field` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6330 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Fieldset** `starter:fieldset` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6412 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Form** `starter:form` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6413 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Icon Button** `starter:icon-button` — Button & Actions | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 261:1993 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Input** `starter:input` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:1470 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Listbox** `starter:listbox` — part · Selection (part of `starter:select`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect no · node 2059:6685 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Menu** `starter:menu` — Menus | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6224 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Menu Group Label** `starter:menu-group-label` — part · Menus (part of `starter:menu`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6217 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Menu Item** `starter:menu-item` — part · Menus (part of `starter:menu`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:1906 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Menu Separator** `starter:menu-separator` — part · Menus (part of `starter:menu`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6221 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Menubar** `starter:menubar` — Menus | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6608 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Menubar Item** `starter:menubar-item` — part · Menus (part of `starter:menubar`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2057:5316 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Meter** `starter:meter` — Feedback | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7304 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Navigation Menu** `starter:navigation-menu` — Navigation | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6757 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Navigation Menu Item** `starter:navigation-menu-item` — part · Navigation (part of `starter:navigation-menu`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect no · node 2057:5425 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Navigation Menu Link** `starter:navigation-menu-link` — part · Navigation (part of `starter:navigation-menu`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6755 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Number Field** `starter:number-field` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:4522 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Option** `starter:option` — part · Selection (part of `starter:listbox`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2057:4750 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **OTP Field** `starter:otp-field` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:4062 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **OTP Slot** `starter:otp-slot` — part · Form Controls (part of `starter:otp-field`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect no · node 2056:4021 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Pagination** `starter:pagination` — Navigation | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Popover** `starter:popover` — Overlays | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6642 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Preview Card** `starter:preview-card` — Overlays | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6684 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Progress** `starter:progress` — Feedback | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7098 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Radio** `starter:radio` — part · Form Controls (part of `starter:radio-group`) | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:2255 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Radio Group** `starter:radio-group` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6503 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Scroll Area** `starter:scroll-area` — Layout & Disclosure | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7496 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Select** `starter:select` — Selection | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2057:5008 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Separator** `starter:separator` — Layout & Disclosure | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6215 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Skeleton** `starter:skeleton` — Feedback | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node — · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Slider** `starter:slider` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:4113 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Switch** `starter:switch` — Form Controls | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:2156 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Tab** `starter:tab` — part · Navigation (part of `starter:tabs`) | preserved | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7242 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Tabs** `starter:tabs` — Navigation | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7273 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Toast** `starter:toast` — Feedback | source import | tbd | renderer no · tests in source no · stories yes | Code Connect no · node 2059:7205 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Toggle** `starter:toggle` — Button & Actions | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2056:4303 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Toggle Group** `starter:toggle-group` — Button & Actions | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6607 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Toolbar** `starter:toolbar` — Button & Actions | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:7453 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |
| **Tooltip** `starter:tooltip` — Overlays | source import | tbd | renderer no · tests in source no · stories yes | Code Connect yes · node 2059:6659 · file 0lCfWZBgpscbrOKQ7iIRi8 · live parity unverified |

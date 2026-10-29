# Figma ↔ code API audit (Code Connect readiness)

- **Figma file:** DS Nagarro (`9Lqv0lrj1pRM14NVs4TsSk`), page 🧩 Components, read live through the Desktop Bridge on 2026-10-12.
- **Code:** `ds-index.json` (generated 2026-10-12, commit `f90dce5`), checked against the source where something looked off.
- **Scope:** 92 component sets in Figma, 103 exported code components.

## Status (2026-10-12)

**Done in code:**

- **Code Connect is set up.** Added `@figma/code-connect`, `figma.config.json`, and the tsconfig types. **90 templates** live in `src/figma/*.figma.ts`, plus `Icon.figma.batch.{ts,json}`, which maps **617 icons** to `lucide-react`. `npx figma connect parse` produces 707 mappings with no errors. Every Figma property name and variant value in the templates was checked against the live file.
- **Icon contract (§0.4).** The new `IconSource` type (`src/types/icon.tsx`) lets Tag, Chip, Avatar, EmptyState and Switcher accept either `Star` or `<Star />`.
- **Mismatches fixed in code (backward compatible):**
  - Tag: `leadingIcon`/`trailingIcon`, `showLeadingIcon`/`showTrailingIcon` and `disclosure`. `iconLeft`/`iconRight`/`showIcon` are deprecated aliases.
  - Chip: `showLabel`, `showAvatar` + `avatars`.
  - Switcher: `label`/`showLabel` and `icon`/`showIcon`, rendered inside the track.
  - ToggleButton: `leadingIcon`/`showLeadingIcon` and `label`/`showLabel`. `icon` is deprecated.
  - AvatarGroup: `label`/`showLabel` and `showButton`.
  - PasswordInput: `leadingIcon`/`showLeadingIcon`.
  - NumberInput: `leadingIcon`.
  - TextArea: `trailingIcon`.
  - Toast: `content` (rich variant).
  - ChoiceList: `variant`.

**Still open:**

- **Avatar `md` (40px):** there's no 40px size token. The template already emits `size="md"`, so this needs a token decision.
- **Figma library:** publish it, including the 3 unpublished sets. Then clean up:
  - the EmptyState and PromptInput placeholder variants
  - the duplicate SLOT + INSTANCE_SWAP on Modal and Popover container
  - Header cell sort direction, which should be a VARIANT
  - Variant missing on Toggle button and Split button
- **Publishing:** `npx figma connect publish` needs a `FIGMA_ACCESS_TOKEN` with Code Connect write scope, and an editor on the file.
- **Not connected (no code counterpart):** Scrollbar, Text Block, Input / Slider (no `SliderField`), the Rich text editor sub-parts, and the 📝 Templates page.

## Legend

| Verdict | Meaning |
|---|---|
| ✅ Ready | Every Figma property maps to a real code prop. Only value renames are needed in `getEnum`. |
| 🟡 Mappable | A template can be written, but some Figma props get dropped or need `findText`/`findInstance` workarounds. |
| 🔴 Mismatch | The APIs disagree. One side has to change first, or the snippet will be wrong or invalid. |
| ⚪ No counterpart | There's nothing to connect on one side. |

Interaction states (`State = Hover / Pressed / Focused / Active / Typing`) are CSS pseudo-states in code. They're ignored in every template and aren't counted as mismatches below.

---

## 0. Blockers that affect everything

1. **Code Connect isn't set up in the repo.** There's no `figma.config.json`, no `@figma/code-connect` dependency, no `*.figma.ts` files, and `tsconfig.json` doesn't include `@figma/code-connect/figma-types`.
2. **Publish state.** 89 sets show **CHANGED**, meaning they're published but with unpublished edits. Code Connect resolves against the *published* version, so publish the library first. These 3 aren't published at all: **Aspect ratio** (`9647:51145`), **Input / Date range picker** (`8823:62649`) and **Carousel** (`9650:333831`).
3. **No edit access for the official Figma MCP.** The Figma MCP account gets *"you don't have edit access to this file"*. `get_code_connect_suggestions`, `get_context_for_code_connect` and publishing mappings all need an editor seat on this file.
4. **Icons are typed two ways in code.** `Button`, `TextInput`, `Callout` and others take `leadingIcon: ReactNode` (`<Plus />`). But **Tag** (`iconLeft/iconRight`), **Chip** (`leadingIcon/trailingIcon`), **Avatar** (`icon`) and **EmptyState** (`icon`) take a `LucideIcon` *component reference* (`Plus`). An icon template can emit only one form, so one group of components will get invalid snippets. Standardise on `ReactNode`, or give icon templates a metadata prop with the bare identifier.
5. **Collection components vs. item components.** For Tabs, Segment control, Breadcrumbs, Choice list and Pagination, Figma publishes *item* components, but code only exports a *container* that takes a data array (`tabs`, `options`, `items`, `sections`). An item instance has no valid JSX of its own. Either export item components (`<Tab.Item>`, `<SegmentControl.Option>`…) or connect only the containers and build the array from children with `findConnectedInstances` + `metadata.props`.
6. **Field labels and help text aren't Figma properties.** On every Input / * set, `Label` and `Help text` live in nested `.inputLabel` / `.inputHelpText` instances. The parent exposes only `Show label` / `Show help text`. Templates have to use `findText(..., { traverseInstances: true })`, which breaks when layers get renamed. Exposing them as TEXT props (via nested-instance property promotion) would make this robust.

---

## 1. Ready ✅

| Figma set (node) | Code | Value mapping notes |
|---|---|---|
| Button (`19:574`) | `Button` | Size Medium/Small → `md/sm`. Variant → lowercase. Disabled/Loading/Destructive are `"True"/"False"` VARIANTs, so use `getEnum` → boolean. The `Shortcut` text has to be read from the nested Shortcut instance to fill `shortcutLabel`. |
| Button / Vertical button (`107:87`) | `VerticalButton` | Icon → `icon`, Badge → `badge`, Label → children. |
| Menu cell (`204:19436`) | `MenuCell` | 1:1 across all 20 props. Show tag/badge/avatar map to `show*` plus `tagLabel`/`badge*`/`avatarProps`, read from the nested instances. |
| Checkbox (`8441:154815`) | `Checkbox` | Selected → `checked`. Mirrors MenuCell. Figma has no `indeterminate`. |
| Radio (`8442:6760`) | `Radio` | Selected → `checked`. |
| Selectors / Sidebar selector (label) (`126:6836`) + (icon) (`8113:185712`) | `SidebarMenuSelector` | Two sets → `variant="full"` / `"icon"`. Avatar → `showAvatar`, Disclosure → `showDisclosure`, Right button → `showRightButton`, Badge → `showBadge`. |
| Attachment / Attachment card (`4529:112526`) | `AttachmentCard` | Show button on hover → `showActionOnHover`, Metadata → `metaData` (camel-case mismatch only), Has metadata → `hasMetadata`. |
| File row (`4540:121392`) | `FileRow` | File name/Size/Type → `fileName/fileSize/fileType`. State → `state`. |
| Drawer (`8784:10454`) | `Drawer` | Variant "Stack with content" → `stacked`. Has header/bottom bar → `showHeader/showBottomBar`. Replace content → children. *Has scroll bar has no code prop, so drop it.* |
| Alert dialog (`4552:110701`) | `AlertDialog` | Type → `variant`. Title/message come from text layers. |
| Toolbar (`725:48320`) | `Toolbar` | Left/Right stack SLOTs → `leftActions/rightActions`. Size → `lg/md/sm`. Code `variant` (filter-bar, plain) isn't in Figma. |
| Slider (`2514:45982`) | `Slider` | Type "Max value"/"Range" → `mode` `single/range`. Stack, Show input, Disabled all match. |
| Accordion (`8246:322090`) | `Accordion` | Border → `bordered`, Open → `expanded`, Disclosure → `disclosure`. The title isn't a TEXT prop, so use `findText`. |
| Data table / Cell / Table cell (`179:2495`) | `DataTableCell` | All 31 Field type values map (see §5). The TEXT props (Label, Link, Date…) collapse into `value`. Leading icon → `leadingAccessory`. *Show avatar has no code prop.* |
| Data list cell / Info (`1719:67872`) | `DataListCell` | Alignment, Variant ("With title" → `with-title`), State, Show icon/Icon, Show actions all match. |
| Empty space content (`8512:21029`) | `EmptyState` | All 12 booleans/texts match (`Main CTA` → `showMainCta`, `Has Actions` → `hasActions`…). **But** the junk variants `Size=Pattern`, `Property 2`, `Property 3` need to become `Size = Default/Small`. Icon → `icon` hits the LucideIcon issue from §0.4. |
| Separator (`6006:357608`) | `Separator` | Direction → `direction`. |
| Shortcut (`8508:59670`) | `Shortcut` | Appearance → `contentColor`. |
| Loading / Skeleton loading (`4016:242608`) | `SkeletonLoading` | Type → `type`. |
| Loading / Spinner (`8570:51697`) | `ProgressRing` | Size Small/Large/xLarge/xxLarge → `sm/lg/xl/xxl`. |
| Loading / Bar (`8570:51729`), Progress bar (`5291:723275`) | `LoadingBar`, `ProgressBar` | No Figma props. Emit a static example `value`. |
| Stat (`8821:61808`) | `Stat` | Variant → `variant`. The title and value come from text layers. |
| Chip group (`8515:36008`) | `ChipGroup` | Children only. |
| Button group / Inline (`947:10906`), / Vertical (`8488:52442`) | `ButtonGroup`, `ButtonGroupVertical` | Size, Space between → `spaceBetween`. *Amount has no code equivalent (it's derived from children), so drop it.* |
| Input / Horizontal input (`5190:212002`) | `HorizontalInput` | Icon → `iconSlot` (name drift), Change input type → children, State Error → `error`. |
| Input / OTP (`8572:19405`) | `OTPInput` | State: Empty + Partially filled → `idle`, Verifying/Correct/Error → `verifying/correct/error`. |
| Nav bar (`8620:54668`) | `Navbar` | Mode → `variant`, Show description → `showDescription`. Show nav buttons → `leftActions` presence. |
| Sidebar (`1359:12674`) | `Sidebar` | Collapsed → `collapsed`. |
| Tooltip (`1017:7179`) | `Tooltip` | Description → `content`. `placement` isn't in Figma, so the default applies. |
| Card container (`8949:22777`) | `Card` | The 4 Variant values → the `showHeader × showBottomBar` truth table. Swap content → children. |

## 2. Mappable with losses 🟡

| Figma set | Code | Dropped / workaround |
|---|---|---|
| Input / Text input (`109:381`) | `TextInput` | **Show clear button**, **Show actions** have no code prop. `Value` is placeholder or value depending on State (Empty → `placeholder`). Label and help text via `findText` (§0.6). |
| Input / Text area (`390:23634`) | `TextArea` | **Trailing icon / Show trailing icon** has no code prop (TextArea has `leadingIcon` only). **Show actions** is dropped. |
| Input / Search (`390:24397`), Input / Search ghost (`1218:10394`) | `SearchBar` (`variant` default/ghost) | **Trailing icon**, **Show actions** have no code prop. |
| Input / Select (`409:9847`) | `Select` | **Show avatar**, **Show remove button**, **Show tag** have no code prop. State Pressed ≈ `open`. |
| Input / Combobox (`8822:61813`) + Combobox multi (`1548:22387`) | `Combobox` (`selectionMode`) | **Show actions**, **Show scroll bar (h/v)** are dropped. Show clear button → `showClearButton` ✅. |
| Input / Date picker (`8794:56699`), Date range picker (`8823:62649`), Date and time picker (`1697:33038`), (popover) (`8567:40254`) | `DateTimePicker` | Mode → `selectionMode`, the popover set → `displayMode="popover"`, Show time → `withTime`, Show actions → `showActions`. **Show quick selection** → `presets` is an array, so emit a placeholder. **Show clear button / scroll bars** are dropped. |
| Input / Upload area (`8586:53892`) | `UploadArea` | State Dropping is a pseudo-state. Fine. |
| Input / File upload (`8772:601900`) | `AttachmentField` | State "File uploaded"/"Uploaded" isn't representable (it's runtime `value`). Error → `error`. |
| Input / Multi choice, Checkbox, Single choice, Chips (`8515:36405`/`38459`/`39160`/`41820`) | `MultiChoice`, `CheckboxField`, `SingleChoice`, `ChipField` | Figma exposes only Show label/help. `options` has to be built from the nested Checkbox/Radio/Chip instances. |
| Toast / Inline toast (`2884:87110`) | `Toast variant="inline"` | Dismiss button → `dismissible`, Leading icon → `icon`, Show action → `actionLabel`. **Show title/description** booleans map to the presence of `title`/`description`. |
| Callout (`8683:47493`) | `Callout` | Content → `content` ✅. **Show header** has no code prop. |
| Attachment / Attachment chip (`4533:107444`) | `AttachmentChip` | Label → `fileName`, Metadata → `fileSize`. **Show label**, **Show metadata** have no code prop. |
| Section header (`345:20068`) | `SectionHeader` | Title, Description, Size ✅. The **9 booleans** (switcher, disclosure ×2, buttons, icons, checkbox, avatar) collapse into the `leadingControl` / `trailingControl` ReactNode slots, so resolve them with `findInstance`. |
| Data table / Cell / Header cell (`179:2156`) | `DataTableHeaderCell` | Type → `variant`, Draggable → `reorderable`, Sorted → `sortable`. **Sort direction is an INSTANCE_SWAP of an arrow icon**, so asc/desc can't be read reliably. Make it a VARIANT (`None/Asc/Desc`). |
| Popover / Simple popover menu (`8448:53918`) | `PopoverMenu variant="simple"` | Show header/bottom bar ✅. **Show scroll bar** is dropped. |
| Popover / Complex popover menu (`8567:27319`) | `PopoverMenu variant="rich"` | Figma has **no props**, but code has `showSearch`, `showSegmentControl`, `showClearFilters`, `title`. Expose them in Figma. |
| Popover / Popover container (`1229:16495`) | `PopoverWrapper` | Has header/bottom bar → `header`/`bottomBar`. **Change content (INSTANCE_SWAP) and `slot` (SLOT) duplicate each other**, so keep just the SLOT. |
| Modal (`1229:16497`) | `Modal` | Has bottom bar → `showBottomBar`. **Replace content + modalContent SLOT duplicate each other.** **Has scroll bar** is dropped. Figma has no `showHeader` / `headerSize`. |
| Rich text editor (`409:7293`) | `RichTextEditor` | Show attachments → `attachments` array. **Show toolbar** has no code prop. The Toolbar (`409:7273`) and Floating menu (`8820:61532`) sub-sets have no code export. |
| Data list cell / Editable (`2311:43294`) | `DataListCell` | Code has no editable mode, so the template emits the same as Info. Add a `mode`/`editable` prop, or merge the sets. |
| Bulk actions (`8922:15948`), Bulk actions alt (`8984:80601`) | `BulkActionBar` | No Figma props. **"alt" has no code variant.** |
| Pagination (`609:16611`) | `Pagination` | No Figma props. Emit an example with `page`/`totalPages`. |
| Split button (`5772:189085`) | `SplitButton` | Only Size is exposed. **Code `variant` (primary/secondary), `disabled`, `loading` are missing in Figma.** |
| Breadcrumbs / Small (`1393:46853`), Large (`4097:184354`) | `Breadcrumbs size="sm"/"lg"` | Build `items` from the child Breadcrumb item instances (§0.5). |

## 3. Real mismatches 🔴 (fix before connecting)

| # | Figma set | Code | Problem | Suggested fix |
|---|---|---|---|---|
| 1 | **Avatar** (`111:5684`) | `Avatar` | Figma Size has **Medium**, code `AvatarSize` has no `md` (`xxs/xs/sm/lg/xl/xxl`). Size=Medium would emit an invalid value. `icon` is LucideIcon (§0.4). | Add `md` to code (it also exists in `FileThumbnail` sizes), or remove Medium from Figma. |
| 2 | **Avatar group** (`3058:116174`) | `AvatarGroup` | Figma Label / Show label / Show button have **no code props**. Code `avatars[]`/`maxVisible` aren't in Figma. | Add `label`/`showLabel`/an overflow button to code, or remove them from Figma. |
| 3 | **Badge** (`642:18316`) | `Badge` | Size **Standard** vs code `sm`. Figma `Label` is TEXT but code takes `count: number`. Code has an `inverted` variant that Figma lacks. | Rename the Figma Size to Small (or code to `standard`). Add an Inverted variant to Figma. |
| 4 | **Tag** (`184:9584`) | `Tag` | Figma has separate **Show leading/trailing icon** plus **Leading/Trailing icon**, code has a single `showIcon` and `iconLeft/iconRight` (LucideIcon). **Disclosure** has no code prop. Code `size` (sm/md) isn't in Figma. | Rename the code props to `leadingIcon/trailingIcon` + `showLeadingIcon/showTrailingIcon` (matching Button/Chip). Add `disclosure` to code or remove it from Figma. Add Size to Figma. |
| 5 | **Chip** (`1544:19006`) | `Chip` | **Show label**, **Show avatar** have no code prop. Icons are LucideIcon. | Add `showLabel`/`avatarProps` to code, or remove them from Figma. |
| 6 | **Switcher** (`204:18242`) | `Switcher` | Figma has **Label, Show label, Show icon, Icon**, code is a bare toggle (`checked/disabled/size`). Selected → `checked` is fine. | Add `label`/`icon` to code, or strip them from the Figma set (the labelled form already lives in MenuCell `variant="switcher"`). |
| 7 | **Button / Toggle button** (`8412:66648`) | `ToggleButton` | Figma has **Label / Show label**, code is icon-only and takes **no children**. Code has a **`variant`** (primary/secondary/ghost) that Figma lacks. Figma calls it `Leading icon`, code calls it `icon`. | Decide whether toggle buttons can carry text. Add Variant to Figma. |
| 8 | **Input / Password** (`8572:18974`) | `PasswordInput` | **Leading icon** has no code prop (code has no `leadingIcon`). **Show password requirements**, **Show clear button**, **Show actions** and State **Revealed** have no code equivalent. | Add `leadingIcon` and `showRequirements` to code, or trim the Figma set. |
| 9 | **Input / Number input** (`1613:49241`) | `NumberInput` | **Icon / Show icon** has no code prop. | Add `leadingIcon` to `NumberInput`. |
| 10 | **Input / Phone number** (`487:38022`) | `PhoneInput` | **Trailing icon**, **Show clear button**, **Show right button** have no code prop. | Trim Figma or extend code. |
| 11 | **Input / Slider** (`8515:43196`) | — | Field wrapper (Show label/help) but **no `SliderField`**, and `Slider` has no `label`/`helperText`. | Add a `SliderField` molecule, or add field props to `Slider`. |
| 12 | **Toast / Rich toast** (`2911:73678`) | `Toast variant="rich"` | **Content** (INSTANCE_SWAP) and **Show header** have **no code prop**. Toast has no `content`/`children`. | Add `content: ReactNode` to Toast (Callout already has it). |
| 13 | **Choice list** (`8572:15962`) | `ChoiceList` | Figma **Variant** Default/Switchers/Checkbox/Radio has **no code prop**. Code takes `sections[]`, Figma has an `itemStack` SLOT. | Add `variant` (or `selectionType`) to code. Build `sections` from the slot children. |
| 14 | **Tab / Navigation tab** (`132:8663`), **Tab / Custom view tab** (`132:7427`) | `TabNav`, `Tab`, `CustomViewTab` | Item-level Figma components vs array-prop containers (§0.5). There's no container set in Figma (only `Template / Navigation tabs bar`, `Template / Filter tabs bar` on the 📝 Templates page). | Publish container sets, or export item components in code. |
| 15 | **Segment control** (`242:8752`) + **Segment control selector** (`236:8414`) | `SegmentControl` | Same issue. Selector items have icons/labels but code `options[]`. | Connect the container and build `options` from children. |
| 16 | **Breadcrumb item** (`4095:182336`) | — | No code component (it's an `items[]` entry). | Connect it as a non-nestable helper that only contributes `metadata.props`. |
| 17 | **Carousel** (`9650:333831`) | `Carousel` | **Position** First/Middle/Last ≠ numeric `index`. Code `ratio` isn't in Figma. *Unpublished.* | Add Ratio to Figma. Map Position → `defaultIndex` 0 / 1 / n−1 as an example. |
| 18 | **Aspect ratio** (`9647:51145`) | `AspectRatio` | Values all match, but code `fit` isn't in Figma and the set is **unpublished**. | Publish it, optionally adding Fit. |
| 19 | **Prompt input** (`9180:10128`) | `PromptInput` | The only property is `State = Default / Variant2`, which is placeholder naming. | Rename it to meaningful states (e.g. Empty/Typing/With attachments) or delete the property. |

## 4. No counterpart ⚪

**Figma only:** Scrollbar (`2357:37127`) and Text Block (`8421:84479`). Neither has a code component, so either add them to code or mark them as design-only.

**Code only (no published Figma set):** `Fieldset`, `Form`, `Command*` (8 parts), `CalendarView`, `MediaViewer` (the hidden `.player`/`File view *` parts exist), `NotificationCenter`, `AppShell` (there's an *App shell* page but no component set), `DataTable` (only `Template / Table template` on 📝 Templates), `FileThumbnail`, `ChartCard`, and all charts except Bar/Line/Donut. The 📈 DataViz sets `Chart / Bar chart`, `Line chart` and `Donut` exist with **no properties**, so map them to `BarChart`/`LineChart`/`DonutChart` with static `data`.

## 5. Value maps worth keeping (for the templates)

```text
Avatar Size      xxSmall→xxs xSmall→xs Small→sm Medium→(missing) Large→lg xLarge→xl xxLarge→xxl
Badge Size       Standard→sm Dot→dot
Spinner Size     Small→sm Large→lg xLarge→xl xxLarge→xxl
Drawer Variant   Overlay→overlay "Stack with content"→stacked
OTP State        Empty→idle "Partially filled"→idle Verifying→verifying Correct→correct Error→error
Slider Type      "Max value"→single Range→range
DataListCell     "With title"→with-title "Just icon"→just-icon
Card Variant     "Header and bottom bar"→{showHeader,showBottomBar} "Just header"→{showHeader} "Just bottom bar"→{showBottomBar} "Just content"→{}
Table cell Field type
  String→string  Main→main  Icon→icon  "Text field (single line)"→text  "Text field (long text)"→long-text
  Email→email  "Phone number"→phone  Address→address  Contact→contact  "Date and time"→datetime
  Date→date  "Month and year"→month-year  Number→number  Range→range  "Single choice"→single-choice
  "Multi choice"→multi-choice  "Single user or team"→single-user  "Multiple users or teams"→multi-user
  URL→url  "URL read-only"→url-readonly  Boolean→boolean  Buttons→buttons  "Tags single choice"→tags-single
  "Tags multi choice"→tags-multi  "Tags read-only"→tags-readonly  "File (single)"→file
  "Checkbox (row selection)"→checkbox  "Contacts (table)"→contacts  "Contacts (description list)"→contacts-list
  Empty→empty  Expand→expand
  (code-only: tag, user)
```

## 6. Suggested order of work

1. **Unblock:** get the Figma MCP account edit access, publish the library (including the 3 unpublished sets), then add `@figma/code-connect`, `figma.config.json` and the tsconfig types.
2. **Settle the icon contract** (§0.4). It touches every template with an icon.
3. **Write templates for the ✅ list.** That's ~30 sets, about a third of the library, with no code changes.
4. **Fix the 🔴 list.** Most of them are small prop additions in code (Avatar `md`, NumberInput/PasswordInput `leadingIcon`, Toast `content`, ChoiceList `variant`, Tag prop rename) or Figma clean-ups (EmptyState/PromptInput junk variants, the Header cell sort VARIANT, the duplicate SLOT + INSTANCE_SWAP on Modal/Popover).
5. **Decide on collections** (§0.5): Tabs, Segment control, Breadcrumbs, Choice list.

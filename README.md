# @elrayes/dual-listbox

A zero-dependency (vanilla JS) dual-list box with grouping, search, select-all (with indeterminate state), and theming (Bootstrap 5.2 default, Tailwind optional), with TypeScript types.

## Installation

```bash
npm install @elrayes/dual-listbox
```

## Usage (ES Modules)

```ts
import { DualListBox, useTheme, tailwindTheme } from '@elrayes/dual-listbox';
import '@elrayes/dual-listbox/styles/core.css';
import '@elrayes/dual-listbox/themes/bootstrap.css'; // or themes/tailwind.css

useTheme(tailwindTheme); // sets the global default theme for all new instances
// DualListBox.setTheme(tailwindTheme); // back-compat alias for useTheme()

const items = [
  { item: 'Apple', value: 1, group: 'Fruits' },
  { item: 'Tomato', value: 2, group: 'Vegetables' },
];

const dlb = new DualListBox('#dual-listbox-container', {
  dataArray: items,
  selectedItems: [],
  onSubmit: (selected, unselected, all, selectedArray) => {
    console.log(selectedArray);
  },
});

const selectedItems = dlb.getSelectedItems();
const unselectedItems = dlb.getUnselectedItems();
const allItems = dlb.getAllItems();
```

## Usage (CommonJS)

```js
const { DualListBox } = require('@elrayes/dual-listbox');
require('@elrayes/dual-listbox/styles/core.css');
require('@elrayes/dual-listbox/themes/bootstrap.css');

const dlb = new DualListBox('#dual-listbox-container', { /* options */ });
```

## Options (TypeScript)

```ts
export interface DualListBoxOptions {
  itemName?: string;              // property holding an item's label, default "item"
  groupName?: string;             // property holding an item's group, default "group"
  valueName?: string;             // property holding an item's unique value, default "value"
  inputName?: string;             // hidden-input name for form submission, default "selectedItems"
  tabNameText?: string;           // left pane header, default "Available Items"
  rightTabNameText?: string;      // right pane header, default "Selected Items"
  searchPlaceholderText?: string; // default "Search..."
  includeButtonText?: string;     // default "Include >>"
  excludeButtonText?: string;     // default "<< Exclude"
  dataArray?: any[];              // all available items
  selectedItems?: any[];          // items preselected into the right pane (subset of dataArray)
  hideEmptyGroups?: boolean;      // default false
  submitForm?: boolean;           // append hidden inputs on submit, default true (ignored if onSubmit is set)
  onSubmit?: (selected, unselected, allItems, selectedArray) => void | null;
  theme?: Partial<DualListBoxTheme>;
}
```

`dataArray` items can carry any extra properties beyond `item`/`group`/`value` (e.g. an `id`, `description`, or `metadata` field) — they pass through untouched and are returned as-is from `getSelectedItems()`/`getUnselectedItems()`/`getAllItems()`.

## Select-all and indeterminate state

Both the per-group checkbox and each pane's "Select All" checkbox reflect the
real state of their descendants, not just checked/unchecked:

- **Unchecked** — none of the covered items are selected.
- **Checked** — all of the covered items are selected.
- **Indeterminate** (the native `input.indeterminate` DOM property, rendered
  as a dash `▬` by the browser) — *some but not all* covered items are
  selected.

This updates live as items are checked, moved between panes, or filtered by
search — no configuration needed.

## Theming

- Built-in theme maps every part of the widget (container, card, buttons, checkboxes, …) to a CSS class string.
- Presets: Bootstrap 5.2 (`defaultTheme`, aliased as `bootstrapTheme`) and Tailwind (`tailwindTheme`, with `dark:` variants).
- Theme resolution order per instance: `options.theme` (partial overrides) > global theme set via `useTheme()` > `defaultTheme`.

### Global (shared) theme state

`useTheme()` sets **module-level shared state** — every `DualListBox` constructed *after* the call picks it up automatically, without passing `theme` to each instance:

```ts
import { DualListBox, useTheme } from '@elrayes/dual-listbox';
import { tailwindTheme } from '@elrayes/dual-listbox';

useTheme(tailwindTheme); // shared across every instance created from here on

new DualListBox('#el-1'); // uses the Tailwind theme
new DualListBox('#el-2'); // also uses the Tailwind theme
```

Things worth knowing about this shared state:

- **It only affects instances created after the call.** Instances already rendered keep the theme they were built with — `useTheme()` does not retroactively re-theme them.
- **It's per module instance, not a page-wide global.** If your bundler ever ships two separate copies of this package (e.g. two independently-chunked entry points that don't share a module graph), each copy has its own `GLOBAL_THEME` — a `useTheme()` call in one is invisible to the other. This is rare in a typical single-bundle app/Vite build.
- **Per-instance `theme` always wins**, regardless of what `useTheme()` set:

```ts
new DualListBox('#el', {
  theme: {
    btn: 'my-btn my-btn--primary', // overrides just this class, for this instance
  },
});
```

- `DualListBox.setTheme(theme)` is kept as a back-compat alias for `useTheme(theme)`.

Alternatively, skip the theme system entirely and target `.dual-listbox` with your own stylesheet.

## Multiple instances on one page

Every instance gets its own random `instanceId`, and every element `id`/`for`
pair it renders (container, search inputs, group checkboxes, item checkboxes)
is namespaced with that ID. You can safely mount several `DualListBox`
instances on the same page — including with identical `dataArray` — without
`id` collisions breaking label-to-checkbox association.

## Security

Item labels, group names, and values are HTML-escaped before being inserted
into the DOM. `dataArray`/`selectedItems` can safely contain user-generated
content (e.g. names loaded from a database) without risking markup/script
injection into the page.

## Laravel + Vite Integration

1. Place the container in your Blade:

```html
<div id="dual-listbox-container"></div>
```

2. Import and initialize in your app JS that Vite builds.
3. Include `core.css` and choose a theme stylesheet.

## API

- `new DualListBox(element, options)`
- `getSelectedValues(): Promise<(string|number)[]>` (legacy values API)
- Getters: `selected`, `unselected`, `allItems`, `selectedArray`
- Flat, de-duplicated item arrays:
  - `getSelectedItems(): DualListBoxItem[]`
  - `getUnselectedItems(): DualListBoxItem[]`
  - `getAllItems(): DualListBoxItem[]`
- `getSettings()` — the fully-resolved settings (defaults + options + merged theme) for this instance.
- `useTheme(theme)` / `DualListBox.setTheme(theme)` — set the shared global theme (see [Global (shared) theme state](#global-shared-theme-state)).

## Testing

```bash
npm test        # run once
npm run test:watch
npm run coverage
```

Tests cover: button enable/disable, form submission (`onSubmit` and hidden-input fallback), `hideEmptyGroups`, search filtering, global theming, select-all/group-checkbox indeterminate state, multi-instance ID isolation, and HTML escaping of user-supplied data.

## License
MIT

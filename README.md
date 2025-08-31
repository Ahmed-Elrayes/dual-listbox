# @elrayes/dual-listbox

A zero-dependency (vanilla JS) dual-list box with grouping, search, select-all, and theming (Bootstrap 5.2 default, Tailwind optional) with TypeScript types.

## Installation

- As part of this repo (local): the package resides under `resources/js/dual-listbox`.
- As an NPM package: publish this folder or npm link.

```bash
# inside resources/js/dual-listbox
npm install
npm run build
```


## Usage (ES Modules)

```ts
import { DualListBox, useTheme, tailwindTheme} from '@elrayes/dual-listbox';
import { tailwindTheme } from '@elrayes/dual-listbox';
useTheme(tailwindTheme); // sets global default for all new instances 
DualListBox.setTheme(tailwindTheme); // alias for useTheme()
import '@elrayes/dual-listbox/styles/core.css';
import '@elrayes/dual-listbox/themes/bootstrap.css'; // or tailwind.css

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

// New methods (no duplicates)
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
  itemName?: string; // default "item"
  groupName?: string; // default "group"
  valueName?: string; // default "value"
  inputName?: string; // form input name for hidden fields
  tabNameText?: string;
  rightTabNameText?: string;
  searchPlaceholderText?: string;
  includeButtonText?: string;
  excludeButtonText?: string;
  dataArray?: any[];
  selectedItems?: any[];
  hideEmptyGroups?: boolean;
  submitForm?: boolean;
  onSubmit?: (selected, unselected, allItems, selectedArray) => void | null;
  theme?: Partial<DualListBoxTheme>;
}
```

## Theming

- Built-in theme maps classes to your CSS framework.
- Presets: Bootstrap 5.2 (defaultTheme) and Tailwind (tailwindTheme).
- You can set a global default for all new instances using `useTheme`:

```ts
import { DualListBox, useTheme } from '@elrayes/dual-listbox';
import { tailwindTheme } from '@elrayes/dual-listbox/dist/themePresets';

useTheme(tailwindTheme); // applies to all new DualListBox instances

new DualListBox('#el'); // uses the global Tailwind theme
```

- Or provide a custom theme per instance (an instance option has priority over global):

```ts
new DualListBox('#el', {
  theme: {
    // override any class strings
    btn: 'my-btn my-btn--primary',
  }
});
```

Note: For backward compatibility, `DualListBox.setTheme(tailwindTheme)` is still available and is an alias to `useTheme(tailwindTheme)`.

Alternatively, rely on CSS variables and write a stylesheet that targets `.dual-listbox`.

## Laravel + Vite Integration

1. Place the container in your Blade:

```html
<div id="dual-listbox-container"></div>
```

2. Import and initialize in your app JS that Vite builds.

3. Include core.css and choose a theme stylesheet.

## API

- `new DualListBox(element, options)`
- `getSelectedValues(): Promise<(string|number)[]>` (legacy values API)
- Getters: `selected`, `unselected`, `allItems`, `selectedArray`
- New methods (return item objects without duplicates):
  - `getSelectedItems()`
  - `getUnselectedItems()`
  - `getAllItems()`

## License
MIT

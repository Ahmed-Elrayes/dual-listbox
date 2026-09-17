
/** A single list item. Property names are configurable via `itemName`/`groupName`/`valueName`. */
export type DualListBoxItem = Record<string, any> & {
  [key: string]: any;
};

/**
 * Called on form submit instead of the default hidden-input behavior when
 * `onSubmit` is provided; receives every view of the current selection.
 *
 * @param selected Selected items grouped by group name.
 * @param unselected Unselected items grouped by group name.
 * @param allItems The full original `dataArray`.
 * @param selectedArray Selected items' values only, in `dataArray` order.
 */
export type OnSubmitHandler = (
  selected: Record<string, DualListBoxItem[]>,
  unselected: Record<string, DualListBoxItem[]>,
  allItems: DualListBoxItem[],
  selectedArray: (string | number)[]
) => void;

/**
 * Maps each semantic part of the widget to a CSS class string, so any CSS
 * framework (Bootstrap, Tailwind, or a custom design system) can be plugged
 * in without touching the rendering logic. See {@link defaultTheme} and
 * `tailwindTheme` in `themePresets.ts` for the built-in presets.
 */
export interface DualListBoxTheme {
  container: string;
  row: string;
  colLeft: string;
  colCenter: string;
  colRight: string;
  card: string;
  cardHeader: string;
  cardBody: string;
  cardFooter: string;
  searchInput: string;
  listGroup: string;
  listItem: string;
  formCheck: string;
  formCheckInput: string;
  formCheckLabel: string;
  btn: string;
  btnInclude: string;
  btnExclude: string;
}

/** Constructor options for {@link DualListBox}. */
export interface DualListBoxOptions {
  /** Property on each item holding its display label. @default "item" */
  itemName?: string;
  /** Property on each item holding its group name. @default "group" */
  groupName?: string;
  /** Property on each item holding its unique value. @default "value" */
  valueName?: string;
  /** Base `name` for the hidden `<input type="hidden" name="{inputName}[]">` fields appended on submit. @default "selectedItems" */
  inputName?: string;
  /** Left ("available") pane header text. */
  tabNameText?: string;
  /** Right ("selected") pane header text. */
  rightTabNameText?: string;
  /** Placeholder for both search inputs. */
  searchPlaceholderText?: string;
  /** Label for the button moving checked items left → right. */
  includeButtonText?: string;
  /** Label for the button moving checked items right → left. */
  excludeButtonText?: string;
  /** All available items, each shaped per `itemName`/`groupName`/`valueName`. */
  dataArray?: DualListBoxItem[];
  /** Items preselected into the right pane on init; must be a subset of `dataArray`. */
  selectedItems?: DualListBoxItem[];
  /** Hide a group entirely from the available pane once all its items are selected. @default false */
  hideEmptyGroups?: boolean;
  /** Append hidden inputs with the selection on form submit. Ignored if `onSubmit` is set. @default true */
  submitForm?: boolean;
  /** If set, called on submit instead of the default hidden-input behavior; the caller owns `preventDefault()`/submission. @default null */
  onSubmit?: OnSubmitHandler | null;
  /** Per-instance theme overrides; takes priority over the global theme set via `useTheme()`. */
  theme?: Partial<DualListBoxTheme>;
}

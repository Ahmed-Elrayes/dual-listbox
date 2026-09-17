/** A single list item. Property names are configurable via `itemName`/`groupName`/`valueName`. */
type DualListBoxItem = Record<string, any> & {
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
type OnSubmitHandler = (selected: Record<string, DualListBoxItem[]>, unselected: Record<string, DualListBoxItem[]>, allItems: DualListBoxItem[], selectedArray: (string | number)[]) => void;
/**
 * Maps each semantic part of the widget to a CSS class string, so any CSS
 * framework (Bootstrap, Tailwind, or a custom design system) can be plugged
 * in without touching the rendering logic. See {@link defaultTheme} and
 * `tailwindTheme` in `themePresets.ts` for the built-in presets.
 */
interface DualListBoxTheme {
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
interface DualListBoxOptions {
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

/**
 * Sets the global default theme used by every `DualListBox` constructed
 * afterwards. Per-instance `options.theme` always takes priority over this.
 *
 * @param theme A full theme or a partial set of overrides merged onto {@link defaultTheme}.
 */
declare function useTheme(theme: Partial<DualListBoxTheme> | DualListBoxTheme): void;

/** A dependency-free dual list box: two panes with grouping, indeterminate select-all, search, and form submission. */
declare class DualListBox {
    private rootEl;
    private formEl;
    private instanceId;
    private originalData;
    private defaults;
    private settings;
    private groups;
    private selectedGroups;
    /**
     * @param element CSS selector or root element to render into.
     * @param options Data, labels, behavior flags, and theme overrides — see {@link DualListBoxOptions}.
     * @throws {Error} If `element` is a selector that matches nothing.
     */
    constructor(element: Element | string, options?: DualListBoxOptions);
    /** Random ID namespacing this instance's element/checkbox `id`s so multiple instances can coexist on one page. */
    private generateInstanceId;
    /** Sorts every group in both panes to match `originalData` order. */
    private sortAllGroups;
    /** Sorts one group's items in place to match their position in `originalData`. */
    private sortGroup;
    /** Buckets a flat item array into `{ groupName: items[] }`, defaulting ungrouped items to `"Ungrouped"`. */
    private buildGroups;
    /** Removes items from the "available" pane already present in `selectedItems`, so they don't render twice. */
    private removeDuplicatesFromLeft;
    /** Renders the full widget markup and refreshes select-all/indeterminate states. */
    private render;
    /** Builds one pane's grouped `<ul>` markup; `id`/`for` are namespaced with `instanceId` and values are HTML-escaped. */
    private generateGroupedListHTML;
    /**
     * Refreshes one pane's select-all checkbox (checked/indeterminate/disabled),
     * its "selected/total" counter, each group's own select-all checkbox, and
     * the include/exclude button disabled states.
     *
     * @param side Which pane to refresh.
     */
    private updateSelectAllInfo;
    /** Sets each group's select-all checkbox to checked/indeterminate/unchecked based on its `.item-select` children. */
    private updateGroupCheckboxStates;
    /** Wires up click/change/input delegation once for the widget's lifetime. */
    private bindEvents;
    /** Moves every checked item from one pane's data model to the other and re-renders; de-dupes and keeps groups sorted. */
    private moveItems;
    /** Checks or unchecks every group and item checkbox in one pane. */
    private toggleSelectAll;
    /** Filters one pane's visible groups/items by a case-insensitive substring match on group/item label text. */
    private searchItems;
    /** Replaces any previously appended hidden inputs with one `<input type="hidden" name="{inputName}[]">` per selected value. */
    private appendSelectedGroupsOnSubmit;
    /** @returns The selected items' values, kept for backward compatibility with the original callback-era API. */
    getSelectedValues(): Promise<(string | number)[]>;
    /** Selected items grouped by group name. */
    get selected(): Record<string, DualListBoxItem[]>;
    /** Selected items' values (`settings.valueName`), in `dataArray` order. */
    get selectedArray(): (string | number)[];
    /** Unselected ("available") items grouped by group name. */
    get unselected(): Record<string, DualListBoxItem[]>;
    /** The full, original `dataArray` passed in via options. */
    get allItems(): DualListBoxItem[];
    /** @returns Selected items as a flat, de-duplicated array of the original item objects. */
    getSelectedItems(): DualListBoxItem[];
    /** @returns Unselected items as a flat, de-duplicated array of the original item objects. */
    getUnselectedItems(): DualListBoxItem[];
    /** @returns A shallow copy of every item originally passed in via `dataArray`. */
    getAllItems(): DualListBoxItem[];
    /** @returns The fully-resolved settings (defaults + options + merged theme) for this instance. */
    getSettings(): Required<DualListBoxOptions> & {
        theme: DualListBoxTheme;
    };
}
/** Convenience factory equivalent to `new DualListBox(selector, options)`. */
declare function initDualListBox(selector: string | Element, options?: DualListBoxOptions): DualListBox;

/** Bootstrap 5.2 theme; also the built-in default used when no theme is supplied. */
declare const defaultTheme: DualListBoxTheme;
/** Alias of {@link defaultTheme}, kept as an explicit named export for clarity at call sites. */
declare const bootstrapTheme: DualListBoxTheme;
/** Tailwind CSS theme, with `dark:` variants for dark mode. */
declare const tailwindTheme: DualListBoxTheme;

export { DualListBox, type DualListBoxItem, type DualListBoxOptions, type DualListBoxTheme, bootstrapTheme, defaultTheme, initDualListBox, tailwindTheme, useTheme };

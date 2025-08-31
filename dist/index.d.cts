type DualListBoxItem = Record<string, any> & {
    [key: string]: any;
};
type OnSubmitHandler = (selected: Record<string, DualListBoxItem[]>, unselected: Record<string, DualListBoxItem[]>, allItems: DualListBoxItem[], selectedArray: (string | number)[]) => void;
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
interface DualListBoxOptions {
    itemName?: string;
    groupName?: string;
    valueName?: string;
    inputName?: string;
    tabNameText?: string;
    rightTabNameText?: string;
    searchPlaceholderText?: string;
    includeButtonText?: string;
    excludeButtonText?: string;
    dataArray?: DualListBoxItem[];
    selectedItems?: DualListBoxItem[];
    hideEmptyGroups?: boolean;
    submitForm?: boolean;
    onSubmit?: OnSubmitHandler | null;
    theme?: Partial<DualListBoxTheme>;
}

/**
 * Set the global default theme for all new DualListBox instances.
 * Instance option `theme` still has highest priority.
 */
declare function useTheme(theme: Partial<DualListBoxTheme> | DualListBoxTheme): void;
declare class DualListBox {
    private rootEl;
    private formEl;
    private instanceId;
    private defaults;
    private settings;
    private groups;
    private selectedGroups;
    constructor(element: Element | string, options?: DualListBoxOptions);
    private generateInstanceId;
    private buildGroups;
    private removeDuplicatesFromLeft;
    private render;
    private generateGroupedListHTML;
    private updateSelectAllInfo;
    private bindEvents;
    private moveItems;
    private toggleSelectAll;
    private searchItems;
    private appendSelectedGroupsOnSubmit;
    getSelectedValues(): Promise<(string | number)[]>;
    get selected(): Record<string, DualListBoxItem[]>;
    get selectedArray(): (string | number)[];
    get unselected(): Record<string, DualListBoxItem[]>;
    get allItems(): DualListBoxItem[];
    getSelectedItems(): DualListBoxItem[];
    getUnselectedItems(): DualListBoxItem[];
    getAllItems(): DualListBoxItem[];
}
declare function initDualListBox(selector: string | Element, options?: DualListBoxOptions): DualListBox;

declare const defaultTheme: DualListBoxTheme;
declare const bootstrapTheme: DualListBoxTheme;
declare const tailwindTheme: DualListBoxTheme;

export { DualListBox, type DualListBoxItem, type DualListBoxOptions, type DualListBoxTheme, bootstrapTheme, defaultTheme, initDualListBox, tailwindTheme, useTheme };

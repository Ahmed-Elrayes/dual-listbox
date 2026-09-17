import type {DualListBoxItem, DualListBoxOptions, DualListBoxTheme} from './types';
import {defaultTheme} from './themePresets';
import {mergeTheme, useTheme, getGlobalTheme} from './theme';
import {escapeHtml} from './html';

export {useTheme} from './theme';

/** A dependency-free dual list box: two panes with grouping, indeterminate select-all, search, and form submission. */
export class DualListBox {
    private rootEl: Element;
    private formEl: HTMLFormElement | null;

    private instanceId: string;
    private originalData: DualListBoxItem[];

    private defaults: Required<Omit<DualListBoxOptions, 'theme'>> & { theme: DualListBoxTheme };
    private settings: Required<DualListBoxOptions> & { theme: DualListBoxTheme };

    private groups: Record<string, DualListBoxItem[]> = {};
    private selectedGroups: Record<string, DualListBoxItem[]> = {};

    /**
     * @param element CSS selector or root element to render into.
     * @param options Data, labels, behavior flags, and theme overrides — see {@link DualListBoxOptions}.
     * @throws {Error} If `element` is a selector that matches nothing.
     */
    constructor(element: Element | string, options: DualListBoxOptions = {}) {
        this.rootEl = typeof element === 'string' ? (document.querySelector(element) as Element) : (element as Element);
        if (!this.rootEl) throw new Error('DualListBox root element not found');
        this.formEl = (this.rootEl.closest('form') as HTMLFormElement) || null;
        this.instanceId = this.generateInstanceId();
        this.defaults = {
            itemName: 'item',
            groupName: 'group',
            valueName: 'value',
            inputName: 'selectedItems',
            tabNameText: 'Available Items',
            rightTabNameText: 'Selected Items',
            searchPlaceholderText: 'Search...',
            includeButtonText: 'Include >>',
            excludeButtonText: '<< Exclude',
            dataArray: [],
            selectedItems: [],
            hideEmptyGroups: false,
            submitForm: true,
            onSubmit: null,
            theme: defaultTheme,
        } as any;

        // Effective theme precedence: options.theme > global theme (useTheme) > defaultTheme
        const theme = mergeTheme(getGlobalTheme(), options.theme);
        this.settings = {...(this.defaults as any), ...(options as any), theme};

        this.originalData = [...this.settings.dataArray];
        this.groups = this.buildGroups(this.settings.dataArray);
        this.selectedGroups = this.buildGroups(this.settings.selectedItems);

        // Sort initial groups based on originalData order
        this.sortAllGroups();

        this.removeDuplicatesFromLeft();
        this.render();
        this.bindEvents();

        if (this.formEl) {
            this.formEl.addEventListener('submit', (event) => {
                if (typeof this.settings.onSubmit === 'function') {
                    event.preventDefault();
                    this.settings.onSubmit(this.selected, this.unselected, this.allItems, this.selectedArray);
                } else if (this.settings.submitForm) {
                    this.appendSelectedGroupsOnSubmit();
                }
            });
        }
    }

    /** Random ID namespacing this instance's element/checkbox `id`s so multiple instances can coexist on one page. */
    private generateInstanceId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 36; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    /** Sorts every group in both panes to match `originalData` order. */
    private sortAllGroups() {
        [this.groups, this.selectedGroups].forEach((groupSet) => {
            Object.keys(groupSet).forEach((groupName) => {
                this.sortGroup(groupSet[groupName]);
            });
        });
    }

    /** Sorts one group's items in place to match their position in `originalData`. */
    private sortGroup(group: DualListBoxItem[]) {
        group.sort((a, b) => {
            const valA = String((a as any)[this.settings.valueName]);
            const valB = String((b as any)[this.settings.valueName]);
            const indexA = this.originalData.findIndex(
                (item) => String((item as any)[this.settings.valueName]) === valA
            );
            const indexB = this.originalData.findIndex(
                (item) => String((item as any)[this.settings.valueName]) === valB
            );
            return indexA - indexB;
        });
    }

    /** Buckets a flat item array into `{ groupName: items[] }`, defaulting ungrouped items to `"Ungrouped"`. */
    private buildGroups(dataArray: DualListBoxItem[]) {
        const groups: Record<string, DualListBoxItem[]> = {};
        dataArray.forEach((item) => {
            const group = (item as any)[this.settings.groupName] || 'Ungrouped';
            if (!groups[group]) groups[group] = [];
            groups[group].push(item);
        });
        return groups;
    }

    /** Removes items from the "available" pane already present in `selectedItems`, so they don't render twice. */
    private removeDuplicatesFromLeft() {
        Object.keys(this.selectedGroups).forEach((group) => {
            if (this.groups[group]) {
                this.selectedGroups[group].forEach((selectedItem) => {
                    this.groups[group] = this.groups[group].filter(
                        (item) => String((item as any)[this.settings.valueName]) !== String((selectedItem as any)[this.settings.valueName])
                    );
                });
                if (this.settings.hideEmptyGroups) {
                    if (!this.groups[group].length) {
                        delete this.groups[group];
                    }
                }
            }
        });
    }

    /** Renders the full widget markup and refreshes select-all/indeterminate states. */
    private render() {
        const t = this.settings.theme;
        const template = `
      <div class="${t.container}" id="dual_listbox_${this.instanceId}">
        <div class="${t.row}">
          <div class="${t.colLeft}" id="dual_listbox_${this.instanceId}_left_side">
            <div class="${t.card}">
              <div class="${t.cardHeader}">${escapeHtml(this.settings.tabNameText)}</div>
              <div class="${t.cardBody}">
                <input id="dual_listbox_${this.instanceId}_left_search" type="text" class="${t.searchInput} dual-listbox-search" data-side="left" placeholder="${escapeHtml(this.settings.searchPlaceholderText)}">
                <div class="dual-listbox-content">
                  ${this.generateGroupedListHTML('left')}
                </div>
              </div>
              <div class="${t.cardFooter}">
                <input type="checkbox" class="${t.formCheckInput} dual-listbox-select-all-left" disabled>
                <label class="${t.formCheckLabel}">Select All (<span class="dual-listbox-left-selected">0</span>/<span class="dual-listbox-left-total">0</span>)</label>
              </div>
            </div>
          </div>
          <div class="${t.colCenter}">
            <button type="button" class="${t.btn} dual-listbox-include ${t.btnInclude}" disabled>${escapeHtml(this.settings.includeButtonText)}</button>
            <button type="button" class="${t.btn} dual-listbox-exclude ${t.btnExclude}" disabled>${escapeHtml(this.settings.excludeButtonText)}</button>
          </div>
          <div class="${t.colRight}" id="dual_listbox_${this.instanceId}_right_side">
            <div class="${t.card}">
              <div class="${t.cardHeader}">${escapeHtml(this.settings.rightTabNameText)}</div>
              <div class="${t.cardBody}">
                <input id="dual_listbox_${this.instanceId}_right_search" type="text" class="${t.searchInput} dual-listbox-search" data-side="right" placeholder="${escapeHtml(this.settings.searchPlaceholderText)}">
                <div class="dual-listbox-content">
                  ${this.generateGroupedListHTML('right')}
                </div>
              </div>
              <div class="${t.cardFooter}">
                <input type="checkbox" class="${t.formCheckInput} dual-listbox-select-all-right" disabled>
                <label class="${t.formCheckLabel}">Select All (<span class="dual-listbox-right-selected">0</span>/<span class="dual-listbox-right-total">0</span>)</label>
              </div>
            </div>
          </div>
        </div>
      </div>`;
        this.rootEl.innerHTML = template;
        this.updateSelectAllInfo('left');
        this.updateSelectAllInfo('right');
    }

    /** Builds one pane's grouped `<ul>` markup; `id`/`for` are namespaced with `instanceId` and values are HTML-escaped. */
    private generateGroupedListHTML(side: 'left' | 'right') {
        const t = this.settings.theme;
        const groups = side === 'left' ? this.groups : this.selectedGroups;
        let html = '';
        const keys = Object.keys(groups);
        keys.forEach((groupName, index) => {
            const items = groups[groupName];
            const totalItems = items.length;
            const isGroupEmpty = totalItems === 0;
            const groupIdBase = `dual_listbox_${this.instanceId}_group_${escapeHtml(groupName)}_${side}`;
            const isLast = index === keys.length - 1;
            html += `
        <div class="dual-listbox-group${!isLast ? ' mb-3' : ''}">
          <div class="group-header mb-2">
            <div class="${t.formCheck}">
              <input id="${groupIdBase}" type="checkbox" class="${t.formCheckInput} group-select-all" ${isGroupEmpty ? 'checked disabled' : ''}>
              <label for="${groupIdBase}" class="${t.formCheckLabel}">${escapeHtml(groupName)}</label>
            </div>
          </div>`;
            if (!isGroupEmpty) {
                html += `<ul class="${t.listGroup}">`;
                items.forEach((item) => {
                    const val = (item as any)[this.settings.valueName];
                    const name = (item as any)[this.settings.itemName];
                    const itemId = `dual_listbox_${this.instanceId}_item_${escapeHtml(groupName)}_${escapeHtml(val)}_${side}`;
                    html += `
            <li class="${t.listItem}" data-value="${escapeHtml(val)}" data-group="${escapeHtml(groupName)}">
              <div class="${t.formCheck}">
                <input id="${itemId}" type="checkbox" class="${t.formCheckInput} item-select" />
                <label for="${itemId}" class="${t.formCheckLabel}">${escapeHtml(name)}</label>
              </div>
            </li>`;
                });
                html += `</ul>`;
            }
            html += `</div>`;
        });
        return html;
    }

    /**
     * Refreshes one pane's select-all checkbox (checked/indeterminate/disabled),
     * its "selected/total" counter, each group's own select-all checkbox, and
     * the include/exclude button disabled states.
     *
     * @param side Which pane to refresh.
     */
    private updateSelectAllInfo(side: 'left' | 'right') {
        const idx = side === 'left' ? 0 : 1;
        const contents = this.rootEl.querySelectorAll('.dual-listbox-content');
        const content = contents[idx] as Element;
        const selectAll = this.rootEl.querySelector<HTMLInputElement>(`.dual-listbox-select-all-${side}`);
        const totalItems = content ? content.querySelectorAll('.item-select').length : 0;
        const selectedItems = content ? content.querySelectorAll('.item-select:checked').length : 0;
        const selSpan = this.rootEl.querySelector(`.dual-listbox-${side}-selected`);
        const totalSpan = this.rootEl.querySelector(`.dual-listbox-${side}-total`);
        if (selSpan) selSpan.textContent = String(selectedItems);
        if (totalSpan) totalSpan.textContent = String(totalItems);
        if (selectAll) {
            if (totalItems === 0) {
                selectAll.disabled = true;
                selectAll.checked = true;
                selectAll.indeterminate = false;
            } else {
                selectAll.disabled = false;
                selectAll.checked = selectedItems === totalItems;
                selectAll.indeterminate = selectedItems > 0 && selectedItems < totalItems;
            }
        }

        this.updateGroupCheckboxStates(content);

        // Enable/disable include/exclude buttons based on selections
        const includeBtn = this.rootEl.querySelector<HTMLButtonElement>('.dual-listbox-include');
        const excludeBtn = this.rootEl.querySelector<HTMLButtonElement>('.dual-listbox-exclude');
        const leftContent = contents[0] as Element | undefined;
        const rightContent = contents[1] as Element | undefined;
        const leftChecked = leftContent ? leftContent.querySelectorAll('.item-select:checked').length : 0;
        const rightChecked = rightContent ? rightContent.querySelectorAll('.item-select:checked').length : 0;
        if (includeBtn) includeBtn.disabled = leftChecked === 0;
        if (excludeBtn) excludeBtn.disabled = rightChecked === 0;
    }

    /** Sets each group's select-all checkbox to checked/indeterminate/unchecked based on its `.item-select` children. */
    private updateGroupCheckboxStates(content: Element | undefined) {
        content?.querySelectorAll<HTMLElement>('.dual-listbox-group').forEach((groupEl) => {
            const groupCheckbox = groupEl.querySelector<HTMLInputElement>('.group-select-all');
            if (!groupCheckbox || groupCheckbox.disabled) return;
            const total = groupEl.querySelectorAll('.item-select').length;
            const checkedCount = groupEl.querySelectorAll('.item-select:checked').length;
            groupCheckbox.checked = total > 0 && checkedCount === total;
            groupCheckbox.indeterminate = checkedCount > 0 && checkedCount < total;
        });
    }

    /** Wires up click/change/input delegation once for the widget's lifetime. */
    private bindEvents() {
        this.rootEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.dual-listbox-include')) {
                this.moveItems('left', 'right');
            } else if (target.closest('.dual-listbox-exclude')) {
                this.moveItems('right', 'left');
            }
        });
        this.rootEl.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.matches('.dual-listbox-select-all-left')) {
                this.toggleSelectAll('left', target.checked);
            } else if (target.matches('.dual-listbox-select-all-right')) {
                this.toggleSelectAll('right', target.checked);
            } else if (target.matches('.group-select-all')) {
                const groupEl = target.closest('.dual-listbox-group') as Element;
                groupEl?.querySelectorAll<HTMLInputElement>('.item-select').forEach((inp) => (inp.checked = target.checked));
                this.updateSelectAllInfo('left');
                this.updateSelectAllInfo('right');
            } else if (target.matches('.item-select')) {
                this.updateSelectAllInfo('left');
                this.updateSelectAllInfo('right');
            }
        });
        this.rootEl.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.matches('.dual-listbox-search')) {
                const side = (target.getAttribute('data-side') as 'left' | 'right') || 'left';
                const searchTerm = target.value || '';
                this.searchItems(side, searchTerm);
            }
        });
    }

    /** Moves every checked item from one pane's data model to the other and re-renders; de-dupes and keeps groups sorted. */
    private moveItems(fromSide: 'left' | 'right', toSide: 'left' | 'right') {
        const fromGroups = fromSide === 'left' ? this.groups : this.selectedGroups;
        const toGroups = toSide === 'left' ? this.groups : this.selectedGroups;
        const contents = this.rootEl.querySelectorAll('.dual-listbox-content');
        const fromContainer = contents[fromSide === 'left' ? 0 : 1] as Element;
        const selectedLis = Array.from(fromContainer.querySelectorAll<HTMLInputElement>('.item-select:checked')).map((inp) => inp.closest('li') as HTMLLIElement);

        selectedLis.forEach((li) => {
            const value = String(li.getAttribute('data-value'));
            const group = String(li.getAttribute('data-group'));

            // Find original item to preserve all properties
            const originalItem = this.originalData.find(item => String((item as any)[this.settings.valueName]) === value);
            if (!originalItem) return;

            if (fromGroups[group]) {
                fromGroups[group] = fromGroups[group].filter((i) => String((i as any)[this.settings.valueName]) !== value);
                if (fromGroups[group].length === 0 && (this.settings.hideEmptyGroups || fromSide !== 'left')) {
                    delete (fromGroups as any)[group];
                }
            }
            if (!toGroups[group]) toGroups[group] = [];

            // Avoid duplicates
            if (!toGroups[group].some(i => String((i as any)[this.settings.valueName]) === value)) {
                toGroups[group].push(originalItem);
            }

            // Sort toGroups[group] based on originalData order
            this.sortGroup(toGroups[group]);
        });
        this.render();
    }

    /** Checks or unchecks every group and item checkbox in one pane. */
    private toggleSelectAll(side: 'left' | 'right', isChecked: boolean) {
        const contents = this.rootEl.querySelectorAll('.dual-listbox-content');
        const content = contents[side === 'left' ? 0 : 1] as Element;
        content?.querySelectorAll<HTMLInputElement>('.group-select-all').forEach((inp) => (inp.checked = isChecked));
        content?.querySelectorAll<HTMLInputElement>('.item-select').forEach((inp) => (inp.checked = isChecked));
        this.updateSelectAllInfo(side);
    }

    /** Filters one pane's visible groups/items by a case-insensitive substring match on group/item label text. */
    private searchItems(side: 'left' | 'right', searchTerm: string) {
        const contents = this.rootEl.querySelectorAll('.dual-listbox-content');
        const container = contents[side === 'left' ? 0 : 1] as HTMLElement;
        const searchText = (searchTerm || '').toLowerCase();
        container?.querySelectorAll<HTMLElement>('.dual-listbox-group').forEach((groupEl) => {
            const groupName = (groupEl.querySelector('.group-header')?.textContent || '').toLowerCase();
            const items = groupEl.querySelectorAll<HTMLElement>('li');
            let showGroup = false;
            if (groupName.includes(searchText)) {
                groupEl.style.display = '';
                items.forEach((li) => (li.style.display = ''));
                showGroup = true;
            } else {
                items.forEach((li) => {
                    const itemText = (li.querySelector('label')?.textContent || '').toLowerCase();
                    if (itemText.includes(searchText)) {
                        li.style.display = '';
                        showGroup = true;
                    } else {
                        li.style.display = 'none';
                    }
                });
                groupEl.style.display = showGroup ? '' : 'none';
            }
        });
        if (!searchText) {
            container?.querySelectorAll<HTMLElement>('.dual-listbox-group').forEach((g) => (g.style.display = ''));
            container?.querySelectorAll<HTMLElement>('li').forEach((li) => (li.style.display = ''));
        }
    }

    /** Replaces any previously appended hidden inputs with one `<input type="hidden" name="{inputName}[]">` per selected value. */
    private appendSelectedGroupsOnSubmit() {
        if (!this.formEl) {
            console.error('Parent form not found!');
            return;
        }
        const selectedValues: (string | number)[] = this.selectedArray;
        // remove existing
        Array.from(this.formEl.querySelectorAll(`input[name="${this.settings.inputName}[]"]`)).forEach((el) => el.remove());
        // append new
        selectedValues.forEach((value) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `${this.settings.inputName}[]`;
            input.value = String(value);
            this.formEl!.appendChild(input);
        });
    }

    /** @returns The selected items' values, kept for backward compatibility with the original callback-era API. */
    getSelectedValues(): Promise<(string | number)[]> {
        return new Promise((resolve) => {
            resolve(this.selectedArray);
        });
    }

    /** Selected items grouped by group name. */
    get selected() {
        return this.selectedGroups;
    }

    /** Selected items' values (`settings.valueName`), in `dataArray` order. */
    get selectedArray() {
        const selectedValues: (string | number)[] = [];
        this.originalData.forEach((item) => {
            const val = (item as any)[this.settings.valueName];
            const group = (item as any)[this.settings.groupName] || 'Ungrouped';
            if (this.selectedGroups[group]) {
                const isSelected = this.selectedGroups[group].some(
                    (i) => String((i as any)[this.settings.valueName]) === String(val)
                );
                if (isSelected) {
                    selectedValues.push(val);
                }
            }
        });
        return selectedValues;
    }

    /** Unselected ("available") items grouped by group name. */
    get unselected() {
        return this.groups;
    }

    /** The full, original `dataArray` passed in via options. */
    get allItems() {
        return this.settings.dataArray;
    }

    /** @returns Selected items as a flat, de-duplicated array of the original item objects. */
    getSelectedItems(): DualListBoxItem[] {
        const selected: DualListBoxItem[] = [];
        const values = this.selectedArray.map(String);
        this.originalData.forEach((item) => {
            if (values.includes(String((item as any)[this.settings.valueName]))) {
                selected.push(item);
            }
        });
        return selected;
    }

    /** @returns Unselected items as a flat, de-duplicated array of the original item objects. */
    getUnselectedItems(): DualListBoxItem[] {
        const unselected: DualListBoxItem[] = [];
        const selectedValues = this.selectedArray.map(String);
        this.originalData.forEach((item) => {
            if (!selectedValues.includes(String((item as any)[this.settings.valueName]))) {
                unselected.push(item);
            }
        });
        return unselected;
    }

    /** @returns A shallow copy of every item originally passed in via `dataArray`. */
    getAllItems(): DualListBoxItem[] {
        return [...this.originalData];
    }

    /** @returns The fully-resolved settings (defaults + options + merged theme) for this instance. */
    getSettings(): Required<DualListBoxOptions> & { theme: DualListBoxTheme } {
        return this.settings;
    }
}

/** Convenience factory equivalent to `new DualListBox(selector, options)`. */
export function initDualListBox(selector: string | Element, options: DualListBoxOptions = {}) {
    return new DualListBox(selector, options);
}

// Attach back-compat static setTheme to the class
// so existing code using DualListBox.setTheme(...) keeps working.
(DualListBox as any).setTheme = (theme: Partial<DualListBoxTheme> | DualListBoxTheme) => useTheme(theme);

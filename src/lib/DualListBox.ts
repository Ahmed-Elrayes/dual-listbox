import type {DualListBoxItem, DualListBoxOptions, DualListBoxTheme} from './types';
import {defaultTheme} from './themePresets';

function mergeTheme(base: DualListBoxTheme, override?: Partial<DualListBoxTheme>): DualListBoxTheme {
    return {...base, ...(override || {})} as DualListBoxTheme;
}

// Global theme state (module-level)
let GLOBAL_THEME: DualListBoxTheme = {...defaultTheme};

/**
 * Set the global default theme for all new DualListBox instances.
 * Instance option `theme` still has highest priority.
 */
export function useTheme(theme: Partial<DualListBoxTheme> | DualListBoxTheme) {
    GLOBAL_THEME = mergeTheme(defaultTheme, theme as Partial<DualListBoxTheme>);
}

// Back-compat alias for older code that might call DualListBox.setTheme(...)
// We will attach a static setTheme on the class after its definition.

export class DualListBox {
    private rootEl: Element;
    private formEl: HTMLFormElement | null;

    private instanceId: string;

    private defaults: Required<Omit<DualListBoxOptions, 'theme'>> & { theme: DualListBoxTheme };
    private settings: Required<DualListBoxOptions> & { theme: DualListBoxTheme };

    private groups: Record<string, DualListBoxItem[]> = {};
    private selectedGroups: Record<string, DualListBoxItem[]> = {};

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

        // Effective theme precedence: options.theme > GLOBAL_THEME > defaultTheme
        const themeBase = mergeTheme(defaultTheme, GLOBAL_THEME);
        const theme = mergeTheme(themeBase, options.theme);
        this.settings = {...(this.defaults as any), ...(options as any), theme};

        this.groups = this.buildGroups(this.settings.dataArray);
        this.selectedGroups = this.buildGroups(this.settings.selectedItems);

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

    private generateInstanceId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 36; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    private buildGroups(dataArray: DualListBoxItem[]) {
        const groups: Record<string, DualListBoxItem[]> = {};
        dataArray.forEach((item) => {
            const group = (item as any)[this.settings.groupName] || 'Ungrouped';
            if (!groups[group]) groups[group] = [];
            if (!groups[group].some((existing) => (existing as any)[this.settings.valueName] === (item as any)[this.settings.valueName])) {
                groups[group].push(item);
            }
        });
        return groups;
    }

    private removeDuplicatesFromLeft() {
        Object.keys(this.selectedGroups).forEach((group) => {
            if (this.groups[group]) {
                this.selectedGroups[group].forEach((selectedItem) => {
                    this.groups[group] = this.groups[group].filter(
                        (item) => (item as any)[this.settings.valueName] !== (selectedItem as any)[this.settings.valueName]
                    );
                });
                if (this.settings.hideEmptyGroups) {
                    if (!this.groups[group].length) {
                        delete this.groups[group];
                    }
                }
            }
        });
        this.render();
    }

    private render() {
        const t = this.settings.theme;
        const template = `
      <div class="${t.container}" id="dual_listbox_${this.instanceId}">
        <div class="${t.row}">
          <div class="${t.colLeft}" id="dual_listbox_${this.instanceId}_left_side">
            <div class="${t.card}">
              <div class="${t.cardHeader}">${this.settings.tabNameText}</div>
              <div class="${t.cardBody}">
                <input id="dual_listbox_${this.instanceId}_left_search" type="text" class="${t.searchInput}" data-side="left" placeholder="${this.settings.searchPlaceholderText}">
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
            <button class="${t.btn} dual-listbox-include ${t.btnInclude}" disabled>${this.settings.includeButtonText}</button>
            <button class="${t.btn} dual-listbox-exclude ${t.btnExclude}" disabled>${this.settings.excludeButtonText}</button>
          </div>
          <div class="${t.colRight}" id="dual_listbox_${this.instanceId}_right_side">
            <div class="${t.card}">
              <div class="${t.cardHeader}">${this.settings.rightTabNameText}</div>
              <div class="${t.cardBody}">
                <input id="dual_listbox_${this.instanceId}_right_search" type="text" class="${t.searchInput}" data-side="right" placeholder="${this.settings.searchPlaceholderText}">
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

    private generateGroupedListHTML(side: 'left' | 'right') {
        const t = this.settings.theme;
        const groups = side === 'left' ? this.groups : this.selectedGroups;
        let html = '';
        const keys = Object.keys(groups);
        keys.forEach((groupName, index) => {
            const items = groups[groupName];
            const totalItems = items.length;
            const isGroupEmpty = totalItems === 0;
            const groupSelectAllInput = `group_${groupName}_${side}`;
            const isLast = index === keys.length - 1;
            html += `
        <div class="dual-listbox-group${!isLast ? ' mb-3' : ''}">
          <div class="group-header mb-2">
            <div class="${t.formCheck}">
              <input id="${groupSelectAllInput}" type="checkbox" class="${t.formCheckInput} group-select-all" ${isGroupEmpty ? 'checked disabled' : ''}>
              <label for="${groupSelectAllInput}" class="${t.formCheckLabel}">${groupName}</label>
            </div>
          </div>`;
            if (!isGroupEmpty) {
                html += `<ul class="${t.listGroup}">`;
                items.forEach((item) => {
                    const val = (item as any)[this.settings.valueName];
                    const name = (item as any)[this.settings.itemName];
                    html += `
            <li class="${t.listItem}" data-value="${val}" data-group="${groupName}">
              <div class="${t.formCheck}">
                <input id="${groupName}_${val}" type="checkbox" class="${t.formCheckInput} item-select" />
                <label for="${groupName}_${val}" class="${t.formCheckLabel}">${name}</label>
              </div>
            </li>`;
                });
                html += `</ul>`;
            }
            html += `</div>`;
        });
        return html;
    }

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
            } else {
                selectAll.disabled = false;
                selectAll.checked = selectedItems === totalItems;
            }
        }

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

    private moveItems(fromSide: 'left' | 'right', toSide: 'left' | 'right') {
        const fromGroups = fromSide === 'left' ? this.groups : this.selectedGroups;
        const toGroups = toSide === 'left' ? this.groups : this.selectedGroups;
        const contents = this.rootEl.querySelectorAll('.dual-listbox-content');
        const fromContainer = contents[fromSide === 'left' ? 0 : 1] as Element;
        const selectedLis = Array.from(fromContainer.querySelectorAll<HTMLInputElement>('.item-select:checked')).map((inp) => inp.closest('li') as HTMLLIElement);
        selectedLis.forEach((li) => {
            const value = String(li.getAttribute('data-value'));
            const group = String(li.getAttribute('data-group'));
            if (fromGroups[group]) {
                fromGroups[group] = fromGroups[group].filter((i) => String((i as any)[this.settings.valueName]) !== value);
                if (fromGroups[group].length === 0 && (this.settings.hideEmptyGroups || fromSide !== 'left')) {
                    delete (fromGroups as any)[group];
                }
            }
            if (!toGroups[group]) toGroups[group] = [];
            const label = li.querySelector('label')?.textContent || '';
            toGroups[group].push({
                [this.settings.itemName]: label,
                [this.settings.valueName]: value,
                [this.settings.groupName]: group,
            } as any);
        });
        this.render();
    }

    private toggleSelectAll(side: 'left' | 'right', isChecked: boolean) {
        const contents = this.rootEl.querySelectorAll('.dual-listbox-content');
        const content = contents[side === 'left' ? 0 : 1] as Element;
        content?.querySelectorAll<HTMLInputElement>('.group-select-all').forEach((inp) => (inp.checked = isChecked));
        content?.querySelectorAll<HTMLInputElement>('.item-select').forEach((inp) => (inp.checked = isChecked));
        this.updateSelectAllInfo(side);
    }

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

    private appendSelectedGroupsOnSubmit() {
        if (!this.formEl) {
            console.error('Parent form not found!');
            return;
        }
        const selectedValues: (string | number)[] = [];
        Object.values(this.selectedGroups).forEach((items) => {
            items.forEach((item) => selectedValues.push((item as any)[this.settings.valueName]));
        });
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

    getSelectedValues(): Promise<(string | number)[]> {
        return new Promise((resolve) => {
            const selectedValues: (string | number)[] = [];
            Object.keys(this.selectedGroups).forEach((groupName) => {
                this.selectedGroups[groupName].forEach((item) => {
                    selectedValues.push((item as any)[this.settings.valueName]);
                });
            });
            resolve(selectedValues);
        });
    }

    get selected() {
        return this.selectedGroups;
    }

    get selectedArray() {
        let selectedValues: (string | number)[] = [];
        Object.keys(this.selectedGroups).forEach((groupName) => {
            this.selectedGroups[groupName].forEach((item) => {
                selectedValues.push((item as any)[this.settings.valueName]);
            });
        });
        selectedValues = [...new Set(selectedValues)];
        return selectedValues;
    }

    get unselected() {
        return this.groups;
    }

    get allItems() {
        return this.settings.dataArray;
    }

    // New API methods: return arrays without duplicates
    getSelectedItems(): DualListBoxItem[] {
        const map = new Map<string, DualListBoxItem>();
        Object.values(this.selectedGroups).forEach((items) => {
            items.forEach((item) => {
                const key = String((item as any)[this.settings.valueName]);
                if (!map.has(key)) map.set(key, item);
            });
        });
        return Array.from(map.values());
    }

    getUnselectedItems(): DualListBoxItem[] {
        const map = new Map<string, DualListBoxItem>();
        Object.values(this.groups).forEach((items) => {
            items.forEach((item) => {
                const key = String((item as any)[this.settings.valueName]);
                if (!map.has(key)) map.set(key, item);
            });
        });
        return Array.from(map.values());
    }

    getAllItems(): DualListBoxItem[] {
        const map = new Map<string, DualListBoxItem>();
        // include current left and right to reflect UI state
        Object.values(this.groups).forEach((items) => {
            items.forEach((item) => map.set(String((item as any)[this.settings.valueName]), item));
        });
        Object.values(this.selectedGroups).forEach((items) => {
            items.forEach((item) => map.set(String((item as any)[this.settings.valueName]), item));
        });
        return Array.from(map.values());
    }
}

export function initDualListBox(selector: string | Element, options: DualListBoxOptions = {}) {
    return new DualListBox(selector, options);
}

// Attach back-compat static setTheme to the class
// so existing code using DualListBox.setTheme(...) keeps working.
(DualListBox as any).setTheme = (theme: Partial<DualListBoxTheme> | DualListBoxTheme) => useTheme(theme);

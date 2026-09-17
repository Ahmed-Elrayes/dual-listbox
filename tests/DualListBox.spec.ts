import { describe, it, expect, beforeEach } from 'vitest';
import { DualListBox, defaultTheme, bootstrapTheme, tailwindTheme } from '../src';

function createContainer() {
    const div = document.createElement('div');
    div.id = 'dual-listbox-container';
    document.body.appendChild(div);
    return div;
}

function cleanup() {
    document.body.innerHTML = '';
}

describe('DualListBox - basic UI behavior', () => {
    beforeEach(() => cleanup());

    it('renders include/exclude buttons disabled by default', () => {
        const host = createContainer();

        const data = [
            { item: 'Apple', value: 1, group: 'Fruits' },
            { item: 'Orange', value: 2, group: 'Fruits' },
            { item: 'Carrot', value: 3, group: 'Vegetables' },
        ];

        new DualListBox(host, { dataArray: data, selectedItems: [] });

        const includeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-include');
        const excludeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-exclude');

        expect(includeBtn).toBeTruthy();
        expect(excludeBtn).toBeTruthy();
        expect(includeBtn!.disabled).toBe(true);
        expect(excludeBtn!.disabled).toBe(true);
    });

    it('enables include when a left item is selected, and enables exclude when a right item is selected', () => {
        const host = createContainer();

        const data = [
            { item: 'Apple', value: 1, group: 'Fruits' },
            { item: 'Orange', value: 2, group: 'Fruits' },
        ];

        new DualListBox(host, { dataArray: data, selectedItems: [] });

        const includeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-include')!;
        const excludeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-exclude')!;

        // Select first left item
        const contents = host.querySelectorAll('.dual-listbox-content');
        const leftContent = contents[0] as HTMLElement;
        const leftFirstCheckbox = leftContent.querySelector<HTMLInputElement>('.item-select');
        leftFirstCheckbox!.checked = true;
        leftFirstCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));

        expect(includeBtn.disabled).toBe(false);

        includeBtn.click();

        const rightContent = host.querySelectorAll('.dual-listbox-content')[1] as HTMLElement;
        let newExcludeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-exclude')!;
        expect(newExcludeBtn.disabled).toBe(true);

        const rightFirstCheckbox = rightContent.querySelector<HTMLInputElement>('.item-select');
        rightFirstCheckbox!.checked = true;
        rightFirstCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));

        newExcludeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-exclude')!;
        expect(newExcludeBtn.disabled).toBe(false);
    });

    it('throws error if root element not found', () => {
        expect(() => new DualListBox('#nonexistent')).toThrow('DualListBox root element not found');
    });

    it('calls onSubmit callback if provided', () => {
        const form = document.createElement('form');
        document.body.appendChild(form);

        let submittedValues: any = null;
        const host = document.createElement('div');
        form.appendChild(host);

        const data = [{ item: 'A', value: 1 }];
        const box = new DualListBox(host, {
            dataArray: data,
            selectedItems: [],
            onSubmit: (selected) => { submittedValues = selected; }
        });

        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);

        expect(submittedValues).toBeTruthy();
    });

    it('removes empty groups when hideEmptyGroups is true', () => {
        const host = createContainer();
        const data = [{ item: 'A', value: 1, group: 'G1' }];
        const box = new DualListBox(host, { dataArray: data, selectedItems: [], hideEmptyGroups: true });

        const checkbox = host.querySelector<HTMLInputElement>('.dual-listbox-content .item-select')!;
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        const includeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-include')!;
        includeBtn.click();

        expect(Object.keys(box.unselected)).toHaveLength(0);
    });

    it('filters items with search input', () => {
        const host = createContainer();
        const data = [{ item: 'Apple', value: 1, group: 'Fruits' }];
        const box = new DualListBox(host, { dataArray: data, selectedItems: [] });

        const searchInput = host.querySelector<HTMLInputElement>('.dual-listbox-search[data-side="left"]')!;
        searchInput.value = 'banana';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        const leftItems = host.querySelectorAll('.dual-listbox-content li');
        leftItems.forEach(li => expect((li as HTMLElement).style.display).toBe('none'));

        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        leftItems.forEach(li => expect((li as HTMLElement).style.display).toBe(''));
    });

    it('sets global theme using setTheme', () => {
        (DualListBox as any).setTheme({ container: 'my-theme' });
        const host = createContainer();
        const box = new DualListBox(host, { dataArray: [], selectedItems: [] });
        expect(box.getSettings().theme.container).toBe('my-theme');
    });

    describe('themePresets', () => {
        it('defaultTheme has container class', () => {
            expect(defaultTheme.container).toBe('dual-listbox');
        });

        it('tailwindTheme has correct row class', () => {
            expect(tailwindTheme.row).toContain('grid-cols-1');
        });
    });

    describe('group and select-all indeterminate state', () => {
        it('marks a group checkbox indeterminate when only some of its items are checked, checked when all are, unchecked when none are', () => {
            const host = createContainer();
            const data = [
                { item: 'Apple', value: 1, group: 'Fruits' },
                { item: 'Orange', value: 2, group: 'Fruits' },
            ];
            new DualListBox(host, { dataArray: data, selectedItems: [] });

            const groupCheckbox = host.querySelector<HTMLInputElement>('.group-select-all')!;
            const itemCheckboxes = Array.from(host.querySelectorAll<HTMLInputElement>('.item-select'));

            expect(groupCheckbox.checked).toBe(false);
            expect(groupCheckbox.indeterminate).toBe(false);

            itemCheckboxes[0].checked = true;
            itemCheckboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

            expect(groupCheckbox.indeterminate).toBe(true);
            expect(groupCheckbox.checked).toBe(false);

            itemCheckboxes[1].checked = true;
            itemCheckboxes[1].dispatchEvent(new Event('change', { bubbles: true }));

            expect(groupCheckbox.indeterminate).toBe(false);
            expect(groupCheckbox.checked).toBe(true);
        });

        it('marks the pane-level select-all checkbox indeterminate when only some items across groups are checked', () => {
            const host = createContainer();
            const data = [
                { item: 'Apple', value: 1, group: 'Fruits' },
                { item: 'Carrot', value: 2, group: 'Vegetables' },
            ];
            new DualListBox(host, { dataArray: data, selectedItems: [] });

            const selectAllLeft = host.querySelector<HTMLInputElement>('.dual-listbox-select-all-left')!;
            const firstItem = host.querySelector<HTMLInputElement>('.item-select')!;

            firstItem.checked = true;
            firstItem.dispatchEvent(new Event('change', { bubbles: true }));

            expect(selectAllLeft.indeterminate).toBe(true);
            expect(selectAllLeft.checked).toBe(false);
        });
    });

    describe('multiple instances on the same page', () => {
        it('does not collide on checkbox ids/labels between two instances', () => {
            const hostA = createContainer();
            const hostB = document.createElement('div');
            document.body.appendChild(hostB);

            const data = [{ item: 'Apple', value: 1, group: 'Fruits' }];
            new DualListBox(hostA, { dataArray: data, selectedItems: [] });
            new DualListBox(hostB, { dataArray: data, selectedItems: [] });

            const allIds = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
            const uniqueIds = new Set(allIds);
            expect(uniqueIds.size).toBe(allIds.length);

            // Each label still resolves to its own checkbox via `for`.
            document.querySelectorAll('label[for]').forEach((label) => {
                const forId = label.getAttribute('for')!;
                expect(document.getElementById(forId)).toBeTruthy();
            });
        });
    });

    describe('HTML escaping', () => {
        it('escapes item/group names so markup is not injected', () => {
            const host = createContainer();
            const data = [{ item: '<img src=x onerror=alert(1)>', value: 1, group: '<b>Group</b>' }];
            new DualListBox(host, { dataArray: data, selectedItems: [] });

            expect(host.querySelector('img')).toBeNull();
            expect(host.querySelector('.item-select')?.closest('li')?.querySelector('label')?.textContent).toBe('<img src=x onerror=alert(1)>');
            expect(host.querySelector('.group-select-all')?.closest('.dual-listbox-group')?.querySelector('label')?.textContent).toBe('<b>Group</b>');
        });

        it('round-trips a group/value containing quotes through data-* attributes', () => {
            const host = createContainer();
            const data = [{ item: 'Weird', value: 'a"b', group: 'G"1' }];
            new DualListBox(host, { dataArray: data, selectedItems: [] });

            const li = host.querySelector('li')!;
            expect(li.getAttribute('data-value')).toBe('a"b');
            expect(li.getAttribute('data-group')).toBe('G"1');
        });
    });
});

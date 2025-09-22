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
});

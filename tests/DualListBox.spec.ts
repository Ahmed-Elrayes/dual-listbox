import { describe, it, expect, beforeEach } from 'vitest';
import { DualListBox } from '../dist/index.js';

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
    expect(leftFirstCheckbox).toBeTruthy();
    leftFirstCheckbox!.checked = true;
    leftFirstCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));

    // Include button should now be enabled
    expect(includeBtn.disabled).toBe(false);

    // Click include to move selected item to right side (this triggers a full re-render)
    includeBtn.click();

    // Re-query DOM after re-render
    const rightContent = host.querySelectorAll('.dual-listbox-content')[1] as HTMLElement;
    let newExcludeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-exclude')!;
    // At this moment, exclude may still be disabled because nothing is selected on right yet
    expect(newExcludeBtn.disabled).toBe(true);

    // Select an item on the right side
    const rightFirstCheckbox = rightContent.querySelector<HTMLInputElement>('.item-select');
    expect(rightFirstCheckbox).toBeTruthy();
    rightFirstCheckbox!.checked = true;
    rightFirstCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));

    // Re-query exclude button after selection change (safeguard)
    newExcludeBtn = host.querySelector<HTMLButtonElement>('.dual-listbox-exclude')!;
    // Exclude button should be enabled now
    expect(newExcludeBtn.disabled).toBe(false);
  });
});

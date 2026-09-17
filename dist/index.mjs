// src/lib/themePresets.ts
var defaultTheme = {
  container: "dual-listbox",
  row: "row mb-3",
  colLeft: "col-md-5",
  colCenter: "col-md-2 d-flex justify-content-center flex-column gap-3",
  colRight: "col-md-5",
  card: "card h-100",
  cardHeader: "card-header",
  cardBody: "card-body",
  cardFooter: "card-footer text-center",
  searchInput: "form-control mb-3 dual-listbox-search",
  listGroup: "list-group",
  listItem: "list-group-item py-1 border-0",
  formCheck: "form-check",
  formCheckInput: "form-check-input",
  formCheckLabel: "form-check-label",
  btn: "btn btn-light w-100",
  btnInclude: "",
  btnExclude: ""
};
var bootstrapTheme = { ...defaultTheme };
var tailwindTheme = {
  container: "dual-listbox",
  row: "grid grid-cols-1 gap-3 md:grid-cols-5",
  colLeft: "md:col-span-2",
  colCenter: "flex flex-col justify-center gap-2 md:col-span-1",
  colRight: "md:col-span-2",
  card: "flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800",
  cardHeader: "border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200",
  cardBody: "flex-1 p-3",
  cardFooter: "border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400",
  searchInput: "dual-listbox-search mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white",
  listGroup: "space-y-1",
  listItem: "rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700",
  formCheck: "flex items-center gap-2",
  formCheckInput: "h-4 w-4 rounded text-primary-600 focus:ring-primary-500",
  formCheckLabel: "",
  btn: "btn-outline w-full",
  btnInclude: "mb-2",
  btnExclude: ""
};

// src/lib/theme.ts
function mergeTheme(base, override) {
  return { ...base, ...override || {} };
}
var GLOBAL_THEME = { ...defaultTheme };
function useTheme(theme) {
  GLOBAL_THEME = mergeTheme(defaultTheme, theme);
}
function getGlobalTheme() {
  return GLOBAL_THEME;
}

// src/lib/html.ts
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/lib/DualListBox.ts
var DualListBox = class {
  /**
   * @param element CSS selector or root element to render into.
   * @param options Data, labels, behavior flags, and theme overrides — see {@link DualListBoxOptions}.
   * @throws {Error} If `element` is a selector that matches nothing.
   */
  constructor(element, options = {}) {
    this.groups = {};
    this.selectedGroups = {};
    this.rootEl = typeof element === "string" ? document.querySelector(element) : element;
    if (!this.rootEl) throw new Error("DualListBox root element not found");
    this.formEl = this.rootEl.closest("form") || null;
    this.instanceId = this.generateInstanceId();
    this.defaults = {
      itemName: "item",
      groupName: "group",
      valueName: "value",
      inputName: "selectedItems",
      tabNameText: "Available Items",
      rightTabNameText: "Selected Items",
      searchPlaceholderText: "Search...",
      includeButtonText: "Include >>",
      excludeButtonText: "<< Exclude",
      dataArray: [],
      selectedItems: [],
      hideEmptyGroups: false,
      submitForm: true,
      onSubmit: null,
      theme: defaultTheme
    };
    const theme = mergeTheme(getGlobalTheme(), options.theme);
    this.settings = { ...this.defaults, ...options, theme };
    this.originalData = [...this.settings.dataArray];
    this.groups = this.buildGroups(this.settings.dataArray);
    this.selectedGroups = this.buildGroups(this.settings.selectedItems);
    this.sortAllGroups();
    this.removeDuplicatesFromLeft();
    this.render();
    this.bindEvents();
    if (this.formEl) {
      this.formEl.addEventListener("submit", (event) => {
        if (typeof this.settings.onSubmit === "function") {
          event.preventDefault();
          this.settings.onSubmit(this.selected, this.unselected, this.allItems, this.selectedArray);
        } else if (this.settings.submitForm) {
          this.appendSelectedGroupsOnSubmit();
        }
      });
    }
  }
  /** Random ID namespacing this instance's element/checkbox `id`s so multiple instances can coexist on one page. */
  generateInstanceId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 36; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
  /** Sorts every group in both panes to match `originalData` order. */
  sortAllGroups() {
    [this.groups, this.selectedGroups].forEach((groupSet) => {
      Object.keys(groupSet).forEach((groupName) => {
        this.sortGroup(groupSet[groupName]);
      });
    });
  }
  /** Sorts one group's items in place to match their position in `originalData`. */
  sortGroup(group) {
    group.sort((a, b) => {
      const valA = String(a[this.settings.valueName]);
      const valB = String(b[this.settings.valueName]);
      const indexA = this.originalData.findIndex(
        (item) => String(item[this.settings.valueName]) === valA
      );
      const indexB = this.originalData.findIndex(
        (item) => String(item[this.settings.valueName]) === valB
      );
      return indexA - indexB;
    });
  }
  /** Buckets a flat item array into `{ groupName: items[] }`, defaulting ungrouped items to `"Ungrouped"`. */
  buildGroups(dataArray) {
    const groups = {};
    dataArray.forEach((item) => {
      const group = item[this.settings.groupName] || "Ungrouped";
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }
  /** Removes items from the "available" pane already present in `selectedItems`, so they don't render twice. */
  removeDuplicatesFromLeft() {
    Object.keys(this.selectedGroups).forEach((group) => {
      if (this.groups[group]) {
        this.selectedGroups[group].forEach((selectedItem) => {
          this.groups[group] = this.groups[group].filter(
            (item) => String(item[this.settings.valueName]) !== String(selectedItem[this.settings.valueName])
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
  render() {
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
                  ${this.generateGroupedListHTML("left")}
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
                  ${this.generateGroupedListHTML("right")}
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
    this.updateSelectAllInfo("left");
    this.updateSelectAllInfo("right");
  }
  /** Builds one pane's grouped `<ul>` markup; `id`/`for` are namespaced with `instanceId` and values are HTML-escaped. */
  generateGroupedListHTML(side) {
    const t = this.settings.theme;
    const groups = side === "left" ? this.groups : this.selectedGroups;
    let html = "";
    const keys = Object.keys(groups);
    keys.forEach((groupName, index) => {
      const items = groups[groupName];
      const totalItems = items.length;
      const isGroupEmpty = totalItems === 0;
      const groupIdBase = `dual_listbox_${this.instanceId}_group_${escapeHtml(groupName)}_${side}`;
      const isLast = index === keys.length - 1;
      html += `
        <div class="dual-listbox-group${!isLast ? " mb-3" : ""}">
          <div class="group-header mb-2">
            <div class="${t.formCheck}">
              <input id="${groupIdBase}" type="checkbox" class="${t.formCheckInput} group-select-all" ${isGroupEmpty ? "checked disabled" : ""}>
              <label for="${groupIdBase}" class="${t.formCheckLabel}">${escapeHtml(groupName)}</label>
            </div>
          </div>`;
      if (!isGroupEmpty) {
        html += `<ul class="${t.listGroup}">`;
        items.forEach((item) => {
          const val = item[this.settings.valueName];
          const name = item[this.settings.itemName];
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
  updateSelectAllInfo(side) {
    const idx = side === "left" ? 0 : 1;
    const contents = this.rootEl.querySelectorAll(".dual-listbox-content");
    const content = contents[idx];
    const selectAll = this.rootEl.querySelector(`.dual-listbox-select-all-${side}`);
    const totalItems = content ? content.querySelectorAll(".item-select").length : 0;
    const selectedItems = content ? content.querySelectorAll(".item-select:checked").length : 0;
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
    const includeBtn = this.rootEl.querySelector(".dual-listbox-include");
    const excludeBtn = this.rootEl.querySelector(".dual-listbox-exclude");
    const leftContent = contents[0];
    const rightContent = contents[1];
    const leftChecked = leftContent ? leftContent.querySelectorAll(".item-select:checked").length : 0;
    const rightChecked = rightContent ? rightContent.querySelectorAll(".item-select:checked").length : 0;
    if (includeBtn) includeBtn.disabled = leftChecked === 0;
    if (excludeBtn) excludeBtn.disabled = rightChecked === 0;
  }
  /** Sets each group's select-all checkbox to checked/indeterminate/unchecked based on its `.item-select` children. */
  updateGroupCheckboxStates(content) {
    content == null ? void 0 : content.querySelectorAll(".dual-listbox-group").forEach((groupEl) => {
      const groupCheckbox = groupEl.querySelector(".group-select-all");
      if (!groupCheckbox || groupCheckbox.disabled) return;
      const total = groupEl.querySelectorAll(".item-select").length;
      const checkedCount = groupEl.querySelectorAll(".item-select:checked").length;
      groupCheckbox.checked = total > 0 && checkedCount === total;
      groupCheckbox.indeterminate = checkedCount > 0 && checkedCount < total;
    });
  }
  /** Wires up click/change/input delegation once for the widget's lifetime. */
  bindEvents() {
    this.rootEl.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest(".dual-listbox-include")) {
        this.moveItems("left", "right");
      } else if (target.closest(".dual-listbox-exclude")) {
        this.moveItems("right", "left");
      }
    });
    this.rootEl.addEventListener("change", (e) => {
      const target = e.target;
      if (target.matches(".dual-listbox-select-all-left")) {
        this.toggleSelectAll("left", target.checked);
      } else if (target.matches(".dual-listbox-select-all-right")) {
        this.toggleSelectAll("right", target.checked);
      } else if (target.matches(".group-select-all")) {
        const groupEl = target.closest(".dual-listbox-group");
        groupEl == null ? void 0 : groupEl.querySelectorAll(".item-select").forEach((inp) => inp.checked = target.checked);
        this.updateSelectAllInfo("left");
        this.updateSelectAllInfo("right");
      } else if (target.matches(".item-select")) {
        this.updateSelectAllInfo("left");
        this.updateSelectAllInfo("right");
      }
    });
    this.rootEl.addEventListener("input", (e) => {
      const target = e.target;
      if (target.matches(".dual-listbox-search")) {
        const side = target.getAttribute("data-side") || "left";
        const searchTerm = target.value || "";
        this.searchItems(side, searchTerm);
      }
    });
  }
  /** Moves every checked item from one pane's data model to the other and re-renders; de-dupes and keeps groups sorted. */
  moveItems(fromSide, toSide) {
    const fromGroups = fromSide === "left" ? this.groups : this.selectedGroups;
    const toGroups = toSide === "left" ? this.groups : this.selectedGroups;
    const contents = this.rootEl.querySelectorAll(".dual-listbox-content");
    const fromContainer = contents[fromSide === "left" ? 0 : 1];
    const selectedLis = Array.from(fromContainer.querySelectorAll(".item-select:checked")).map((inp) => inp.closest("li"));
    selectedLis.forEach((li) => {
      const value = String(li.getAttribute("data-value"));
      const group = String(li.getAttribute("data-group"));
      const originalItem = this.originalData.find((item) => String(item[this.settings.valueName]) === value);
      if (!originalItem) return;
      if (fromGroups[group]) {
        fromGroups[group] = fromGroups[group].filter((i) => String(i[this.settings.valueName]) !== value);
        if (fromGroups[group].length === 0 && (this.settings.hideEmptyGroups || fromSide !== "left")) {
          delete fromGroups[group];
        }
      }
      if (!toGroups[group]) toGroups[group] = [];
      if (!toGroups[group].some((i) => String(i[this.settings.valueName]) === value)) {
        toGroups[group].push(originalItem);
      }
      this.sortGroup(toGroups[group]);
    });
    this.render();
  }
  /** Checks or unchecks every group and item checkbox in one pane. */
  toggleSelectAll(side, isChecked) {
    const contents = this.rootEl.querySelectorAll(".dual-listbox-content");
    const content = contents[side === "left" ? 0 : 1];
    content == null ? void 0 : content.querySelectorAll(".group-select-all").forEach((inp) => inp.checked = isChecked);
    content == null ? void 0 : content.querySelectorAll(".item-select").forEach((inp) => inp.checked = isChecked);
    this.updateSelectAllInfo(side);
  }
  /** Filters one pane's visible groups/items by a case-insensitive substring match on group/item label text. */
  searchItems(side, searchTerm) {
    const contents = this.rootEl.querySelectorAll(".dual-listbox-content");
    const container = contents[side === "left" ? 0 : 1];
    const searchText = (searchTerm || "").toLowerCase();
    container == null ? void 0 : container.querySelectorAll(".dual-listbox-group").forEach((groupEl) => {
      var _a;
      const groupName = (((_a = groupEl.querySelector(".group-header")) == null ? void 0 : _a.textContent) || "").toLowerCase();
      const items = groupEl.querySelectorAll("li");
      let showGroup = false;
      if (groupName.includes(searchText)) {
        groupEl.style.display = "";
        items.forEach((li) => li.style.display = "");
        showGroup = true;
      } else {
        items.forEach((li) => {
          var _a2;
          const itemText = (((_a2 = li.querySelector("label")) == null ? void 0 : _a2.textContent) || "").toLowerCase();
          if (itemText.includes(searchText)) {
            li.style.display = "";
            showGroup = true;
          } else {
            li.style.display = "none";
          }
        });
        groupEl.style.display = showGroup ? "" : "none";
      }
    });
    if (!searchText) {
      container == null ? void 0 : container.querySelectorAll(".dual-listbox-group").forEach((g) => g.style.display = "");
      container == null ? void 0 : container.querySelectorAll("li").forEach((li) => li.style.display = "");
    }
  }
  /** Replaces any previously appended hidden inputs with one `<input type="hidden" name="{inputName}[]">` per selected value. */
  appendSelectedGroupsOnSubmit() {
    if (!this.formEl) {
      console.error("Parent form not found!");
      return;
    }
    const selectedValues = this.selectedArray;
    Array.from(this.formEl.querySelectorAll(`input[name="${this.settings.inputName}[]"]`)).forEach((el) => el.remove());
    selectedValues.forEach((value) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = `${this.settings.inputName}[]`;
      input.value = String(value);
      this.formEl.appendChild(input);
    });
  }
  /** @returns The selected items' values, kept for backward compatibility with the original callback-era API. */
  getSelectedValues() {
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
    const selectedValues = [];
    this.originalData.forEach((item) => {
      const val = item[this.settings.valueName];
      const group = item[this.settings.groupName] || "Ungrouped";
      if (this.selectedGroups[group]) {
        const isSelected = this.selectedGroups[group].some(
          (i) => String(i[this.settings.valueName]) === String(val)
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
  getSelectedItems() {
    const selected = [];
    const values = this.selectedArray.map(String);
    this.originalData.forEach((item) => {
      if (values.includes(String(item[this.settings.valueName]))) {
        selected.push(item);
      }
    });
    return selected;
  }
  /** @returns Unselected items as a flat, de-duplicated array of the original item objects. */
  getUnselectedItems() {
    const unselected = [];
    const selectedValues = this.selectedArray.map(String);
    this.originalData.forEach((item) => {
      if (!selectedValues.includes(String(item[this.settings.valueName]))) {
        unselected.push(item);
      }
    });
    return unselected;
  }
  /** @returns A shallow copy of every item originally passed in via `dataArray`. */
  getAllItems() {
    return [...this.originalData];
  }
  /** @returns The fully-resolved settings (defaults + options + merged theme) for this instance. */
  getSettings() {
    return this.settings;
  }
};
function initDualListBox(selector, options = {}) {
  return new DualListBox(selector, options);
}
DualListBox.setTheme = (theme) => useTheme(theme);

export { DualListBox, bootstrapTheme, defaultTheme, initDualListBox, tailwindTheme, useTheme };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map
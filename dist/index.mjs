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
  container: "dual-listbox tw",
  row: "grid grid-cols-1 md:grid-cols-5 gap-3",
  colLeft: "md:col-span-2",
  colCenter: "md:col-span-1 flex flex-col justify-center gap-3",
  colRight: "md:col-span-2",
  card: "h-full border rounded shadow-sm bg-white",
  cardHeader: "px-4 py-2 border-b font-medium",
  cardBody: "p-4",
  cardFooter: "px-4 py-2 border-t text-center",
  searchInput: "w-full mb-3 border rounded px-3 py-2 dual-listbox-search",
  listGroup: "space-y-1",
  listItem: "py-1",
  formCheck: "flex items-center gap-2",
  formCheckInput: "h-4 w-4",
  formCheckLabel: "",
  btn: "w-full border rounded px-3 py-2 bg-gray-100 hover:bg-gray-200",
  btnInclude: "mb-2",
  btnExclude: ""
};

// src/lib/DualListBox.ts
function mergeTheme(base, override) {
  return { ...base, ...override || {} };
}
var GLOBAL_THEME = { ...defaultTheme };
function useTheme(theme) {
  GLOBAL_THEME = mergeTheme(defaultTheme, theme);
}
var DualListBox = class {
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
    const themeBase = mergeTheme(defaultTheme, GLOBAL_THEME);
    const theme = mergeTheme(themeBase, options.theme);
    this.settings = { ...this.defaults, ...options, theme };
    this.groups = this.buildGroups(this.settings.dataArray);
    this.selectedGroups = this.buildGroups(this.settings.selectedItems);
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
  generateInstanceId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 36; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
  buildGroups(dataArray) {
    const groups = {};
    dataArray.forEach((item) => {
      const group = item[this.settings.groupName] || "Ungrouped";
      if (!groups[group]) groups[group] = [];
      if (!groups[group].some((existing) => existing[this.settings.valueName] === item[this.settings.valueName])) {
        groups[group].push(item);
      }
    });
    return groups;
  }
  removeDuplicatesFromLeft() {
    Object.keys(this.selectedGroups).forEach((group) => {
      if (this.groups[group]) {
        this.selectedGroups[group].forEach((selectedItem) => {
          this.groups[group] = this.groups[group].filter(
            (item) => item[this.settings.valueName] !== selectedItem[this.settings.valueName]
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
  render() {
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
            <button class="${t.btn} dual-listbox-include ${t.btnInclude}" disabled>${this.settings.includeButtonText}</button>
            <button class="${t.btn} dual-listbox-exclude ${t.btnExclude}" disabled>${this.settings.excludeButtonText}</button>
          </div>
          <div class="${t.colRight}" id="dual_listbox_${this.instanceId}_right_side">
            <div class="${t.card}">
              <div class="${t.cardHeader}">${this.settings.rightTabNameText}</div>
              <div class="${t.cardBody}">
                <input id="dual_listbox_${this.instanceId}_right_search" type="text" class="${t.searchInput}" data-side="right" placeholder="${this.settings.searchPlaceholderText}">
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
  generateGroupedListHTML(side) {
    const t = this.settings.theme;
    const groups = side === "left" ? this.groups : this.selectedGroups;
    let html = "";
    const keys = Object.keys(groups);
    keys.forEach((groupName, index) => {
      const items = groups[groupName];
      const totalItems = items.length;
      const isGroupEmpty = totalItems === 0;
      const groupSelectAllInput = `group_${groupName}_${side}`;
      const isLast = index === keys.length - 1;
      html += `
        <div class="dual-listbox-group${!isLast ? " mb-3" : ""}">
          <div class="group-header mb-2">
            <div class="${t.formCheck}">
              <input id="${groupSelectAllInput}" type="checkbox" class="${t.formCheckInput} group-select-all" ${isGroupEmpty ? "checked disabled" : ""}>
              <label for="${groupSelectAllInput}" class="${t.formCheckLabel}">${groupName}</label>
            </div>
          </div>`;
      if (!isGroupEmpty) {
        html += `<ul class="${t.listGroup}">`;
        items.forEach((item) => {
          const val = item[this.settings.valueName];
          const name = item[this.settings.itemName];
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
      } else {
        selectAll.disabled = false;
        selectAll.checked = selectedItems === totalItems;
      }
    }
    const includeBtn = this.rootEl.querySelector(".dual-listbox-include");
    const excludeBtn = this.rootEl.querySelector(".dual-listbox-exclude");
    const leftContent = contents[0];
    const rightContent = contents[1];
    const leftChecked = leftContent ? leftContent.querySelectorAll(".item-select:checked").length : 0;
    const rightChecked = rightContent ? rightContent.querySelectorAll(".item-select:checked").length : 0;
    if (includeBtn) includeBtn.disabled = leftChecked === 0;
    if (excludeBtn) excludeBtn.disabled = rightChecked === 0;
  }
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
  moveItems(fromSide, toSide) {
    const fromGroups = fromSide === "left" ? this.groups : this.selectedGroups;
    const toGroups = toSide === "left" ? this.groups : this.selectedGroups;
    const contents = this.rootEl.querySelectorAll(".dual-listbox-content");
    const fromContainer = contents[fromSide === "left" ? 0 : 1];
    const selectedLis = Array.from(fromContainer.querySelectorAll(".item-select:checked")).map((inp) => inp.closest("li"));
    selectedLis.forEach((li) => {
      var _a;
      const value = String(li.getAttribute("data-value"));
      const group = String(li.getAttribute("data-group"));
      if (fromGroups[group]) {
        fromGroups[group] = fromGroups[group].filter((i) => String(i[this.settings.valueName]) !== value);
        if (fromGroups[group].length === 0 && (this.settings.hideEmptyGroups || fromSide !== "left")) {
          delete fromGroups[group];
        }
      }
      if (!toGroups[group]) toGroups[group] = [];
      const label = ((_a = li.querySelector("label")) == null ? void 0 : _a.textContent) || "";
      toGroups[group].push({
        [this.settings.itemName]: label,
        [this.settings.valueName]: value,
        [this.settings.groupName]: group
      });
    });
    this.render();
  }
  toggleSelectAll(side, isChecked) {
    const contents = this.rootEl.querySelectorAll(".dual-listbox-content");
    const content = contents[side === "left" ? 0 : 1];
    content == null ? void 0 : content.querySelectorAll(".group-select-all").forEach((inp) => inp.checked = isChecked);
    content == null ? void 0 : content.querySelectorAll(".item-select").forEach((inp) => inp.checked = isChecked);
    this.updateSelectAllInfo(side);
  }
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
  appendSelectedGroupsOnSubmit() {
    if (!this.formEl) {
      console.error("Parent form not found!");
      return;
    }
    const selectedValues = [];
    Object.values(this.selectedGroups).forEach((items) => {
      items.forEach((item) => selectedValues.push(item[this.settings.valueName]));
    });
    Array.from(this.formEl.querySelectorAll(`input[name="${this.settings.inputName}[]"]`)).forEach((el) => el.remove());
    selectedValues.forEach((value) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = `${this.settings.inputName}[]`;
      input.value = String(value);
      this.formEl.appendChild(input);
    });
  }
  getSelectedValues() {
    return new Promise((resolve) => {
      const selectedValues = [];
      Object.keys(this.selectedGroups).forEach((groupName) => {
        this.selectedGroups[groupName].forEach((item) => {
          selectedValues.push(item[this.settings.valueName]);
        });
      });
      resolve(selectedValues);
    });
  }
  get selected() {
    return this.selectedGroups;
  }
  get selectedArray() {
    let selectedValues = [];
    Object.keys(this.selectedGroups).forEach((groupName) => {
      this.selectedGroups[groupName].forEach((item) => {
        selectedValues.push(item[this.settings.valueName]);
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
  getSelectedItems() {
    const map = /* @__PURE__ */ new Map();
    Object.values(this.selectedGroups).forEach((items) => {
      items.forEach((item) => {
        const key = String(item[this.settings.valueName]);
        if (!map.has(key)) map.set(key, item);
      });
    });
    return Array.from(map.values());
  }
  getUnselectedItems() {
    const map = /* @__PURE__ */ new Map();
    Object.values(this.groups).forEach((items) => {
      items.forEach((item) => {
        const key = String(item[this.settings.valueName]);
        if (!map.has(key)) map.set(key, item);
      });
    });
    return Array.from(map.values());
  }
  getAllItems() {
    const map = /* @__PURE__ */ new Map();
    Object.values(this.groups).forEach((items) => {
      items.forEach((item) => map.set(String(item[this.settings.valueName]), item));
    });
    Object.values(this.selectedGroups).forEach((items) => {
      items.forEach((item) => map.set(String(item[this.settings.valueName]), item));
    });
    return Array.from(map.values());
  }
};
function initDualListBox(selector, options = {}) {
  return new DualListBox(selector, options);
}
DualListBox.setTheme = (theme) => useTheme(theme);

export { DualListBox, bootstrapTheme, defaultTheme, initDualListBox, tailwindTheme, useTheme };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map
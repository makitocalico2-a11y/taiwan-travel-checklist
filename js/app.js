(() => {
  "use strict";

  const STORAGE_KEY = "taiwan-travel-checklist-v2";
  const COLLAPSE_KEY = "taiwan-travel-checklist-collapse-v2";
  const TAB_KEY = "taiwan-travel-checklist-tab-v1";
  const CUSTOM_KEY = "taiwan-travel-checklist-custom-v1";
  const HIDDEN_KEY = "taiwan-travel-checklist-hidden-v1";
  const TABS = ["belongings", "checks", "carryOn"];

  const checklistEl = document.getElementById("checklist");
  const progressTextEl = document.getElementById("progressText");
  const progressPercentEl = document.getElementById("progressPercent");
  const progressBarEl = document.getElementById("progressBar");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  const addItemDialog = document.getElementById("addItemDialog");
  const addCategoryDialog = document.getElementById("addCategoryDialog");
  const itemCategorySelect = document.getElementById("itemCategorySelect");
  const itemTextInput = document.getElementById("itemTextInput");
  const itemDescriptionInput = document.getElementById("itemDescriptionInput");
  const categoryNameInput = document.getElementById("categoryNameInput");
  const restoreDeletedBtn = document.getElementById("restoreDeletedBtn");

  let activeTab = localStorage.getItem(TAB_KEY) || "belongings";
  let checkedState = loadJson(STORAGE_KEY, {});
  let collapsedState = loadJson(COLLAPSE_KEY, {});
  let customData = loadJson(CUSTOM_KEY, {});
  let hiddenData = loadJson(HIDDEN_KEY, {});

  ensureStoredStructures();

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function ensureStoredStructures() {
    TABS.forEach(tab => {
      if (!customData[tab]) customData[tab] = { categories: [], items: {} };
      if (!Array.isArray(customData[tab].categories)) customData[tab].categories = [];
      if (!customData[tab].items || typeof customData[tab].items !== "object") {
        customData[tab].items = {};
      }

      if (!hiddenData[tab]) hiddenData[tab] = { categories: [], items: {} };
      if (!Array.isArray(hiddenData[tab].categories)) hiddenData[tab].categories = [];
      if (!hiddenData[tab].items || typeof hiddenData[tab].items !== "object") {
        hiddenData[tab].items = {};
      }
    });
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
  }

  function saveCollapseState() {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsedState));
  }

  function saveCustomData() {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customData));
  }

  function saveHiddenData() {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenData));
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function makeBaseItemKey(tab, categoryId, index) {
    return `${tab}:${categoryId}:base:${index}`;
  }

  function makeCustomItemKey(tab, categoryId, itemId) {
    return `${tab}:${categoryId}:custom:${itemId}`;
  }

  function normalizeBaseItem(raw, index) {
    if (typeof raw === "string") {
      return { id: `base-${index}`, text: raw, description: "" };
    }
    return {
      id: `base-${index}`,
      text: raw?.text || "",
      description: raw?.description || ""
    };
  }

  function isBaseCategoryHidden(categoryId) {
    return hiddenData[activeTab].categories.includes(categoryId);
  }

  function isBaseItemHidden(categoryId, index) {
    const list = hiddenData[activeTab].items[categoryId] || [];
    return list.includes(index);
  }

  function getActiveCategories() {
    const baseCategories = (CHECKLIST_DATA[activeTab] || [])
      .filter(category => !isBaseCategoryHidden(category.id))
      .map(category => ({ ...category, custom: false }));

    const addedCategories = customData[activeTab].categories.map(category => ({
      id: category.id,
      title: category.title,
      items: [],
      custom: true
    }));

    return [...baseCategories, ...addedCategories];
  }

  function getCategoryItems(category) {
    const result = [];

    (category.items || []).forEach((raw, index) => {
      if (isBaseItemHidden(category.id, index)) return;
      const baseItem = normalizeBaseItem(raw, index);
      result.push({
        ...baseItem,
        baseIndex: index,
        custom: false,
        key: makeBaseItemKey(activeTab, category.id, index)
      });
    });

    const customItems = customData[activeTab].items[category.id] || [];
    customItems.forEach(item => {
      result.push({
        id: item.id,
        text: item.text,
        description: item.description || "",
        custom: true,
        key: makeCustomItemKey(activeTab, category.id, item.id)
      });
    });

    return result;
  }

  function hasDeletedBaseEntries() {
    return hiddenData[activeTab].categories.length > 0 ||
      Object.values(hiddenData[activeTab].items).some(list => Array.isArray(list) && list.length > 0);
  }

  function render() {
    tabs.forEach(tab => {
      const selected = tab.dataset.tab === activeTab;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    });

    if (restoreDeletedBtn) {
      restoreDeletedBtn.disabled = !hasDeletedBaseEntries();
    }

    const categories = getActiveCategories();
    checklistEl.innerHTML = "";

    if (!categories.length) {
      checklistEl.innerHTML = '<div class="empty">項目がありません。削除した既存項目は「削除項目を復元」から戻せます。</div>';
      updateProgress();
      return;
    }

    categories.forEach(category => {
      const items = getCategoryItems(category);
      const categoryEl = document.createElement("article");
      categoryEl.className = "category";
      categoryEl.dataset.categoryId = category.id;

      if (collapsedState[`${activeTab}:${category.id}`]) {
        categoryEl.classList.add("collapsed");
      }

      const checkedCount = items.reduce((count, item) => count + (checkedState[item.key] ? 1 : 0), 0);

      const header = document.createElement("div");
      header.className = "category-header";

      const headerMain = document.createElement("button");
      headerMain.type = "button";
      headerMain.className = "category-header-main";
      headerMain.innerHTML = `
        <span class="category-title">
          ${escapeHtml(category.title)}
          ${category.custom ? '<span class="custom-badge">追加</span>' : ''}
        </span>
        <span class="category-meta">
          <span class="category-count">${checkedCount}/${items.length}</span>
          <span class="chevron" aria-hidden="true"></span>
        </span>
      `;
      headerMain.addEventListener("click", () => toggleCategory(categoryEl, category.id));
      header.appendChild(headerMain);

      const deleteCategoryBtn = document.createElement("button");
      deleteCategoryBtn.type = "button";
      deleteCategoryBtn.className = "delete-category-btn";
      deleteCategoryBtn.title = category.custom ? "追加したカテゴリを削除" : "既存カテゴリを削除";
      deleteCategoryBtn.setAttribute("aria-label", `${category.title}を削除`);
      deleteCategoryBtn.textContent = "×";
      deleteCategoryBtn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (category.custom) {
          deleteCustomCategory(category.id, category.title);
        } else {
          deleteBaseCategory(category.id, category.title);
        }
      });
      header.appendChild(deleteCategoryBtn);

      const itemsEl = document.createElement("div");
      itemsEl.className = "category-items";

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "info-note";
        empty.textContent = "まだ項目がありません。「＋ 項目追加」から追加できます。";
        itemsEl.appendChild(empty);
      }

      items.forEach(item => {
        const row = document.createElement("div");
        row.className = "check-item";
        if (checkedState[item.key]) row.classList.add("checked");

        const label = document.createElement("label");
        label.className = "check-item-main";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(checkedState[item.key]);
        checkbox.addEventListener("change", () => {
          checkedState[item.key] = checkbox.checked;
          saveState();
          render();
        });

        const copy = document.createElement("span");
        copy.className = "item-copy";

        const title = document.createElement("span");
        title.className = "item-title";
        title.textContent = item.text;
        copy.appendChild(title);

        if (item.description) {
          const description = document.createElement("span");
          description.className = "item-description";
          description.textContent = item.description;
          copy.appendChild(description);
        }

        label.append(checkbox, copy);
        row.appendChild(label);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-item-btn";
        deleteBtn.title = item.custom ? "追加した項目を削除" : "既存項目を削除";
        deleteBtn.setAttribute("aria-label", `${item.text}を削除`);
        deleteBtn.textContent = "×";
        deleteBtn.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          if (item.custom) {
            deleteCustomItem(category.id, item.id, item.text, item.key);
          } else {
            deleteBaseItem(category.id, item.baseIndex, item.text, item.key);
          }
        });
        row.appendChild(deleteBtn);
        itemsEl.appendChild(row);
      });

      if (category.note) {
        const note = document.createElement("div");
        note.className = "info-note";
        note.textContent = category.note;
        itemsEl.appendChild(note);
      }

      categoryEl.append(header, itemsEl);
      checklistEl.appendChild(categoryEl);
    });

    updateProgress();
  }

  function updateProgress() {
    const categories = getActiveCategories();
    let total = 0;
    let checked = 0;

    categories.forEach(category => {
      getCategoryItems(category).forEach(item => {
        total += 1;
        if (checkedState[item.key]) checked += 1;
      });
    });

    const percent = total ? Math.round((checked / total) * 100) : 0;
    progressTextEl.textContent = `${checked} / ${total}`;
    progressPercentEl.textContent = `${percent}%`;
    progressBarEl.style.width = `${percent}%`;
  }

  function toggleCategory(categoryEl, categoryId) {
    const key = `${activeTab}:${categoryId}`;
    const isCollapsed = categoryEl.classList.toggle("collapsed");
    collapsedState[key] = isCollapsed;
    saveCollapseState();
  }

  function setAllCollapsed(value) {
    getActiveCategories().forEach(category => {
      collapsedState[`${activeTab}:${category.id}`] = value;
    });
    saveCollapseState();
    render();
  }

  function resetActiveTab() {
    if (!window.confirm("このタブのチェックをすべて解除します。よろしいですか？")) return;

    getActiveCategories().forEach(category => {
      getCategoryItems(category).forEach(item => delete checkedState[item.key]);
    });

    saveState();
    render();
  }

  function openAddItemDialog() {
    const categories = getActiveCategories();
    itemCategorySelect.innerHTML = "";

    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.title;
      itemCategorySelect.appendChild(option);
    });

    if (!categories.length) {
      alert("先にカテゴリを追加してください。");
      return;
    }

    itemTextInput.value = "";
    if (itemDescriptionInput) itemDescriptionInput.value = "";
    addItemDialog.showModal();
    setTimeout(() => itemTextInput.focus(), 50);
  }

  function addCustomItem(categoryId, text, description) {
    const clean = text.trim();
    if (!clean) return;

    if (!customData[activeTab].items[categoryId]) {
      customData[activeTab].items[categoryId] = [];
    }

    customData[activeTab].items[categoryId].push({
      id: makeId("item"),
      text: clean,
      description: (description || "").trim()
    });

    saveCustomData();
    render();
  }

  function addCustomCategory(title) {
    const clean = title.trim();
    if (!clean) return;

    const id = makeId("category");
    customData[activeTab].categories.push({ id, title: clean });
    customData[activeTab].items[id] = [];
    saveCustomData();
    render();
  }

  function deleteBaseItem(categoryId, baseIndex, text, itemKey) {
    if (!window.confirm(`既存項目「${text}」を削除しますか？\nあとで「削除項目を復元」から戻せます。`)) return;

    if (!hiddenData[activeTab].items[categoryId]) {
      hiddenData[activeTab].items[categoryId] = [];
    }
    if (!hiddenData[activeTab].items[categoryId].includes(baseIndex)) {
      hiddenData[activeTab].items[categoryId].push(baseIndex);
    }

    delete checkedState[itemKey];
    saveState();
    saveHiddenData();
    render();
  }

  function deleteBaseCategory(categoryId, title) {
    if (!window.confirm(`既存カテゴリ「${title}」を削除しますか？\nあとで「削除項目を復元」から戻せます。`)) return;

    if (!hiddenData[activeTab].categories.includes(categoryId)) {
      hiddenData[activeTab].categories.push(categoryId);
    }

    const category = (CHECKLIST_DATA[activeTab] || []).find(item => item.id === categoryId);
    (category?.items || []).forEach((_, index) => {
      delete checkedState[makeBaseItemKey(activeTab, categoryId, index)];
    });
    delete collapsedState[`${activeTab}:${categoryId}`];

    saveState();
    saveCollapseState();
    saveHiddenData();
    render();
  }

  function restoreDeletedBaseEntries() {
    if (!hasDeletedBaseEntries()) return;
    if (!window.confirm("このタブで削除した既存項目・既存カテゴリをすべて元に戻しますか？")) return;

    hiddenData[activeTab] = { categories: [], items: {} };
    saveHiddenData();
    render();
  }

  function deleteCustomItem(categoryId, itemId, text, itemKey) {
    if (!window.confirm(`追加項目「${text}」を削除しますか？`)) return;

    const list = customData[activeTab].items[categoryId] || [];
    customData[activeTab].items[categoryId] = list.filter(item => item.id !== itemId);
    delete checkedState[itemKey];
    saveState();
    saveCustomData();
    render();
  }

  function deleteCustomCategory(categoryId, title) {
    if (!window.confirm(`追加カテゴリ「${title}」と、その中の追加項目を削除しますか？`)) return;

    const items = customData[activeTab].items[categoryId] || [];
    items.forEach(item => delete checkedState[makeCustomItemKey(activeTab, categoryId, item.id)]);

    customData[activeTab].categories = customData[activeTab].categories.filter(category => category.id !== categoryId);
    delete customData[activeTab].items[categoryId];
    delete collapsedState[`${activeTab}:${categoryId}`];

    saveState();
    saveCollapseState();
    saveCustomData();
    render();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      activeTab = tab.dataset.tab;
      localStorage.setItem(TAB_KEY, activeTab);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.getElementById("addItemBtn").addEventListener("click", openAddItemDialog);
  document.getElementById("addCategoryBtn").addEventListener("click", () => {
    categoryNameInput.value = "";
    addCategoryDialog.showModal();
    setTimeout(() => categoryNameInput.focus(), 50);
  });

  document.getElementById("addItemForm").addEventListener("submit", event => {
    event.preventDefault();
    addCustomItem(itemCategorySelect.value, itemTextInput.value, itemDescriptionInput?.value || "");
    addItemDialog.close();
  });

  document.getElementById("addCategoryForm").addEventListener("submit", event => {
    event.preventDefault();
    addCustomCategory(categoryNameInput.value);
    addCategoryDialog.close();
  });

  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.closeDialog).close();
    });
  });

  document.getElementById("expandAllBtn").addEventListener("click", () => setAllCollapsed(false));
  document.getElementById("collapseAllBtn").addEventListener("click", () => setAllCollapsed(true));
  document.getElementById("resetBtn").addEventListener("click", resetActiveTab);
  restoreDeletedBtn?.addEventListener("click", restoreDeletedBaseEntries);

  const helpDialog = document.getElementById("helpDialog");
  document.getElementById("installHintBtn").addEventListener("click", () => {
    if (typeof helpDialog.showModal === "function") {
      helpDialog.showModal();
    } else {
      alert("項目をタップするとチェックできます。既存項目の削除はあとで復元できます。");
    }
  });

  render();
})();

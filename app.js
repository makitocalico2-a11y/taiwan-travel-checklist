(() => {
  "use strict";

  console.log("Taiwan checklist app v3 loaded");

  const STORAGE_KEY = "taiwan-travel-checklist-v2";
  const COLLAPSE_KEY = "taiwan-travel-checklist-collapse-v2";
  const TAB_KEY = "taiwan-travel-checklist-tab-v1";
  const CUSTOM_KEY = "taiwan-travel-checklist-custom-v1";

  const checklistEl = document.getElementById("checklist");
  const progressTextEl = document.getElementById("progressText");
  const progressPercentEl = document.getElementById("progressPercent");
  const progressBarEl = document.getElementById("progressBar");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  const addItemDialog = document.getElementById("addItemDialog");
  const addCategoryDialog = document.getElementById("addCategoryDialog");
  const itemCategorySelect = document.getElementById("itemCategorySelect");
  const itemTextInput = document.getElementById("itemTextInput");
  const categoryNameInput = document.getElementById("categoryNameInput");

  let activeTab = localStorage.getItem(TAB_KEY) || "belongings";
  let checkedState = loadJson(STORAGE_KEY, {});
  let collapsedState = loadJson(COLLAPSE_KEY, {});
  let customData = loadJson(CUSTOM_KEY, {
    belongings: { categories: [], items: {} },
    checks: { categories: [], items: {} },
    carryOn: { categories: [], items: {} }
  });

  ensureCustomStructure();

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function ensureCustomStructure() {
    ["belongings", "checks", "carryOn"].forEach(tab => {
      if (!customData[tab]) customData[tab] = { categories: [], items: {} };
      if (!Array.isArray(customData[tab].categories)) customData[tab].categories = [];
      if (!customData[tab].items || typeof customData[tab].items !== "object") {
        customData[tab].items = {};
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

  function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function makeBaseItemKey(tab, categoryId, index) {
    return `${tab}:${categoryId}:base:${index}`;
  }

  function makeCustomItemKey(tab, categoryId, itemId) {
    return `${tab}:${categoryId}:custom:${itemId}`;
  }

  function getActiveCategories() {
    const baseCategories = (CHECKLIST_DATA[activeTab] || []).map(category => ({
      ...category,
      custom: false
    }));

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

    (category.items || []).forEach((text, index) => {
      result.push({
        id: `base-${index}`,
        text,
        custom: false,
        key: makeBaseItemKey(activeTab, category.id, index)
      });
    });

    const customItems = customData[activeTab].items[category.id] || [];
    customItems.forEach(item => {
      result.push({
        id: item.id,
        text: item.text,
        custom: true,
        key: makeCustomItemKey(activeTab, category.id, item.id)
      });
    });

    return result;
  }

  function render() {
    tabs.forEach(tab => {
      const selected = tab.dataset.tab === activeTab;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    });

    const categories = getActiveCategories();
    checklistEl.innerHTML = "";

    if (!categories.length) {
      checklistEl.innerHTML = '<div class="empty">項目がありません。</div>';
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

      const checkedCount = items.reduce((count, item) => {
        return count + (checkedState[item.key] ? 1 : 0);
      }, 0);

      const header = document.createElement("div");
      header.className = "category-header";

      const headerMain = document.createElement("button");
      headerMain.type = "button";
      headerMain.className = "category-header-main";
      headerMain.style.cssText = "border:0;background:transparent;padding:0;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;color:inherit;flex:1;";
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

      if (category.custom) {
        const deleteCategoryBtn = document.createElement("button");
        deleteCategoryBtn.type = "button";
        deleteCategoryBtn.className = "delete-category-btn";
        deleteCategoryBtn.title = "カテゴリを削除";
        deleteCategoryBtn.setAttribute("aria-label", `${category.title}を削除`);
        deleteCategoryBtn.textContent = "×";
        deleteCategoryBtn.addEventListener("click", () => deleteCustomCategory(category.id, category.title));
        header.appendChild(deleteCategoryBtn);
      }

      const itemsEl = document.createElement("div");
      itemsEl.className = "category-items";

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "info-note";
        empty.textContent = "まだ項目がありません。「＋ 項目追加」から追加できます。";
        itemsEl.appendChild(empty);
      }

      items.forEach(item => {
        const label = document.createElement("label");
        label.className = "check-item";
        if (checkedState[item.key]) label.classList.add("checked");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(checkedState[item.key]);
        checkbox.addEventListener("change", () => {
          checkedState[item.key] = checkbox.checked;
          saveState();
          render();
        });

        const span = document.createElement("span");
        span.className = "item-text";
        span.textContent = item.text;

        label.append(checkbox, span);

        if (item.custom) {
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "delete-item-btn";
          deleteBtn.title = "追加した項目を削除";
          deleteBtn.setAttribute("aria-label", `${item.text}を削除`);
          deleteBtn.textContent = "×";
          deleteBtn.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            deleteCustomItem(category.id, item.id, item.text, item.key);
          });
          label.appendChild(deleteBtn);
        }

        itemsEl.appendChild(label);
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
    const ok = window.confirm("このタブのチェックをすべて解除します。よろしいですか？");
    if (!ok) return;

    getActiveCategories().forEach(category => {
      getCategoryItems(category).forEach(item => {
        delete checkedState[item.key];
      });
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
    addItemDialog.showModal();
    setTimeout(() => itemTextInput.focus(), 50);
  }

  function addCustomItem(categoryId, text) {
    const clean = text.trim();
    if (!clean) return;

    if (!customData[activeTab].items[categoryId]) {
      customData[activeTab].items[categoryId] = [];
    }

    customData[activeTab].items[categoryId].push({
      id: makeId("item"),
      text: clean
    });

    saveCustomData();
    render();
  }

  function addCustomCategory(title) {
    const clean = title.trim();
    if (!clean) return;

    const id = makeId("category");

    customData[activeTab].categories.push({
      id,
      title: clean
    });

    customData[activeTab].items[id] = [];
    saveCustomData();
    render();
  }

  function deleteCustomItem(categoryId, itemId, text, itemKey) {
    if (!window.confirm(`「${text}」を削除しますか？`)) return;

    const list = customData[activeTab].items[categoryId] || [];
    customData[activeTab].items[categoryId] = list.filter(item => item.id !== itemId);

    delete checkedState[itemKey];
    saveState();
    saveCustomData();
    render();
  }

  function deleteCustomCategory(categoryId, title) {
    if (!window.confirm(`カテゴリ「${title}」と、その中の追加項目を削除しますか？`)) return;

    const items = customData[activeTab].items[categoryId] || [];
    items.forEach(item => {
      delete checkedState[makeCustomItemKey(activeTab, categoryId, item.id)];
    });

    customData[activeTab].categories =
      customData[activeTab].categories.filter(category => category.id !== categoryId);

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
    addCustomItem(itemCategorySelect.value, itemTextInput.value);
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

  const helpDialog = document.getElementById("helpDialog");
  document.getElementById("installHintBtn").addEventListener("click", () => {
    if (typeof helpDialog.showModal === "function") {
      helpDialog.showModal();
    } else {
      alert("項目をタップするとチェックできます。追加した項目・カテゴリもこの端末に保存されます。");
    }
  });

  render();
})();

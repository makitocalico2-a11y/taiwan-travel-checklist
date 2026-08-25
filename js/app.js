(() => {
  "use strict";

  const STORAGE_KEY = "taiwan-travel-checklist-v1";
  const COLLAPSE_KEY = "taiwan-travel-checklist-collapse-v1";
  const TAB_KEY = "taiwan-travel-checklist-tab-v1";

  const checklistEl = document.getElementById("checklist");
  const progressTextEl = document.getElementById("progressText");
  const progressPercentEl = document.getElementById("progressPercent");
  const progressBarEl = document.getElementById("progressBar");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  let activeTab = localStorage.getItem(TAB_KEY) || "belongings";
  let checkedState = loadJson(STORAGE_KEY, {});
  let collapsedState = loadJson(COLLAPSE_KEY, {});

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
  }

  function saveCollapseState() {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsedState));
  }

  function makeItemKey(tab, categoryId, index) {
    return `${tab}:${categoryId}:${index}`;
  }

  function getActiveCategories() {
    return CHECKLIST_DATA[activeTab] || [];
  }

  function render() {
    tabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === activeTab);
      tab.setAttribute("aria-selected", tab.dataset.tab === activeTab ? "true" : "false");
    });

    const categories = getActiveCategories();
    checklistEl.innerHTML = "";

    if (!categories.length) {
      checklistEl.innerHTML = '<div class="empty">項目がありません。</div>';
      updateProgress();
      return;
    }

    categories.forEach(category => {
      const categoryEl = document.createElement("article");
      categoryEl.className = "category";
      categoryEl.dataset.categoryId = category.id;

      if (collapsedState[`${activeTab}:${category.id}`]) {
        categoryEl.classList.add("collapsed");
      }

      const checkedCount = category.items.reduce((count, _, index) => {
        return count + (checkedState[makeItemKey(activeTab, category.id, index)] ? 1 : 0);
      }, 0);

      const header = document.createElement("button");
      header.type = "button";
      header.className = "category-header";
      header.innerHTML = `
        <span class="category-title">${escapeHtml(category.title)}</span>
        <span class="category-meta">
          <span class="category-count">${checkedCount}/${category.items.length}</span>
          <span class="chevron" aria-hidden="true"></span>
        </span>
      `;
      header.addEventListener("click", () => toggleCategory(categoryEl, category.id));

      const itemsEl = document.createElement("div");
      itemsEl.className = "category-items";

      category.items.forEach((text, index) => {
        const key = makeItemKey(activeTab, category.id, index);
        const label = document.createElement("label");
        label.className = "check-item";
        if (checkedState[key]) label.classList.add("checked");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(checkedState[key]);
        checkbox.dataset.key = key;
        checkbox.addEventListener("change", () => {
          checkedState[key] = checkbox.checked;
          saveState();
          render();
        });

        const span = document.createElement("span");
        span.textContent = text;

        label.append(checkbox, span);
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

  function toggleCategory(categoryEl, categoryId) {
    const key = `${activeTab}:${categoryId}`;
    const isCollapsed = categoryEl.classList.toggle("collapsed");
    collapsedState[key] = isCollapsed;
    saveCollapseState();
  }

  function updateProgress() {
    const categories = getActiveCategories();
    let total = 0;
    let checked = 0;

    categories.forEach(category => {
      category.items.forEach((_, index) => {
        total += 1;
        if (checkedState[makeItemKey(activeTab, category.id, index)]) {
          checked += 1;
        }
      });
    });

    const percent = total ? Math.round((checked / total) * 100) : 0;
    progressTextEl.textContent = `${checked} / ${total}`;
    progressPercentEl.textContent = `${percent}%`;
    progressBarEl.style.width = `${percent}%`;
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
      category.items.forEach((_, index) => {
        delete checkedState[makeItemKey(activeTab, category.id, index)];
      });
    });
    saveState();
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

  document.getElementById("expandAllBtn").addEventListener("click", () => setAllCollapsed(false));
  document.getElementById("collapseAllBtn").addEventListener("click", () => setAllCollapsed(true));
  document.getElementById("resetBtn").addEventListener("click", resetActiveTab);

  const helpDialog = document.getElementById("helpDialog");
  document.getElementById("installHintBtn").addEventListener("click", () => {
    if (typeof helpDialog.showModal === "function") {
      helpDialog.showModal();
    } else {
      alert("項目をタップするとチェックできます。チェック状態はこの端末に保存されます。");
    }
  });

  render();
})();

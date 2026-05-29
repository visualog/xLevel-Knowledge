const GRAPH_POSITIONS_KEY = "xlevel-knowledge-graph-positions";

function loadGraphPositions() {
  try {
    return JSON.parse(localStorage.getItem(GRAPH_POSITIONS_KEY) || "{}");
  } catch {
    return {};
  }
}

const state = {
  data: { version: 1, updatedAt: new Date().toISOString().slice(0, 10), entries: [] },
  selectedId: null,
  selectedTag: "",
  hoveredId: null,
  view: window.location.hash === "#graph" ? "graph" : "cards",
  graphLinks: [],
  graph: {
    scale: 1,
    x: 0,
    y: 0,
    nodes: [],
    bounds: null,
    needsFit: true,
    hasFit: false,
    mode: "overview",
    positions: loadGraphPositions(),
    draggingNodeId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragMoved: false,
    panning: false,
    panMoved: false,
    lastX: 0,
    lastY: 0
  }
};

const els = {
  cards: document.querySelector("#cards"),
  graphPanel: document.querySelector("#graphPanel"),
  graphCanvas: document.querySelector("#graphCanvas"),
  graphViewport: document.querySelector("#graphViewport"),
  graphPreview: document.querySelector("#graphPreview"),
  graphLegend: document.querySelector("#graphLegend"),
  graphSummary: document.querySelector("#graphSummary"),
  graphSearchInput: document.querySelector("#graphSearchInput"),
  graphModeSelect: document.querySelector("#graphModeSelect"),
  graphEmpty: document.querySelector("#graphEmpty"),
  zoomLabel: document.querySelector("#zoomLabel"),
  workspaceTitle: document.querySelector("#workspaceTitle"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  tagFilters: document.querySelector("#tagFilters"),
  densityRange: document.querySelector("#densityRange"),
  entryCount: document.querySelector("#entryCount"),
  linkCount: document.querySelector("#linkCount"),
  topEntryCount: document.querySelector("#topEntryCount"),
  topCategoryCount: document.querySelector("#topCategoryCount"),
  topLinkCount: document.querySelector("#topLinkCount"),
  updatedAt: document.querySelector("#updatedAt"),
  filterSummary: document.querySelector("#filterSummary"),
  resultSummary: document.querySelector("#resultSummary"),
  form: document.querySelector("#entryForm"),
  detailPanel: document.querySelector("#detailPanel"),
  detailTitle: document.querySelector("#detailTitle"),
  detailSummary: document.querySelector("#detailSummary"),
  detailMeta: document.querySelector("#detailMeta"),
  detailConcepts: document.querySelector("#detailConcepts"),
  detailPrinciples: document.querySelector("#detailPrinciples"),
  detailApplications: document.querySelector("#detailApplications"),
  detailConnections: document.querySelector("#detailConnections"),
  editToggleButton: document.querySelector("#editToggleButton"),
  saveFeedback: document.querySelector("#saveFeedback"),
  fileInput: document.querySelector("#fileInput"),
  importButton: document.querySelector("#importButton"),
  exportButton: document.querySelector("#exportButton"),
  newEntryButton: document.querySelector("#newEntryButton"),
  cardsViewButton: document.querySelector("#cardsViewButton"),
  graphViewButton: document.querySelector("#graphViewButton"),
  backToCardsButton: document.querySelector("#backToCardsButton"),
  resetGraphButton: document.querySelector("#resetGraphButton"),
  resetLayoutButton: document.querySelector("#resetLayoutButton"),
  fitGraphButton: document.querySelector("#fitGraphButton"),
  closeInspectorButton: document.querySelector("#closeInspectorButton")
};

const fields = [
  "entryId",
  "title",
  "sourceUrl",
  "author",
  "category",
  "publishedAt",
  "verificationStatus",
  "tags",
  "concepts",
  "summary",
  "principles",
  "applications"
].reduce((acc, id) => {
  acc[id] = document.querySelector(`#${id}`);
  return acc;
}, {});

async function loadData() {
  const stored = localStorage.getItem("xlevel-knowledge");
  let localData = null;
  if (stored) localData = JSON.parse(stored);

  try {
    const response = await fetch("../data/knowledge.json", { cache: "no-store" });
    if (response.ok) {
      const bundledData = await response.json();
      const localCount = localData?.entries?.length || 0;
      const bundledCount = bundledData?.entries?.length || 0;
      const bundledIsNewer = String(bundledData.updatedAt || "") > String(localData?.updatedAt || "");
      state.data = !localData || (localCount === 0 && bundledCount > 0) || bundledIsNewer ? bundledData : localData;
    } else if (localData) {
      state.data = localData;
    }
  } catch (error) {
    console.warn("Could not load bundled knowledge data.", error);
    if (localData) state.data = localData;
  }

  render();
}

function saveLocal() {
  state.data.updatedAt = new Date().toISOString().slice(0, 10);
  localStorage.setItem("xlevel-knowledge", JSON.stringify(state.data, null, 2));
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const categoryRules = [
  ["디자인 시스템", ["디자인시스템", "design system", "token", "component", "variant", "패턴"]],
  ["브랜드 전략", ["브랜드", "brand", "identity", "아이덴티티", "bx", "포지셔닝"]],
  ["UX 디자인", ["ux", "사용자", "여정", "리서치", "경험", "문제정의"]],
  ["UI 디자인", ["ui", "인터페이스", "화면", "레이아웃", "컴포넌트"]],
  ["콘텐츠 전략", ["콘텐츠", "copy", "카피", "메시지", "글쓰기"]],
  ["디자인 프로세스", ["프로세스", "협업", "워크샵", "검증", "의사결정"]]
];

const categoryPalette = [
  "#0b6b5a",
  "#3b6ea8",
  "#9b5c2f",
  "#7559a8",
  "#b64b3b",
  "#4f7d3a",
  "#93633f",
  "#4e6f7f",
  "#7a6f56"
];

function categoryColor(category) {
  const categories = [...new Set(state.data.entries.map((entry) => entry.category || "미분류"))].sort();
  const index = Math.max(0, categories.indexOf(category || "미분류"));
  return categoryPalette[index % categoryPalette.length];
}

function groupColor(group) {
  const value = String(group || "미분류");
  const categoryMatch = state.data.entries.some((entry) => (entry.category || "미분류") === value);
  if (categoryMatch) return categoryColor(value);
  const hash = [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return categoryPalette[hash % categoryPalette.length];
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value.length === 3 ? value.split("").map((char) => char + char).join("") : value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function categoryShortName(category) {
  const explicit = {
    "브랜드 전략": "BX",
    "UX 디자인": "UX",
    "UI 디자인": "UI",
    "디자인 시스템": "DS",
    "콘텐츠 전략": "CT",
    "조직 문화": "EX",
    "개발 경험": "DX",
    "프로덕트 경험": "PX",
    "디자인 프로세스": "PR"
  };
  return explicit[category] || String(category || "KG").slice(0, 2).toUpperCase();
}

function inferCategory(entry) {
  if (entry.category) return entry.category;
  const haystack = [
    entry.title,
    entry.summary,
    ...(entry.tags || []),
    ...(entry.concepts || []),
    ...(entry.principles || [])
  ]
    .join(" ")
    .toLowerCase();

  const match = categoryRules.find(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)));
  return match ? match[0] : "미분류";
}

function enrichEntries(entries) {
  return entries.map((entry) => ({
    ...entry,
    category: inferCategory(entry),
    tags: normalizeList(entry.tags),
    concepts: normalizeList(entry.concepts),
    principles: normalizeList(entry.principles),
    applications: normalizeList(entry.applications),
    connections: normalizeList(entry.connections)
  }));
}

function termSet(entry) {
  const ignoredTerms = new Set([
    "plusx",
    "플엑익힘책",
    "출처 기반 학습",
    "실무 지식화",
    "브랜드 본질",
    "직원 경험",
    "디지털 경험"
  ]);
  return new Set(
    [
      ...(entry.tags || []),
      ...(entry.concepts || [])
    ]
      .filter(Boolean)
      .map((term) => String(term).toLowerCase())
      .filter((term) => !ignoredTerms.has(term))
  );
}

function buildLinks(entries) {
  const links = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const left = entries[i];
      const right = entries[j];
      const leftTerms = termSet(left);
      const rightTerms = termSet(right);
      const shared = [...leftTerms].filter((term) => rightTerms.has(term));
      const explicit =
        (left.connections || []).includes(right.id) ||
        (right.connections || []).includes(left.id) ||
        (left.connections || []).includes(right.title) ||
        (right.connections || []).includes(left.title);
      const weight = shared.length + (explicit ? 3 : 0);
      if (weight > 0) {
        links.push({ source: left.id, target: right.id, weight, shared });
      }
    }
  }
  return links.sort((a, b) => b.weight - a.weight);
}

function slugify(value) {
  return String(value || "knowledge-card")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function filteredEntries() {
  const graphQuery = state.view === "graph" ? els.graphSearchInput.value.trim() : "";
  const query = [els.searchInput.value.trim(), graphQuery].filter(Boolean).join(" ").toLowerCase();
  const category = els.categoryFilter.value;
  const status = els.statusFilter.value;
  const tag = state.selectedTag;

  return state.data.entries.filter((entry) => {
    const searchable = [
      entry.title,
      entry.author,
      entry.category,
      entry.summary,
      ...(entry.tags || []),
      ...(entry.concepts || []),
      ...(entry.principles || [])
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (!category || entry.category === category) &&
      (!status || entry.verificationStatus === status) &&
      (!tag || (entry.tags || []).includes(tag))
    );
  });
}

function renderFilters() {
  const categories = [...new Set(state.data.entries.map((entry) => entry.category).filter(Boolean))].sort();
  const current = els.categoryFilter.value;
  els.categoryFilter.innerHTML = '<option value="">All categories</option>';
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  }
  els.categoryFilter.value = current;

  const tags = [...new Set(state.data.entries.flatMap((entry) => entry.tags || []))]
    .filter((tag) => tag !== "PlusX" && tag !== "플엑익힘책")
    .sort((a, b) => a.localeCompare(b, "ko"));
  els.tagFilters.innerHTML = "";
  const all = document.createElement("button");
  all.type = "button";
  all.className = `chip ${!state.selectedTag ? "is-active" : ""}`;
  all.textContent = "All";
  all.addEventListener("click", () => {
    state.selectedTag = "";
    state.graph.needsFit = true;
    render();
  });
  els.tagFilters.append(all);
  for (const tag of tags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip ${state.selectedTag === tag ? "is-active" : ""}`;
    button.textContent = `#${tag}`;
    button.addEventListener("click", () => {
      state.selectedTag = state.selectedTag === tag ? "" : tag;
      state.graph.needsFit = true;
      render();
    });
    els.tagFilters.append(button);
  }
}

function renderCards() {
  const entries = filteredEntries();
  const links = buildLinks(state.data.entries);
  els.cards.innerHTML = "";
  els.resultSummary.textContent = `${entries.length} of ${state.data.entries.length} cards shown`;

  if (!entries.length) {
    const empty = document.createElement("article");
    empty.className = "card";
    empty.innerHTML = "<h3>No cards yet</h3><p class=\"card__summary\">Add a card or import a knowledge JSON file.</p>";
    els.cards.append(empty);
    return;
  }

  for (const entry of entries) {
    const card = document.createElement("article");
    const status = entry.verificationStatus || "needs-verification";
    const connectionCount = links.filter((link) => link.source === entry.id || link.target === entry.id).length;
    card.className = `card ${entry.id === state.selectedId ? "is-selected" : ""}`;
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="card__top">
        <h3>${escapeHtml(entry.title || "Untitled")}</h3>
        <span class="status status--${escapeHtml(status)}">${escapeHtml(status)}</span>
      </div>
      <p class="card__meta">${escapeHtml(entry.category || "Uncategorized")} · ${escapeHtml(entry.author || "Unknown")} · ${connectionCount} links</p>
      <p class="card__summary">${escapeHtml(entry.summary || "No summary yet.")}</p>
      <div class="card__footer">
        <div class="tags">${(entry.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <span class="card__meta">${escapeHtml(entry.publishedAt || "")}</span>
      </div>
    `;
    card.addEventListener("click", () => selectEntry(entry.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter") selectEntry(entry.id);
    });
    els.cards.append(card);
  }
}

function renderView() {
  const isGraph = state.view === "graph";
  document.body.classList.toggle("is-graph-mode", isGraph);
  document.body.classList.toggle("has-inspector", isGraph && Boolean(state.selectedId));
  els.cards.classList.toggle("is-hidden", isGraph);
  els.graphPanel.classList.toggle("is-hidden", !isGraph);
  els.cardsViewButton.classList.toggle("is-active", !isGraph);
  els.graphViewButton.classList.toggle("is-active", isGraph);
  els.workspaceTitle.textContent = isGraph ? "Knowledge Graph" : "Knowledge Cards";
  if (isGraph) {
    els.resultSummary.textContent = `${filteredEntries().length} cards mapped by category and shared concepts`;
  }
  if (isGraph) {
    state.graph.needsFit = state.graph.needsFit || !state.graph.hasFit;
    renderGraph();
  }
}

function renderStats() {
  const visible = filteredEntries();
  const links = buildLinks(visible);
  const categoryCount = new Set(state.data.entries.map((entry) => entry.category).filter(Boolean)).size;
  els.entryCount.textContent = visible.length;
  els.linkCount.textContent = links.length;
  els.topEntryCount.textContent = state.data.entries.length;
  els.topCategoryCount.textContent = categoryCount;
  els.topLinkCount.textContent = buildLinks(state.data.entries).length;
  els.updatedAt.textContent = state.data.updatedAt || "-";
  const filters = [
    els.searchInput.value.trim() ? "search" : "",
    els.categoryFilter.value || "",
    els.statusFilter.value || "",
    state.selectedTag ? `#${state.selectedTag}` : ""
  ].filter(Boolean);
  els.filterSummary.textContent = filters.length ? `Filtered by ${filters.join(", ")}` : "All knowledge visible";
}

function render() {
  state.data.entries = enrichEntries(state.data.entries);
  renderFilters();
  renderCards();
  renderStats();
  renderDetail();
  renderView();
}

function selectEntry(id) {
  const entry = state.data.entries.find((item) => item.id === id);
  if (!entry) return;
  state.selectedId = id;
  fields.entryId.value = entry.id || "";
  fields.title.value = entry.title || "";
  fields.sourceUrl.value = entry.sourceUrl || "";
  fields.author.value = entry.author || "";
  fields.category.value = entry.category || "";
  fields.publishedAt.value = entry.publishedAt || "";
  fields.verificationStatus.value = entry.verificationStatus || "needs-verification";
  fields.tags.value = (entry.tags || []).join(", ");
  fields.concepts.value = (entry.concepts || []).join("\n");
  fields.summary.value = entry.summary || "";
  fields.principles.value = (entry.principles || []).join("\n");
  fields.applications.value = (entry.applications || []).join("\n");
  renderCards();
  renderDetail();
  if (state.view === "graph") {
    document.body.classList.add("has-inspector");
    if (state.graph.mode === "local") state.graph.needsFit = true;
    renderGraph();
  }
}

function newEntry() {
  state.selectedId = null;
  els.form.reset();
  fields.entryId.value = "";
  fields.verificationStatus.value = "needs-verification";
  els.form.classList.remove("is-collapsed");
  renderDetail();
  fields.title.focus();
}

function upsertEntry(event) {
  event.preventDefault();
  const existingId = fields.entryId.value || state.selectedId;
  const id = existingId || slugify(fields.title.value);
  const entry = {
    id,
    title: fields.title.value.trim(),
    sourceUrl: fields.sourceUrl.value.trim(),
    sourceName: "Brunch",
    author: fields.author.value.trim(),
    publishedAt: fields.publishedAt.value,
    accessedAt: new Date().toISOString().slice(0, 10),
    category: fields.category.value.trim(),
    tags: normalizeList(fields.tags.value),
    summary: fields.summary.value.trim(),
    concepts: normalizeList(fields.concepts.value),
    principles: normalizeList(fields.principles.value),
    applications: normalizeList(fields.applications.value),
    connections: [],
    verificationStatus: fields.verificationStatus.value
  };

  entry.category = inferCategory(entry);
  const index = state.data.entries.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.data.entries[index] = { ...state.data.entries[index], ...entry };
  } else {
    state.data.entries.unshift(entry);
  }

  state.selectedId = id;
  state.graph.needsFit = true;
  fields.entryId.value = id;
  saveLocal();
  showSaveFeedback("Saved locally");
  render();
}

function renderDetail() {
  const entry = state.data.entries.find((item) => item.id === state.selectedId);
  const isEditing = !els.form.classList.contains("is-collapsed");
  els.editToggleButton.textContent = isEditing ? "Close" : "Edit";

  if (!entry) {
    els.detailTitle.textContent = "선택된 카드가 없습니다";
    els.detailSummary.textContent = "카드나 그래프 노드를 선택하면 개념, 원칙, 연결 항목을 여기에서 확인할 수 있습니다.";
    els.detailMeta.innerHTML = "";
    els.detailConcepts.innerHTML = "";
    els.detailPrinciples.innerHTML = "";
    els.detailApplications.innerHTML = "";
    els.detailConnections.innerHTML = "";
    return;
  }

  els.detailTitle.textContent = entry.title || "Untitled";
  els.detailSummary.textContent = entry.summary || "No summary yet.";
  els.detailMeta.innerHTML = `
    <dt>Category</dt><dd>${escapeHtml(entry.category || "-")}</dd>
    <dt>Source</dt><dd>${entry.sourceUrl ? `<a href="${escapeHtml(entry.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(entry.sourceName || "Source")}</a>` : "-"}</dd>
    <dt>Published</dt><dd>${escapeHtml(entry.publishedAt || "-")}</dd>
    <dt>Status</dt><dd>${escapeHtml(entry.verificationStatus || "needs-verification")}</dd>
  `;
  els.detailConcepts.innerHTML = (entry.concepts || []).map((concept) => `<span class="pill">${escapeHtml(concept)}</span>`).join("");
  els.detailPrinciples.innerHTML = (entry.principles || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  els.detailApplications.innerHTML = (entry.applications || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  els.detailConnections.innerHTML = (entry.connections || [])
    .map((id) => {
      const target = state.data.entries.find((item) => item.id === id);
      return target ? `<button class="connection" type="button" data-id="${escapeHtml(id)}">${escapeHtml(target.title)}</button>` : "";
    })
    .join("");
  els.detailConnections.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectEntry(button.dataset.id));
  });
}

function showSaveFeedback(message) {
  els.saveFeedback.textContent = message;
  window.clearTimeout(showSaveFeedback.timer);
  showSaveFeedback.timer = window.setTimeout(() => {
    els.saveFeedback.textContent = "";
  }, 1800);
}

function graphGroupKey(entry, mode) {
  if (mode === "source") return entry.sourceName || entry.author || "Unknown source";
  if (mode === "concept") return (entry.concepts || [])[0] || (entry.tags || [])[0] || "Unmapped concept";
  if (mode === "timeline") return String(entry.publishedAt || entry.accessedAt || "Undated").slice(0, 4);
  return entry.category || "미분류";
}

function graphLayout(entries, links, mode = "overview") {
  const categories = [...new Set(entries.map((entry) => graphGroupKey(entry, mode)))];
  const radiusBase = mode === "cluster" ? 92 : 70;
  const radius = Math.max(mode === "local" ? 180 : 260, Math.sqrt(Math.max(entries.length, 1)) * radiusBase);
  const groups = new Map();
  entries.forEach((entry) => {
    const category = graphGroupKey(entry, mode);
    groups.set(category, [...(groups.get(category) || []), entry.id]);
  });
  const centers = new Map(
    categories.map((category, index) => {
      if (mode === "timeline") {
        return [category, { x: (index - (categories.length - 1) / 2) * 220, y: 0 }];
      }
      const angle = (Math.PI * 2 * index) / Math.max(categories.length, 1);
      const spreadX = mode === "cluster" ? 0.82 : 0.62;
      const spreadY = mode === "cluster" ? 0.56 : 0.42;
      return [category, { x: Math.cos(angle) * radius * spreadX, y: Math.sin(angle) * radius * spreadY }];
    })
  );

  const linkedWeight = new Map(entries.map((entry) => [entry.id, 0]));
  for (const link of links) {
    linkedWeight.set(link.source, (linkedWeight.get(link.source) || 0) + link.weight);
    linkedWeight.set(link.target, (linkedWeight.get(link.target) || 0) + link.weight);
  }

  return entries.map((entry, index) => {
    const category = graphGroupKey(entry, mode);
    const center = centers.get(category) || { x: 0, y: 0 };
    const group = groups.get(category) || [];
    const groupIndex = group.indexOf(entry.id);
    const groupSize = Math.max(group.length, 1);
    const angle = mode === "local" ? (Math.PI * 2 * groupIndex) / groupSize : (Math.PI * 2 * groupIndex) / groupSize + index * 0.19;
    const ring = Math.floor(groupIndex / (mode === "cluster" ? 6 : 8));
    const spread = mode === "timeline" ? 62 + (groupIndex % 5) * 24 : 58 + ring * (mode === "cluster" ? 72 : 54) + (groupIndex % 3) * 9;
    const autoX = mode === "timeline" ? center.x + Math.cos(angle) * spread * 0.5 : center.x + Math.cos(angle) * spread;
    const autoY = mode === "timeline" ? (index % 2 ? 1 : -1) * spread + Math.sin(angle) * 20 : center.y + Math.sin(angle) * spread;
    const saved = state.graph.positions[entry.id];
    return {
      ...entry,
      x: saved?.x ?? autoX,
      y: saved?.y ?? autoY,
      r: Math.min(28, 13 + Math.sqrt(linkedWeight.get(entry.id) || 0) * 3.4),
      importance: linkedWeight.get(entry.id) || 0,
      graphGroup: category,
      isManual: Boolean(saved)
    };
  });
}

function setGraphTransform() {
  els.graphViewport.setAttribute("transform", `translate(${state.graph.x} ${state.graph.y}) scale(${state.graph.scale})`);
  els.zoomLabel.textContent = `${Math.round(state.graph.scale * 100)}%`;
}

function screenToWorld(event) {
  const box = els.graphCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left - state.graph.x) / state.graph.scale,
    y: (event.clientY - box.top - state.graph.y) / state.graph.scale
  };
}

function graphBounds(nodes) {
  if (!nodes.length) return null;
  const labelPadX = 92;
  const labelPadY = 38;
  return nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.x - node.r - labelPadX),
      maxX: Math.max(bounds.maxX, node.x + node.r + labelPadX),
      minY: Math.min(bounds.minY, node.y - node.r - labelPadY),
      maxY: Math.max(bounds.maxY, node.y + node.r + labelPadY)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
}

function fitGraph() {
  const box = els.graphCanvas.getBoundingClientRect();
  const bounds = state.graph.bounds || graphBounds(state.graph.nodes);
  if (!bounds || !box.width || !box.height) {
    state.graph.x = box.width / 2;
    state.graph.y = box.height / 2;
    state.graph.scale = 1;
    setGraphTransform();
    return;
  }

  const padding = box.width < 760 ? 28 : 56;
  const graphWidth = Math.max(1, bounds.maxX - bounds.minX);
  const graphHeight = Math.max(1, bounds.maxY - bounds.minY);
  const availableWidth = Math.max(1, box.width - padding * 2);
  const availableHeight = Math.max(1, box.height - padding * 2);
  const nextScale = Math.min(1.18, Math.max(0.32, Math.min(availableWidth / graphWidth, availableHeight / graphHeight)));
  state.graph.scale = nextScale;
  state.graph.x = (box.width - graphWidth * nextScale) / 2 - bounds.minX * nextScale;
  state.graph.y = (box.height - graphHeight * nextScale) / 2 - bounds.minY * nextScale;
  state.graph.needsFit = false;
  state.graph.hasFit = true;
  setGraphTransform();
}

function renderGraph() {
  state.graph.mode = els.graphModeSelect.value || state.graph.mode || "overview";
  els.graphPanel.dataset.mode = state.graph.mode;
  let entries = filteredEntries();
  const entryIds = new Set(entries.map((entry) => entry.id));
  let allLinks = buildLinks(entries).filter((link) => entryIds.has(link.source) && entryIds.has(link.target));
  const localModeWithoutSelection = state.graph.mode === "local" && (!state.selectedId || !entryIds.has(state.selectedId));
  if (state.graph.mode === "local" && state.selectedId && entryIds.has(state.selectedId)) {
    const focusIds = new Set([state.selectedId]);
    for (const link of allLinks) {
      if (link.source === state.selectedId) focusIds.add(link.target);
      if (link.target === state.selectedId) focusIds.add(link.source);
    }
    entries = entries.filter((entry) => focusIds.has(entry.id));
    const localIds = new Set(entries.map((entry) => entry.id));
    allLinks = buildLinks(entries).filter((link) => localIds.has(link.source) && localIds.has(link.target));
  }
  if (localModeWithoutSelection) {
    entries = [];
    allLinks = [];
  }
  const density = Number(els.densityRange.value || 120);
  const links = allLinks.slice(0, density);
  const nodes = graphLayout(entries, links, state.graph.mode);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const selectedVisible = state.selectedId && nodeMap.has(state.selectedId);
  const selectedNeighbors = new Set();
  if (selectedVisible) {
    for (const link of links) {
      if (link.source === state.selectedId) selectedNeighbors.add(link.target);
      if (link.target === state.selectedId) selectedNeighbors.add(link.source);
    }
  }
  els.graphViewport.innerHTML = "";
  state.graphLinks = links;
  state.graph.nodes = nodes;
  state.graph.bounds = graphBounds(nodes);
  els.graphSummary.textContent = `${nodes.length} nodes · ${links.length} visible links · ${allLinks.length} total`;
  els.graphEmpty.classList.toggle("is-hidden", !localModeWithoutSelection);
  els.zoomLabel.textContent = `${Math.round(state.graph.scale * 100)}%`;
  renderGraphLegend(nodes);

  const clusterLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  clusterLayer.setAttribute("class", "graph-clusters");
  for (const category of [...new Set(nodes.map((node) => node.graphGroup || node.category || "미분류"))]) {
    const group = nodes.filter((node) => (node.graphGroup || node.category || "미분류") === category);
    if (!group.length) continue;
    const x = group.reduce((sum, node) => sum + node.x, 0) / group.length;
    const y = group.reduce((sum, node) => sum + node.y, 0) / group.length;
    const maxDx = Math.max(...group.map((node) => Math.abs(node.x - x) + node.r));
    const maxDy = Math.max(...group.map((node) => Math.abs(node.y - y) + node.r));
    const color = groupColor(category);
    const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    ellipse.setAttribute("class", "graph-cluster");
    ellipse.setAttribute("cx", x);
    ellipse.setAttribute("cy", y);
    ellipse.setAttribute("rx", Math.max(96, maxDx + 62));
    ellipse.setAttribute("ry", Math.max(74, maxDy + 52));
    ellipse.setAttribute("fill", hexToRgba(color, state.graph.mode === "cluster" ? 0.1 : 0.07));
    ellipse.setAttribute("stroke", hexToRgba(color, state.graph.mode === "cluster" ? 0.28 : 0.18));
    clusterLayer.append(ellipse);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "graph-cluster-label");
    label.setAttribute("x", x);
    label.setAttribute("y", y - Math.max(74, maxDy + 52) + 20);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", hexToRgba(color, 0.72));
    label.textContent = category;
    clusterLayer.append(label);
  }
  els.graphViewport.append(clusterLayer);

  const linkLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  linkLayer.setAttribute("class", "graph-links");
  for (const link of links) {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    if (!source || !target) continue;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const selectedRelated = selectedVisible && (link.source === state.selectedId || link.target === state.selectedId);
    const muted = selectedVisible && !selectedRelated;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const curve = Math.min(32, distance * 0.08) * ((source.id > target.id ? 1 : -1));
    const cx = (source.x + target.x) / 2 + (-dy / distance) * curve;
    const cy = (source.y + target.y) / 2 + (dx / distance) * curve;
    path.setAttribute("class", `graph-link ${link.weight >= 3 ? "graph-link--strong" : ""} ${selectedRelated ? "is-neighbor" : ""} ${muted ? "is-muted" : ""}`);
    path.setAttribute("d", `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`);
    path.setAttribute("stroke-width", Math.min(2.8, 0.55 + link.weight * 0.24));
    path.dataset.source = link.source;
    path.dataset.target = link.target;
    path.dataset.shared = link.shared.join(", ");
    linkLayer.append(path);
  }
  els.graphViewport.append(linkLayer);

  const nodeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  for (const node of nodes) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const selected = selectedVisible && node.id === state.selectedId;
    const neighbor = selectedNeighbors.has(node.id);
    const muted = selectedVisible && !selected && !neighbor;
    group.setAttribute("class", `graph-node ${selected ? "is-selected" : ""} ${neighbor ? "is-neighbor" : ""} ${muted ? "is-muted" : ""}`);
    group.setAttribute("transform", `translate(${node.x} ${node.y})`);
    group.setAttribute("tabindex", "0");
    group.dataset.id = node.id;
    group.addEventListener("pointerdown", (event) => startNodeDrag(event, node));
    group.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.graph.dragMoved) return;
      selectEntry(node.id);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter") selectEntry(node.id);
    });
    group.addEventListener("pointerenter", (event) => {
      applyGraphFocus(node.id, true);
      showGraphPreview(event, node);
    });
    group.addEventListener("pointermove", (event) => moveGraphPreview(event));
    group.addEventListener("pointerleave", () => {
      applyGraphFocus(selectedVisible ? state.selectedId : null, false);
      hideGraphPreview();
    });

    const color = categoryColor(node.category);
    const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    halo.setAttribute("class", "graph-node__halo");
    halo.setAttribute("r", node.r + 7);
    halo.setAttribute("fill", hexToRgba(color, 0.08));
    group.append(halo);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "graph-node__core");
    circle.setAttribute("r", node.r);
    circle.setAttribute("stroke", color);
    group.append(circle);

    const glyph = document.createElementNS("http://www.w3.org/2000/svg", "text");
    glyph.setAttribute("class", "graph-node__glyph");
    glyph.setAttribute("text-anchor", "middle");
    glyph.setAttribute("y", 4);
    glyph.textContent = categoryShortName(node.category);
    group.append(glyph);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", `graph-node__label ${node.importance >= 14 ? "is-visible" : ""}`);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("y", node.r + 18);
    label.textContent = truncate(node.title || "Untitled", 22);
    group.append(label);

    nodeLayer.append(group);
  }
  els.graphViewport.append(nodeLayer);

  if (state.graph.needsFit || !state.graph.hasFit) {
    fitGraph();
  } else {
    setGraphTransform();
  }
  applyGraphFocus(selectedVisible ? state.selectedId : null, false);
}

function renderGraphLegend(nodes) {
  const counts = new Map();
  for (const node of nodes) {
    const group = node.graphGroup || node.category || "미분류";
    counts.set(group, (counts.get(group) || 0) + 1);
  }
  els.graphLegend.innerHTML = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => {
      const color = groupColor(category);
      return `<span class="legend-item"><i style="background:${escapeHtml(color)}"></i>${escapeHtml(category)} <b>${count}</b></span>`;
    })
    .join("");
}

function applyGraphFocus(focusId, transient) {
  const nodeEls = [...els.graphViewport.querySelectorAll(".graph-node")];
  const linkEls = [...els.graphViewport.querySelectorAll(".graph-link")];
  nodeEls.forEach((node) => {
    node.classList.remove("is-hovered", "is-neighbor", "is-muted");
  });
  linkEls.forEach((link) => {
    link.classList.remove("is-neighbor", "is-muted");
  });

  if (!focusId) return;

  const neighbors = new Set();
  linkEls.forEach((link) => {
    const related = link.dataset.source === focusId || link.dataset.target === focusId;
    if (related) {
      link.classList.add("is-neighbor");
      neighbors.add(link.dataset.source === focusId ? link.dataset.target : link.dataset.source);
    } else {
      link.classList.add("is-muted");
    }
  });

  nodeEls.forEach((node) => {
    const isFocus = node.dataset.id === focusId;
    const isNeighbor = neighbors.has(node.dataset.id);
    node.classList.toggle("is-hovered", transient && isFocus);
    node.classList.toggle("is-neighbor", isNeighbor);
    if (!isFocus && !isNeighbor) node.classList.add("is-muted");
  });
}

function showGraphPreview(event, node) {
  const connections = state.graphLinks.filter((link) => link.source === node.id || link.target === node.id).length;
  els.graphPreview.innerHTML = `
    <strong>${escapeHtml(node.title || "Untitled")}</strong>
    <span>${escapeHtml(node.category || "Uncategorized")} · ${connections} links · ${(node.tags || []).slice(0, 3).map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span>
  `;
  els.graphPreview.classList.remove("is-hidden");
  moveGraphPreview(event);
}

function moveGraphPreview(event) {
  const box = els.graphPanel.getBoundingClientRect();
  els.graphPreview.style.left = `${Math.min(box.width - 300, Math.max(12, event.clientX - box.left + 14))}px`;
  els.graphPreview.style.top = `${Math.min(box.height - 120, Math.max(62, event.clientY - box.top + 14))}px`;
}

function hideGraphPreview() {
  els.graphPreview.classList.add("is-hidden");
}

function persistGraphPositions() {
  localStorage.setItem(GRAPH_POSITIONS_KEY, JSON.stringify(state.graph.positions));
}

function startNodeDrag(event, node) {
  event.preventDefault();
  event.stopPropagation();
  const point = screenToWorld(event);
  state.graph.draggingNodeId = node.id;
  state.graph.dragOffsetX = point.x - node.x;
  state.graph.dragOffsetY = point.y - node.y;
  state.graph.dragMoved = false;
  state.graph.lastX = event.clientX;
  state.graph.lastY = event.clientY;
  if (state.selectedId !== node.id) selectEntry(node.id);
  els.graphCanvas.setPointerCapture(event.pointerId);
}

function dragNode(event) {
  const id = state.graph.draggingNodeId;
  if (!id) return false;
  const movement = Math.hypot(event.clientX - state.graph.lastX, event.clientY - state.graph.lastY);
  if (movement > 2) state.graph.dragMoved = true;
  const point = screenToWorld(event);
  state.graph.positions[id] = {
    x: Math.round(point.x - state.graph.dragOffsetX),
    y: Math.round(point.y - state.graph.dragOffsetY)
  };
  state.graph.needsFit = false;
  state.graph.lastX = event.clientX;
  state.graph.lastY = event.clientY;
  renderGraph();
  return true;
}

function finishNodeDrag() {
  if (!state.graph.draggingNodeId) return;
  persistGraphPositions();
  state.graph.draggingNodeId = null;
  window.setTimeout(() => {
    state.graph.dragMoved = false;
  }, 0);
}

function clearGraphSelection() {
  state.selectedId = null;
  document.body.classList.remove("has-inspector");
  renderDetail();
  if (state.view === "graph") {
    if (state.graph.mode === "local") state.graph.needsFit = true;
    renderGraph();
  }
}

function resetGraphLayout() {
  state.graph.positions = {};
  localStorage.removeItem(GRAPH_POSITIONS_KEY);
  state.graph.needsFit = true;
  renderGraph();
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "knowledge.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    state.data = JSON.parse(reader.result);
    state.graph.needsFit = true;
    state.graph.hasFit = false;
    saveLocal();
    render();
  };
  reader.readAsText(file);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function handleFilterChange() {
  state.graph.needsFit = true;
  renderCards();
  renderStats();
  renderView();
}

els.searchInput.addEventListener("input", handleFilterChange);
els.graphSearchInput.addEventListener("input", handleFilterChange);
els.categoryFilter.addEventListener("change", handleFilterChange);
els.statusFilter.addEventListener("change", handleFilterChange);
els.densityRange.addEventListener("input", () => state.view === "graph" && renderGraph());
els.graphModeSelect.addEventListener("change", () => {
  state.graph.mode = els.graphModeSelect.value;
  state.graph.needsFit = true;
  if (state.view === "graph") renderGraph();
});
els.form.addEventListener("submit", upsertEntry);
els.newEntryButton.addEventListener("click", newEntry);
els.editToggleButton.addEventListener("click", () => {
  if (!state.selectedId && els.form.classList.contains("is-collapsed")) return;
  if (state.view === "graph") {
    state.view = "cards";
    history.replaceState(null, "", window.location.pathname + window.location.search);
    els.form.classList.remove("is-collapsed");
    renderView();
    renderDetail();
    return;
  }
  els.form.classList.toggle("is-collapsed");
  renderDetail();
});
els.cardsViewButton.addEventListener("click", () => {
  state.view = "cards";
  history.replaceState(null, "", window.location.pathname + window.location.search);
  renderView();
});
els.backToCardsButton.addEventListener("click", () => {
  state.view = "cards";
  history.replaceState(null, "", window.location.pathname + window.location.search);
  renderView();
});
els.graphViewButton.addEventListener("click", () => {
  state.view = "graph";
  state.graph.needsFit = true;
  history.replaceState(null, "", "#graph");
  renderView();
});
els.resetGraphButton.addEventListener("click", () => {
  state.graph.needsFit = true;
  fitGraph();
});
els.resetLayoutButton.addEventListener("click", resetGraphLayout);
els.fitGraphButton.addEventListener("click", fitGraph);
els.closeInspectorButton.addEventListener("click", clearGraphSelection);
els.graphCanvas.addEventListener("pointerdown", (event) => {
  if (event.target !== els.graphCanvas) return;
  state.graph.panning = true;
  state.graph.panMoved = false;
  state.graph.lastX = event.clientX;
  state.graph.lastY = event.clientY;
  els.graphCanvas.classList.add("is-panning");
  els.graphCanvas.setPointerCapture(event.pointerId);
});
els.graphCanvas.addEventListener("pointermove", (event) => {
  if (dragNode(event)) return;
  if (!state.graph.panning) return;
  if (Math.hypot(event.clientX - state.graph.lastX, event.clientY - state.graph.lastY) > 2) state.graph.panMoved = true;
  state.graph.x += event.clientX - state.graph.lastX;
  state.graph.y += event.clientY - state.graph.lastY;
  state.graph.lastX = event.clientX;
  state.graph.lastY = event.clientY;
  setGraphTransform();
});
els.graphCanvas.addEventListener("pointerup", () => {
  finishNodeDrag();
  state.graph.panning = false;
  els.graphCanvas.classList.remove("is-panning");
});
els.graphCanvas.addEventListener("pointercancel", () => {
  finishNodeDrag();
  state.graph.panning = false;
  els.graphCanvas.classList.remove("is-panning");
});
els.graphCanvas.addEventListener("click", (event) => {
  if (event.target === els.graphCanvas && !state.graph.panMoved) clearGraphSelection();
  state.graph.panMoved = false;
});
els.graphCanvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const box = els.graphCanvas.getBoundingClientRect();
  const cursorX = event.clientX - box.left;
  const cursorY = event.clientY - box.top;
  const worldX = (cursorX - state.graph.x) / state.graph.scale;
  const worldY = (cursorY - state.graph.y) / state.graph.scale;
  const nextScale = Math.max(0.24, Math.min(2.8, state.graph.scale * (event.deltaY > 0 ? 0.92 : 1.08)));
  state.graph.x = cursorX - worldX * nextScale;
  state.graph.y = cursorY - worldY * nextScale;
  state.graph.scale = nextScale;
  setGraphTransform();
});
els.exportButton.addEventListener("click", exportData);
els.importButton.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importData(file);
});
window.addEventListener("hashchange", () => {
  state.view = window.location.hash === "#graph" ? "graph" : "cards";
  state.graph.needsFit = state.view === "graph";
  renderView();
});
window.addEventListener("keydown", (event) => {
  if (state.view !== "graph") return;
  if (event.key === "Escape") {
    clearGraphSelection();
    return;
  }
  if (event.key === "0") {
    event.preventDefault();
    fitGraph();
  }
});

loadData();

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_KNOWLEDGE_PATH = path.join(repoRoot, "knowledge/data/knowledge.json");
const DEFAULT_CANDIDATES_PATH = path.join(repoRoot, "knowledge/data/candidates.json");
const DEFAULT_QUERY_OUT_PATH = path.join(repoRoot, "knowledge/data/discovery-queries.json");
const TODAY = localIsoDate();

const ADJACENT_TOPICS = {
  "브랜드 전략": ["브랜드 아키텍처", "포지셔닝 리서치", "브랜드 거버넌스", "브랜드 측정"],
  "UX 디자인": ["사용자 리서치", "정보구조", "사용성 테스트", "서비스 블루프린트"],
  "UI 디자인": ["인터랙션 패턴", "컴포넌트 접근성", "반응형 레이아웃", "시각 계층"],
  "디자인 시스템": ["디자인 토큰", "컴포넌트 거버넌스", "접근성 기준", "패턴 라이브러리"],
  "콘텐츠 전략": ["콘텐츠 모델링", "UX 라이팅", "메시지 체계", "정보 설계"],
  "디자인 프로세스": ["디자인 크리틱", "의사결정 프레임", "협업 워크숍", "검증 루프"],
  "프로덕트 경험": ["제품 원칙", "온보딩 경험", "사용자 활성화", "프로덕트 지표"],
  "조직 문화": ["팀 운영 원칙", "지식 공유", "리더십 커뮤니케이션", "피드백 문화"],
  "개발 경험": ["디자인-개발 핸드오프", "프론트엔드 품질", "문서화 자동화", "개발자 경험"]
};

const SOURCE_HINTS = [
  "official documentation",
  "case study",
  "research article",
  "design system guide",
  "practical framework"
];
const STOP_TERMS = new Set(["plusx", "플엑익힘책", "출처 기반 학습", "실무 지식화"]);

function parseArgs(argv) {
  const args = {
    knowledgePath: DEFAULT_KNOWLEDGE_PATH,
    outPath: DEFAULT_CANDIDATES_PATH,
    sourceFile: "",
    feedFile: "",
    urls: [],
    urlFile: "",
    queryOutPath: "",
    limit: 20,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--limit") {
      args.limit = Number(argv[index + 1] || args.limit);
      index += 1;
    } else if (value === "--out") {
      args.outPath = path.resolve(repoRoot, argv[index + 1] || args.outPath);
      index += 1;
    } else if (value === "--knowledge") {
      args.knowledgePath = path.resolve(repoRoot, argv[index + 1] || args.knowledgePath);
      index += 1;
    } else if (value === "--source-file") {
      args.sourceFile = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
    } else if (value === "--feed-file") {
      const next = argv[index + 1] || "";
      args.feedFile = /^https?:\/\//.test(next) ? next : path.resolve(repoRoot, next);
      index += 1;
    } else if (value === "--url") {
      const next = argv[index + 1] || "";
      args.urls.push(resolveSourceReference(next));
      index += 1;
    } else if (value === "--url-file") {
      args.urlFile = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
    } else if (value === "--query-out") {
      const next = argv[index + 1] || DEFAULT_QUERY_OUT_PATH;
      args.queryOutPath = path.resolve(repoRoot, next);
      index += 1;
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) args.limit = 20;
  return args;
}

function resolveSourceReference(value) {
  if (/^https?:\/\//.test(value)) return value;
  return path.resolve(repoRoot, value);
}

function localIsoDate(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 88) || "candidate";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function queryText(values, suffix = "") {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .concat(suffix ? [suffix] : [])
    .join(" ");
}

function clampScore(value) {
  return Number(Math.max(0.01, Math.min(0.99, value)).toFixed(2));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function termSet(entry) {
  return new Set([...(entry.tags || []), ...(entry.concepts || [])].map(normalizeText).filter(Boolean));
}

function overlapScore(leftTerms, rightTerms) {
  if (!leftTerms.size || !rightTerms.size) return 0;
  const shared = [...leftTerms].filter((term) => rightTerms.has(term)).length;
  return shared / Math.max(leftTerms.size, rightTerms.size);
}

function buildConnectionCounts(entries) {
  const counts = new Map(entries.map((entry) => [entry.id, 0]));
  const ids = new Set(entries.map((entry) => entry.id));

  for (const entry of entries) {
    for (const connection of entry.connections || []) {
      if (ids.has(connection)) {
        counts.set(entry.id, (counts.get(entry.id) || 0) + 1);
        counts.set(connection, (counts.get(connection) || 0) + 1);
      }
    }
  }

  return counts;
}

function countTerms(entries, key) {
  const counts = new Map();
  for (const entry of entries) {
    for (const value of entry[key] || []) {
      const normalized = normalizeText(value);
      if (!normalized || STOP_TERMS.has(normalized) || STOP_TERMS.has(value)) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
}

function topEntriesByCategory(entries) {
  return entries.reduce((acc, entry) => {
    const category = entry.category || "미분류";
    acc.set(category, [...(acc.get(category) || []), entry]);
    return acc;
  }, new Map());
}

function linkCandidate(candidate, entries) {
  const candidateTerms = new Set([...(candidate.tags || []), ...(candidate.concepts || [])].map(normalizeText));
  const ranked = entries
    .map((entry) => {
      const sameCategory = entry.category === candidate.category ? 0.25 : 0;
      const termOverlap = overlapScore(candidateTerms, termSet(entry));
      const titleOverlap = normalizeText(candidate.title).includes(normalizeText(entry.category)) ? 0.05 : 0;
      return { entry, score: termOverlap + sameCategory + titleOverlap };
    })
    .filter((item) => item.score > 0.12)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, 5);

  return ranked.map((item) => item.entry.id);
}

function duplicateScore(candidate, entries, existingCandidates) {
  const candidateTitle = normalizeText(candidate.title);
  const candidateTerms = new Set([...(candidate.tags || []), ...(candidate.concepts || [])].map(normalizeText));
  const pools = [
    ...entries.map((entry) => ({ title: entry.title, sourceUrl: entry.sourceUrl, terms: termSet(entry) })),
    ...existingCandidates.map((entry) => ({
      title: entry.title,
      sourceUrl: entry.sourceUrl,
      terms: new Set([...(entry.tags || []), ...(entry.concepts || [])].map(normalizeText))
    }))
  ];

  let score = 0;
  for (const item of pools) {
    const title = normalizeText(item.title);
    if (candidate.sourceUrl && item.sourceUrl && candidate.sourceUrl === item.sourceUrl) score = Math.max(score, 0.98);
    if (title && (title === candidateTitle || title.includes(candidateTitle) || candidateTitle.includes(title))) {
      score = Math.max(score, 0.88);
    }
    score = Math.max(score, overlapScore(candidateTerms, item.terms) * 0.72);
  }
  return clampScore(score);
}

function makeCandidate({ kind, title, category, tags, concepts, seedEntries, query, reason, relevanceBase, trustBase }) {
  const discoveredFrom = unique(seedEntries.map((entry) => entry.id)).slice(0, 5);
  return {
    id: `candidate-${slugify(title)}`,
    title,
    sourceUrl: "",
    sourceName: "Discovery candidate",
    author: "xLevel Knowledge Agent",
    publishedAt: "",
    accessedAt: TODAY,
    category,
    tags: unique(tags).slice(0, 6),
    summary: `${title} 자료를 찾아 현재 지식 그래프의 ${category} 판단 기준을 보강한다. 이 후보는 자동 수집 전 검토가 필요한 탐색 항목이다.`,
    concepts: unique(concepts).slice(0, 8),
    principles: [
      "원문을 복제하지 않고 프로젝트 판단 기준으로 재구성한다.",
      "출처 신뢰도와 실무 적용 가능성을 함께 확인한다.",
      "기존 지식과 연결되는 개념, 원칙, 적용 상황을 분리해 저장한다."
    ],
    applications: [
      "프로젝트 킥오프 전 관련 사례 탐색",
      "디자인 리뷰에서 판단 기준 보강",
      "기존 지식 그래프의 약한 연결 보완"
    ],
    connections: discoveredFrom,
    verificationStatus: "review-needed",
    candidateMeta: {
      kind,
      discoveredFrom,
      query,
      relevanceScore: clampScore(relevanceBase),
      trustScore: clampScore(trustBase),
      duplicateScore: 0,
      reason
    }
  };
}

function candidateFromSource(source, entries) {
  const category = source.category || "미분류";
  const title = source.title || source.sourceUrl || "Untitled source";
  const sourceKindTag = source.candidateTag === false ? "" : source.candidateTag || "curated-source";
  const seedEntries = entries
    .filter((entry) => !category || entry.category === category)
    .slice(0, 5);
  return {
    id: `candidate-${slugify(title)}`,
    title,
    sourceUrl: source.sourceUrl || source.url || "",
    sourceName: source.sourceName || source.publisher || "Curated source",
    author: source.author || "",
    publishedAt: source.publishedAt || "",
    accessedAt: TODAY,
    category,
    tags: unique([...(source.tags || []), sourceKindTag]).slice(0, 6),
    summary:
      source.summary ||
      `${title} source metadata was added through a curated source file and needs source verification before durable use.`,
    concepts: unique([...(source.concepts || []), category, "source review"]).slice(0, 8),
    principles: unique(source.principles || [
      "출처 메타데이터와 해석을 분리해서 저장한다.",
      "원문을 복제하지 않고 실무 판단 기준으로 재구성한다.",
      "검증 전에는 출처별 사실을 needs-verification 상태로 유지한다."
    ]),
    applications: unique(source.applications || [
      "외부 자료 후보 검토",
      "프로젝트 판단 기준 보강",
      "기존 지식 그래프 연결 확장"
    ]),
    connections: unique([...(source.connections || []), ...seedEntries.map((entry) => entry.id)]).slice(0, 5),
    verificationStatus: "review-needed",
    candidateMeta: {
      kind: "curated-source",
      discoveredFrom: seedEntries.map((entry) => entry.id).slice(0, 5),
      query: source.query || `${title} ${category} source review`,
      relevanceScore: clampScore(source.relevanceScore || 0.72),
      trustScore: clampScore(source.trustScore || 0.58),
      duplicateScore: 0,
      reason: source.reason || "Added from a curated source metadata file for review-first ingestion."
    }
  };
}

function decodeXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function xmlTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] || "");
}

function xmlAttr(block, tag, attr) {
  const match = block.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return decodeXml(match?.[1] || "");
}

function stripHtml(value) {
  return decodeXml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function htmlTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return stripHtml(match?.[1] || "");
}

function htmlAttr(block, attr) {
  const match = block.match(new RegExp(`\\s${attr}=["']([^"']+)["']`, "i"));
  return decodeXml(match?.[1] || "");
}

function htmlMeta(html, names) {
  const values = Array.isArray(names) ? names : [names];
  for (const meta of html.matchAll(/<meta\b[^>]*>/gi)) {
    const block = meta[0];
    const key = htmlAttr(block, "name") || htmlAttr(block, "property") || htmlAttr(block, "itemprop");
    if (values.some((value) => key.toLowerCase() === value.toLowerCase())) {
      const content = htmlAttr(block, "content");
      if (content) return stripHtml(content);
    }
  }
  return "";
}

function htmlLink(html, rel) {
  for (const link of html.matchAll(/<link\b[^>]*>/gi)) {
    const block = link[0];
    if (htmlAttr(block, "rel").toLowerCase() === rel.toLowerCase()) {
      const href = htmlAttr(block, "href");
      if (href) return href;
    }
  }
  return "";
}

function parseFeedItems(feedXml) {
  const rssItems = [...feedXml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const block = match[0];
    return {
      title: xmlTag(block, "title"),
      sourceUrl: xmlTag(block, "link") || xmlTag(block, "guid"),
      author: xmlTag(block, "author") || xmlTag(block, "dc:creator"),
      publishedAt: normalizeDate(xmlTag(block, "pubDate") || xmlTag(block, "dc:date")),
      summary: stripHtml(xmlTag(block, "description"))
    };
  });

  const atomItems = [...feedXml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => {
    const block = match[0];
    return {
      title: xmlTag(block, "title"),
      sourceUrl: xmlAttr(block, "link", "href") || xmlTag(block, "id"),
      author: xmlTag(xmlTag(block, "author"), "name"),
      publishedAt: normalizeDate(xmlTag(block, "published") || xmlTag(block, "updated")),
      summary: stripHtml(xmlTag(block, "summary") || xmlTag(block, "content"))
    };
  });

  return [...rssItems, ...atomItems].filter((item) => item.title || item.sourceUrl);
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

async function readTextSource(source) {
  if (!source) return "";
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not fetch feed: ${source}`);
    return response.text();
  }
  return readFile(source, "utf8");
}

function sourceDisplay(source) {
  if (/^https?:\/\//.test(source)) return source;
  return path.relative(repoRoot, source);
}

function sourceHost(source) {
  try {
    return new URL(source).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function parseHtmlSource(html, source) {
  const sourceUrl = htmlMeta(html, ["og:url", "twitter:url"]) || htmlLink(html, "canonical") || (/^https?:\/\//.test(source) ? source : "");
  return {
    title: htmlMeta(html, ["og:title", "twitter:title"]) || htmlTag(html, "title") || sourceUrl || sourceDisplay(source),
    sourceUrl,
    sourceName: htmlMeta(html, ["og:site_name", "application-name"]) || sourceHost(sourceUrl || source) || "Manual URL source",
    author: htmlMeta(html, ["author", "article:author", "dc.creator"]),
    publishedAt: normalizeDate(htmlMeta(html, ["article:published_time", "date", "dc.date", "pubdate"])),
    summary: htmlMeta(html, ["description", "og:description", "twitter:description"])
  };
}

function queryRecords(candidates) {
  const seen = new Set();
  const records = [];
  for (const candidate of candidates) {
    const meta = candidate.candidateMeta || {};
    const query = meta.query || "";
    if (!query || seen.has(query)) continue;
    seen.add(query);
    records.push({
      query,
      candidateId: candidate.id,
      candidateTitle: candidate.title,
      category: candidate.category || "",
      reason: meta.reason || "",
      kind: meta.kind || "",
      relevanceScore: meta.relevanceScore || 0,
      trustScore: meta.trustScore || 0,
      duplicateScore: meta.duplicateScore || 0,
      connections: candidate.connections || [],
      sourceUrl: candidate.sourceUrl || "",
      suggestedNextInput: candidate.sourceUrl ? "review-source-url" : "search-query-then-add-url",
      reviewStatus: "needs-human-search-review"
    });
  }
  return records;
}

async function readUrlList(urlFile) {
  if (!urlFile) return [];
  const text = await readFile(urlFile, "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map(resolveSourceReference);
}

async function readUrlCandidates(urls, urlFile, entries, existingCandidates) {
  const sources = unique([...(urls || []), ...(await readUrlList(urlFile))]);
  if (!sources.length) return [];

  const candidates = [];
  for (const sourceRef of sources) {
    const html = await readTextSource(sourceRef);
    const item = parseHtmlSource(html, sourceRef);
    const source = {
      ...item,
      category: inferCategoryFromSource(item),
      tags: ["manual-url", "external-source"],
      candidateTag: false,
      concepts: ["manual source review", "source metadata"],
      query: `${item.title || item.sourceUrl || sourceDisplay(sourceRef)} source review`,
      reason: "Added from manual URL input for review-first ingestion.",
      trustScore: /^https?:\/\//.test(item.sourceUrl || sourceRef) ? 0.62 : 0.5,
      relevanceScore: 0.7
    };
    const candidate = candidateFromSource(source, entries);
    candidate.candidateMeta.kind = "manual-url";
    candidate.connections = linkCandidate(candidate, entries);
    candidate.candidateMeta.duplicateScore = duplicateScore(candidate, entries, [...existingCandidates, ...candidates]);
    candidates.push(candidate);
  }
  return candidates;
}

async function readFeedCandidates(feedFile, entries, existingCandidates) {
  if (!feedFile) return [];
  const feedXml = await readTextSource(feedFile);
  const feedTitle = xmlTag(feedXml, "title") || "Feed source";
  return parseFeedItems(feedXml).map((item) => {
    const source = {
      ...item,
      sourceName: feedTitle,
      category: inferCategoryFromSource(item),
      tags: ["feed-source", "external-source"],
      candidateTag: false,
      concepts: ["feed discovery", "source review"],
      query: `${item.title || item.sourceUrl} source review`,
      reason: "Discovered from RSS/Atom feed metadata for review-first ingestion.",
      trustScore: 0.56,
      relevanceScore: 0.68
    };
    const candidate = candidateFromSource(source, entries);
    candidate.candidateMeta.kind = "feed-source";
    candidate.connections = linkCandidate(candidate, entries);
    candidate.candidateMeta.duplicateScore = duplicateScore(candidate, entries, existingCandidates);
    return candidate;
  });
}

function inferCategoryFromSource(source) {
  const text = normalizeText([source.title, source.summary].join(" "));
  if (/design system|token|component|디자인 시스템|컴포넌트/.test(text)) return "디자인 시스템";
  if (/brand|branding|브랜드|identity/.test(text)) return "브랜드 전략";
  if (/ux|research|user|사용자|리서치/.test(text)) return "UX 디자인";
  if (/ui|interface|layout|인터페이스|레이아웃/.test(text)) return "UI 디자인";
  if (/content|writing|copy|콘텐츠|카피/.test(text)) return "콘텐츠 전략";
  return "디자인 프로세스";
}

async function readSourceCandidates(sourceFile, entries, existingCandidates) {
  if (!sourceFile) return [];
  const sourceData = await readJson(sourceFile, { sources: [] });
  const sources = Array.isArray(sourceData) ? sourceData : sourceData.sources || [];
  return sources.map((source) => {
    const candidate = candidateFromSource(source, entries);
    candidate.connections = linkCandidate(candidate, entries);
    if (!candidate.connections.length) candidate.connections = unique(source.connections || []).slice(0, 5);
    candidate.candidateMeta.duplicateScore = duplicateScore(candidate, entries, existingCandidates);
    return candidate;
  });
}

function generateCandidates(entries, existingCandidates) {
  const connectionCounts = buildConnectionCounts(entries);
  const tagCounts = countTerms(entries, "tags");
  const conceptCounts = countTerms(entries, "concepts");
  const byCategory = topEntriesByCategory(entries);
  const candidates = [];

  const weakEntries = [...entries]
    .filter((entry) => (connectionCounts.get(entry.id) || 0) <= 4 && (entry.concepts || []).length >= 3)
    .sort((a, b) => (connectionCounts.get(a.id) || 0) - (connectionCounts.get(b.id) || 0) || a.title.localeCompare(b.title, "ko"))
    .slice(0, 12);

  for (const entry of weakEntries) {
    const primaryConcept = (entry.concepts || []).find((concept) => !["출처 기반 학습", "실무 지식화"].includes(concept)) || entry.category;
    const title = `${primaryConcept} 실무 사례와 판단 기준`;
    candidates.push(
      makeCandidate({
        kind: "weak-connection",
        title,
        category: entry.category || "미분류",
        tags: [...(entry.tags || []), "사례분석"].filter((tag) => tag !== "PlusX" && tag !== "플엑익힘책"),
        concepts: [primaryConcept, ...(entry.concepts || []).slice(0, 4), "판단 기준"],
        seedEntries: [entry],
        query: queryText([primaryConcept, entry.category], "case study design principles"),
        relevanceBase: 0.72 + Math.max(0, 4 - (connectionCounts.get(entry.id) || 0)) * 0.04,
        trustBase: 0.58,
        reason: `"${entry.title}" has useful concepts but relatively weak graph connectivity, so adjacent cases can improve reuse.`
      })
    );
  }

  for (const [concept, count] of conceptCounts.slice(0, 10)) {
    const seeds = entries.filter((entry) => (entry.concepts || []).includes(concept)).slice(0, 5);
    const category = seeds[0]?.category || "미분류";
    candidates.push(
      makeCandidate({
        kind: "repeated-concept",
        title: `${concept} 비교 프레임워크`,
        category,
        tags: unique([...seeds.flatMap((entry) => entry.tags || []), "프레임워크"]).filter((tag) => tag !== "PlusX" && tag !== "플엑익힘책"),
        concepts: [concept, "비교 기준", "실무 적용", "검증 질문"],
        seedEntries: seeds,
        query: `${concept} framework checklist design practice`,
        relevanceBase: 0.64 + Math.min(count, 8) * 0.035,
        trustBase: 0.62,
        reason: `"${concept}" appears in ${count} entries, so a comparison framework can connect repeated knowledge into reusable criteria.`
      })
    );
  }

  for (const [tag, count] of tagCounts.slice(0, 8)) {
    const seeds = entries.filter((entry) => (entry.tags || []).includes(tag)).slice(0, 5);
    const category = seeds[0]?.category || "미분류";
    candidates.push(
      makeCandidate({
        kind: "repeated-tag",
        title: `${tag} 프로젝트 적용 체크리스트`,
        category,
        tags: [tag, "체크리스트", "프로젝트 판단"],
        concepts: [tag, "적용 조건", "리스크 점검", "성과 기준"],
        seedEntries: seeds,
        query: `${tag} project checklist design operations`,
        relevanceBase: 0.6 + Math.min(count, 8) * 0.04,
        trustBase: 0.6,
        reason: `#${tag} appears in ${count} entries and can become a reusable project checklist.`
      })
    );
  }

  for (const [category, categoryEntries] of byCategory.entries()) {
    const adjacent = ADJACENT_TOPICS[category] || [`${category} 사례`, `${category} 검증`, `${category} 운영`];
    const seeds = categoryEntries.slice(0, 4);
    for (const topic of adjacent.slice(0, 2)) {
      candidates.push(
        makeCandidate({
          kind: "adjacent-topic",
          title: `${topic} 자료 수집`,
          category,
          tags: [category, topic, "자료수집"],
          concepts: [topic, category, "인접 지식", "프로젝트 판단 기준"],
          seedEntries: seeds,
          query: `${topic} ${category} official guide case study`,
          relevanceBase: 0.68,
          trustBase: 0.66,
          reason: `"${category}" has ${categoryEntries.length} entries; "${topic}" is an adjacent topic that can broaden the cluster.`
        })
      );
    }
  }

  const normalizedSeen = new Set();
  const deduped = [];
  for (const candidate of candidates) {
    candidate.connections = linkCandidate(candidate, entries);
    if (!candidate.connections.length && candidate.candidateMeta.discoveredFrom.length) {
      candidate.connections = candidate.candidateMeta.discoveredFrom.slice(0, 3);
    }
    candidate.candidateMeta.duplicateScore = duplicateScore(candidate, entries, existingCandidates);
    const key = `${normalizeText(candidate.title)}|${candidate.candidateMeta.query}|${candidate.connections.join(",")}`;
    if (normalizedSeen.has(key)) continue;
    normalizedSeen.add(key);
    if (candidate.candidateMeta.duplicateScore >= 0.86) continue;
    deduped.push(candidate);
  }

  return deduped.sort((a, b) => {
    const left = b.candidateMeta.relevanceScore - b.candidateMeta.duplicateScore * 0.35;
    const right = a.candidateMeta.relevanceScore - a.candidateMeta.duplicateScore * 0.35;
    return left - right || a.title.localeCompare(b.title, "ko");
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const knowledge = await readJson(args.knowledgePath, { entries: [] });
  const existing = await readJson(args.outPath, { version: 1, updatedAt: TODAY, candidates: [] });
  const entries = knowledge.entries || [];
  const existingCandidates = existing.candidates || [];
  const sourceCandidates = await readSourceCandidates(args.sourceFile, entries, existingCandidates);
  const feedCandidates = await readFeedCandidates(args.feedFile, entries, [...existingCandidates, ...sourceCandidates]);
  const urlCandidates = await readUrlCandidates(args.urls, args.urlFile, entries, [...existingCandidates, ...sourceCandidates, ...feedCandidates]);
  const generatedCandidates = generateCandidates(entries, [...existingCandidates, ...sourceCandidates, ...feedCandidates, ...urlCandidates]);
  const candidates = [...sourceCandidates, ...feedCandidates, ...urlCandidates, ...generatedCandidates]
    .filter((candidate, index, list) => list.findIndex((item) => item.id === candidate.id) === index)
    .slice(0, args.limit);
  const output = {
    version: 1,
    updatedAt: TODAY,
    generatedFrom: {
      knowledgePath: path.relative(repoRoot, args.knowledgePath),
      sourceFile: args.sourceFile ? path.relative(repoRoot, args.sourceFile) : "",
      feedFile: args.feedFile ? (/^https?:\/\//.test(args.feedFile) ? args.feedFile : path.relative(repoRoot, args.feedFile)) : "",
      urls: args.urls.map(sourceDisplay),
      urlFile: args.urlFile ? path.relative(repoRoot, args.urlFile) : "",
      entryCount: entries.length,
      mode: args.sourceFile || args.feedFile || args.urls.length || args.urlFile ? "source-adapter-review-first" : "deterministic-review-first"
    },
    candidates
  };
  const queryOutput = args.queryOutPath
    ? {
        version: 1,
        updatedAt: TODAY,
        generatedFrom: output.generatedFrom,
        count: queryRecords(candidates).length,
        queries: queryRecords(candidates)
      }
    : null;

  if (!args.dryRun) {
    await writeJson(args.outPath, output);
  }

  if (queryOutput) {
    await writeJson(args.queryOutPath, queryOutput);
  }

  console.log(
    JSON.stringify(
      {
        dryRun: args.dryRun,
        out: path.relative(repoRoot, args.outPath),
        queryOut: args.queryOutPath ? path.relative(repoRoot, args.queryOutPath) : "",
        entries: entries.length,
        candidates: candidates.length,
        queries: queryOutput?.count || 0,
        linkedCandidates: candidates.filter((candidate) => candidate.connections.length > 0).length,
        topQueries: candidates.slice(0, 5).map((candidate) => candidate.candidateMeta.query)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAGAZINE_NO = 54747;
const API_URL = `https://api.brunch.co.kr/v2/magazine/${MAGAZINE_NO}/articles`;
const ROOT = process.cwd();
const ENTRY_DIR = join(ROOT, "knowledge", "plusx-flex", "entries");
const SOURCE_FILE = join(ROOT, "knowledge", "plusx-flex", "sources", "urls.md");
const SUMMARY_FILE = join(ROOT, "knowledge", "plusx-flex", "summary.md");
const DATA_FILE = join(ROOT, "knowledge", "data", "knowledge.json");
const TODAY = new Date().toISOString().slice(0, 10);

const categoryRules = [
  ["디자인 시스템", ["디자인 시스템", "컴포넌트", "가이드", "스타일", "운영"]],
  ["개발 경험", ["dx", "개발", "developer", "프론트엔드", "백엔드", "코드", "코딩"]],
  ["프로덕트 경험", ["px team", "product", "제품", "object", "오브젝트", "사원증", "듀얼프레임"]],
  ["조직 문화", ["ex team", "hr", "조직", "협업", "일하는", "신입", "입사", "멤버", "리더십"]],
  ["콘텐츠 전략", ["mx team", "media", "콘텐츠", "카피", "글", "메시지", "툴", "플랫폼", "포트폴리오"]],
  ["UI 디자인", ["ui", "인터페이스", "화면", "피그마", "프로토타입", "웹사이트", "디자인하기", "디바이스"]],
  ["UX 디자인", ["ux", "사용자", "리서치", "여정", "서비스", "탐색", "커머스", "키오스크"]],
  ["브랜드 전략", ["브랜드", "브랜딩", "identity", "아이덴티티", "ix", "bx", "네이밍", "캠페인"]],
  ["디자인 프로세스", ["ai", "워크플로우", "프로세스", "콘퍼런스", "인사이트"]]
];

function normalizeSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function dateFromTimestamp(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function classify(article) {
  const title = [article.title, article.subTitle].join(" ").toLowerCase();
  if (/\bdx\b|개발/.test(title)) return "개발 경험";
  if (/\bex\b|hr|조직|입사|신입|리더십/.test(title)) return "조직 문화";
  if (/\bmx\b|media|콘텐츠|카피/.test(title)) return "콘텐츠 전략";
  if (/\bpx\b|product|제품|오브젝트|듀얼프레임/.test(title)) return "프로덕트 경험";
  if (/\bui\b|인터페이스|화면|웹사이트|피그마|프레이머/.test(title)) return "UI 디자인";
  if (/\bux\b|사용자|탐색|서비스/.test(title)) return "UX 디자인";
  if (/\bbx\b|\bix\b|브랜드|브랜딩|네이밍|로고|아이덴티티|vi/.test(title)) return "브랜드 전략";

  const haystack = [article.title, article.subTitle, article.contentSummary].join(" ").toLowerCase();
  const match = categoryRules.find(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)));
  return match ? match[0] : "디자인 프로세스";
}

function inferTags(article) {
  const haystack = [article.title, article.subTitle, article.contentSummary].join(" ").toLowerCase();
  const title = [article.title, article.subTitle].join(" ").toLowerCase();
  const tags = new Set(["PlusX", "플엑익힘책"]);

  if (/\bbx\b|브랜드|브랜딩/.test(title)) tags.add("BX");
  if (/\bux\b|사용자|리서치/.test(title)) tags.add("UX");
  if (/\bui\b|인터페이스|화면/.test(title)) tags.add("UI");
  if (/\bix\b|컨설팅|전략/.test(title)) tags.add("IX");
  if (/\bdx\b|개발|코딩/.test(title)) tags.add("DX");
  if (/\bpx\b|product|제품|오브젝트/.test(title)) tags.add("PX");
  if (/\bex\b|hr|조직|리더십|입사|신입/.test(title)) tags.add("EX");
  if (/\bmx\b|media|콘텐츠|카피/.test(title)) tags.add("MX");
  if (/리서치|조사|인터뷰/.test(haystack)) tags.add("리서치");
  if (/프로세스|과정|운영|워크플로우/.test(haystack)) tags.add("프로세스");
  if (/디자인 시스템|가이드|컴포넌트/.test(haystack)) tags.add("디자인시스템");
  if (/조직|협업|팀|일하는/.test(haystack)) tags.add("조직문화");

  return [...tags];
}

function inferConcepts(article, category) {
  const title = article.title || "";
  const concepts = new Set([category, "출처 기반 학습", "실무 지식화"]);

  if (/team|팀/i.test(title)) concepts.add("팀 역할 정의");
  if (/ux/i.test(title)) concepts.add("사용자 경험 설계");
  if (/ui/i.test(title)) concepts.add("인터페이스 구체화");
  if (/bx|브랜드|브랜딩/i.test(title + article.contentSummary)) concepts.add("브랜드 본질");
  if (/ix/i.test(title)) concepts.add("브랜드 전략 컨설팅");
  if (/dx|개발/i.test(title + article.contentSummary)) concepts.add("디자인과 개발 협업");
  if (/ex|hr|조직/i.test(title + article.contentSummary)) concepts.add("직원 경험");
  if (/툴|피그마|figma/i.test(title + article.contentSummary)) concepts.add("작업 도구");
  if (/리서치|인터뷰|조사/i.test(title + article.contentSummary)) concepts.add("리서치 기반 판단");
  if (/웹사이트|서비스|프로덕트|제품/i.test(title + article.contentSummary)) concepts.add("디지털 경험");

  return [...concepts];
}

function inferPrinciples(article, category) {
  const principles = [
    "출처 메타데이터와 해석을 분리해서 저장한다.",
    "원문을 복제하지 않고 실무 판단 기준으로 재구성한다."
  ];

  if (category === "브랜드 전략") {
    principles.push("브랜드의 본질, 시장 맥락, 사용자 인상을 함께 검토한다.");
    principles.push("전략은 시각 결과물이 아니라 운영과 커뮤니케이션 기준까지 이어져야 한다.");
  } else if (category === "UX 디자인") {
    principles.push("사용자의 문제와 맥락을 먼저 구조화한 뒤 화면이나 기능을 정의한다.");
    principles.push("논리와 근거가 필요한 결정은 리서치, 사례, 데이터로 보강한다.");
  } else if (category === "UI 디자인") {
    principles.push("와이어프레임 이후의 UI는 감성, 톤앤매너, 인터랙션을 구체화하는 단계다.");
    principles.push("시각적 편안함과 심리적 편안함을 모두 고려해 접점을 설계한다.");
  } else if (category === "조직 문화") {
    principles.push("팀의 역할은 산출물뿐 아니라 구성원이 몰입할 수 있는 환경까지 포함한다.");
    principles.push("조직 운영 데이터와 직원 경험은 크리에이티브 품질을 뒷받침하는 기반이다.");
  } else if (category === "개발 경험") {
    principles.push("디자인 의도를 구현 가능한 시스템, 모션, 인터랙션으로 번역한다.");
    principles.push("개발자는 결과물의 표현 품질과 운영 가능성을 함께 책임진다.");
  } else {
    principles.push("사례를 팀 역할, 문제의식, 접근 방식, 적용 조건으로 나눠 재사용한다.");
  }

  return principles;
}

function inferApplications(category) {
  const common = ["프로젝트 킥오프 전 유사 사례 탐색", "디자인 리뷰에서 판단 기준 보강"];
  const map = {
    "브랜드 전략": ["브랜드 정의, 네이밍, 포지셔닝 작업", "BX/IX 리서치와 컨셉 정리"],
    "UX 디자인": ["서비스 구조 설계와 리서치 계획", "사용자 여정과 기능 우선순위 판단"],
    "UI 디자인": ["화면 콘셉트, 톤앤매너, 인터랙션 설계", "제안서나 프로토타입의 설득 구조 작성"],
    "디자인 시스템": ["컴포넌트 운영 기준 수립", "스타일 가이드와 템플릿 관리"],
    "콘텐츠 전략": ["브랜드 메시지와 콘텐츠 포맷 설계", "조직 내부 지식 공유 콘텐츠 작성"],
    "조직 문화": ["팀 소개, 채용, 온보딩, 일하는 방식 정리", "크리에이티브 조직 운영 정책 설계"],
    "개발 경험": ["디자인-개발 협업 방식 정리", "인터랙션 구현과 기술 검토"],
    "프로덕트 경험": ["자체 제품 또는 굿즈 기획", "물리적 접점과 브랜드 경험 연결"]
  };
  return [...common, ...(map[category] || [])];
}

function connectionTargets(entry, allEntries) {
  const ignoredTags = new Set(["PlusX", "플엑익힘책"]);
  const entryTags = entry.tags.filter((tag) => !ignoredTags.has(tag));
  return allEntries
    .filter((other) => other.id !== entry.id)
    .filter((other) => {
      const otherTags = other.tags.filter((tag) => !ignoredTags.has(tag));
      return other.category === entry.category || otherTags.some((tag) => entryTags.includes(tag));
    })
    .slice(0, 5)
    .map((other) => other.id);
}

async function fetchPage(createTime = 0, orderType = "asc") {
  const url = `${API_URL}?createTime=${createTime}&orderType=${orderType}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchAll() {
  const rows = [];
  let createTime = 0;
  let guard = 0;

  while (guard < 20) {
    const payload = await fetchPage(createTime);
    const list = payload.data?.list || [];
    rows.push(...list);
    if (!payload.data?.moreList || !payload.data?.lastCreateTime) break;
    createTime = payload.data.lastCreateTime;
    guard += 1;
  }

  return rows;
}

function makeEntry(row) {
  const article = row.article;
  const category = classify(article);
  const tags = inferTags(article);
  const id = `plusx-${article.no}-${slugify(article.title)}`;
  const sourceUrl = `https://brunch.co.kr/@${row.user.profileId}/${article.no}`;
  const subtitle = normalizeSpace(article.subTitle);
  const summary = `${article.title}은 ${subtitle ? `${subtitle} 맥락에서 ` : ""}${category} 관점의 사례를 출처 기반 지식으로 정리한 카드다. 원문 전체를 저장하지 않고, 프로젝트에서 재사용할 수 있는 개념, 원칙, 적용 상황으로 재구성했다.`;

  return {
    id,
    title: article.title,
    sourceUrl,
    sourceName: "Brunch",
    author: row.user.userName || "플러스엑스",
    publishedAt: dateFromTimestamp(article.publishTime),
    accessedAt: TODAY,
    category,
    tags,
    summary,
    concepts: inferConcepts(article, category),
    principles: inferPrinciples(article, category),
    applications: inferApplications(category),
    connections: [],
    verificationStatus: "verified",
    sourceMeta: {
      magazineNo: MAGAZINE_NO,
      articleNo: article.no,
      subtitle: article.subTitle || "",
      readSeconds: article.readSeconds || 0,
      commentCount: article.commentCount || 0
    }
  };
}

function markdownEntry(entry) {
  return `---
id: ${entry.id}
title: "${entry.title.replaceAll('"', '\\"')}"
sourceUrl: ${entry.sourceUrl}
sourceName: Brunch
author: ${entry.author}
publishedAt: ${entry.publishedAt}
accessedAt: ${entry.accessedAt}
category: ${entry.category}
tags: [${entry.tags.map((tag) => `"${tag}"`).join(", ")}]
verificationStatus: verified
---

# ${entry.title}

## Summary
${entry.summary}

## Key Concepts
${entry.concepts.map((item) => `- ${item}`).join("\n")}

## Practical Principles
${entry.principles.map((item) => `- ${item}`).join("\n")}

## Applications
${entry.applications.map((item) => `- ${item}`).join("\n")}

## Problem Framing
이 글은 플러스엑스의 팀, 프로젝트, 일하는 방식, 디자인 관점을 외부에 설명하는 맥락에서 수집되었다.

## Approach
브런치 매거진의 공개 메타데이터와 요약을 바탕으로 실무자가 재사용할 수 있는 분류, 개념, 원칙으로 재구성했다.

## Implications
프로젝트 진행 시 유사한 팀 역할, 디자인 판단, 협업 방식, 브랜드/UX/UI 접근을 빠르게 참조할 수 있다.

## Connections
${entry.connections.map((item) => `- ${item}`).join("\n")}

## One-Sentence Knowledge
${entry.title}은 ${entry.category} 관점에서 플러스엑스의 실무 방식을 이해하는 데 쓸 수 있는 출처 기반 지식 카드다.
`;
}

function sourceLedger(entries) {
  const rows = entries
    .map(
      (entry) =>
        `| ready | ${entry.title.replaceAll("|", "\\|")} | ${entry.sourceUrl} | Brunch magazine plusx API | ${TODAY} | ${entry.category}; article ${entry.sourceMeta.articleNo} |`
    )
    .join("\n");

  return `# Plus X 플엑익힘책 URL Collection

Collected from the public Brunch magazine page and article list API for magazine ${MAGAZINE_NO}.

| Status | Title | URL | Found From | Discovered At | Notes |
| --- | --- | --- | --- | --- | --- |
${rows}

## Status Values

- \`candidate\`: discovered but not verified.
- \`ready\`: verified as a Plus X 플엑익힘책 post.
- \`duplicate\`: duplicate of another URL.
- \`inaccessible\`: deleted, blocked, login-gated, or otherwise unavailable.
`;
}

function summaryMarkdown(entries) {
  const categoryCounts = new Map();
  for (const entry of entries) {
    categoryCounts.set(entry.category, (categoryCounts.get(entry.category) || 0) + 1);
  }

  const categoryLines = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `- ${category}: ${count}개`)
    .join("\n");

  const tagSet = [...new Set(entries.flatMap((entry) => entry.tags))].sort();

  return `# Plus X 플엑익힘책 Summary

Updated: ${TODAY}

## Collection Status

- Source: Brunch magazine \`plusx\`
- Magazine no: ${MAGAZINE_NO}
- Imported entries: ${entries.length}
- Import method: public magazine article list API

## Repeated Perspectives

- 플러스엑스는 팀별 전문성을 분리하되, BX/UX/UI/DX/EX/PX/MX가 프로젝트 경험 안에서 연결되는 방식으로 설명한다.
- 디자인 결과물만이 아니라 전략, 조직 운영, 협업, 개발 구현, 콘텐츠, 도구 사용까지 경험 품질의 일부로 다룬다.
- 각 글은 팀 소개나 프로젝트 회고의 형식을 빌리지만, 실무자가 참고할 수 있는 역할 정의와 판단 기준을 제공한다.

## Design Philosophy

플엑익힘책 데이터에서 반복되는 관점은 "경험을 만드는 모든 접점을 설계 대상으로 본다"는 것이다. 브랜드 전략, 사용자 경험, 화면 디자인, 개발 구현, 조직 운영은 분리된 부서 업무가 아니라 하나의 경험을 만들기 위한 연결된 레이어로 정리된다.

## Practical Principles

- 팀 역할을 산출물 중심이 아니라 문제 해결 방식 중심으로 정의한다.
- 브랜드와 서비스 경험은 리서치, 전략, 시각 언어, 구현, 운영 정책이 함께 맞물릴 때 일관된다.
- 원문은 보관하지 않고 출처, 요약, 개념, 원칙, 적용 상황으로 변환해 재사용한다.
- 그래프 연결은 공유 태그, 개념, 카테고리, 명시적 연결을 기준으로 관리한다.

## Category Map

${categoryLines}

## Concept Map

- 조직/팀: 팀 역할 정의, 직원 경험, 협업 방식
- 브랜드/전략: 브랜드 본질, 컨셉, 네이밍, 시장 맥락
- UX/UI: 사용자 경험 설계, 인터페이스 구체화, 디지털 접점
- 개발/프로덕트: 구현 품질, 도구 사용, 제품 경험
- 콘텐츠/지식화: 출처 기반 학습, 실무 지식화, 내부 공유

## Tag System

${tagSet.map((tag) => `- #${tag}`).join("\n")}

## Learning Gaps

- 각 글의 본문 전체를 읽고 요약을 더 정교하게 재작성해야 한다.
- API 목록 요약만으로 만든 카드는 \`sourceMeta\`를 기준으로 원문 재검증이 필요하다.
- 프로젝트별 사례, 팀별 방법론, 실제 산출물 유형을 추가 필드로 확장하면 그래프 연결 품질이 좋아진다.
`;
}

async function main() {
  await mkdir(ENTRY_DIR, { recursive: true });
  const rows = await fetchAll();
  const uniqueRows = [...new Map(rows.map((row) => [row.article.no, row])).values()].sort(
    (a, b) => a.article.publishTime - b.article.publishTime
  );

  const entries = uniqueRows.map(makeEntry);
  for (const entry of entries) {
    entry.connections = connectionTargets(entry, entries);
  }

  await Promise.all(
    entries.map((entry) => writeFile(join(ENTRY_DIR, `${entry.id}.md`), markdownEntry(entry), "utf8"))
  );

  await writeFile(SOURCE_FILE, sourceLedger(entries), "utf8");
  await writeFile(SUMMARY_FILE, summaryMarkdown(entries), "utf8");
  await writeFile(DATA_FILE, JSON.stringify({ version: 1, updatedAt: TODAY, entries }, null, 2) + "\n", "utf8");

  console.log(`Imported ${entries.length} Plus X Brunch entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

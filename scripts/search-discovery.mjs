import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const today = localIsoDate();

function parseArgs(argv) {
  const args = {
    queryFile: "",
    outPath: path.join(repoRoot, "knowledge/data/search-source-seeds.json"),
    mockHtml: "",
    limit: 3,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--query-file") {
      args.queryFile = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
    } else if (value === "--out") {
      args.outPath = path.resolve(repoRoot, argv[index + 1] || args.outPath);
      index += 1;
    } else if (value === "--mock-html") {
      args.mockHtml = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
    } else if (value === "--limit") {
      args.limit = Number(argv[index + 1] || args.limit);
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) args.limit = 3;
  return args;
}

function localIsoDate(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlAttr(block, attr) {
  const match = block.match(new RegExp(`\\s${attr}=["']([^"']+)["']`, "i"));
  return decodeHtml(match?.[1] || "");
}

function hostName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("duckduckgo.com") && parsed.pathname === "/l/") {
      const uddg = parsed.searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function parseResults(html) {
  const results = [];
  if (/anomaly-modal|challenge-form|Unfortunately, bots use DuckDuckGo too/i.test(html)) {
    return { results, warning: "search-provider-challenge" };
  }
  const blocks = html.match(/<a\b(?=[^>]*class=["'][^"']*result-link[^"']*["'])[^>]*>[\s\S]*?<\/a>[\s\S]*?(?=<a\b(?=[^>]*class=["'][^"']*result-link)|$)/gi) || [];

  for (const block of blocks) {
    const linkMatch = block.match(/<a\b(?=[^>]*class=["'][^"']*result-link[^"']*["'])([^>]*)>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const url = normalizeUrl(htmlAttr(linkMatch[1], "href"));
    if (!url || !/^https?:\/\//.test(url)) continue;
    const snippetMatch = block.match(/class=["'][^"']*(?:result-snippet|result__snippet)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
    results.push({
      title: decodeHtml(linkMatch[2]),
      sourceUrl: url,
      sourceName: hostName(url) || "Search result",
      summary: decodeHtml(snippetMatch?.[1] || ""),
      author: hostName(url) || "",
      publishedAt: ""
    });
  }

  return { results };
}

async function searchHtml(query, mockHtml) {
  if (mockHtml) return readFile(mockHtml, "utf8");
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "xLevel-Knowledge-Agent/1.0 (+review-first metadata discovery)"
    }
  });
  if (!response.ok) throw new Error(`Search request failed for "${query}": ${response.status}`);
  return response.text();
}

function sourceFromResult(result, queryRecord, rank) {
  const query = queryRecord.query || "";
  return {
    title: result.title,
    sourceUrl: result.sourceUrl,
    sourceName: result.sourceName,
    author: result.author,
    publishedAt: result.publishedAt,
    accessedAt: today,
    category: queryRecord.category || "",
    tags: ["search-result", "external-source"],
    summary: result.summary || `Search result metadata for query: ${query}`,
    concepts: [queryRecord.category, "search discovery", "source review"].filter(Boolean),
    principles: [
      "검색 결과는 원문 검토 전까지 needs-verification 상태로 유지한다.",
      "검색 결과 메타데이터와 원문 해석을 분리한다."
    ],
    applications: [
      "검색 결과 후보 검토",
      "외부 출처 URL 선별",
      "기존 지식 그래프 보강"
    ],
    connections: queryRecord.connections || [],
    query,
    reason: `Search result #${rank} for candidate ${queryRecord.candidateId || "unknown"}: ${queryRecord.reason || "needs review"}`,
    trustScore: 0.52,
    relevanceScore: queryRecord.relevanceScore || 0.64,
    verificationStatus: "needs-verification",
    sourceMeta: {
      adapter: "duckduckgo-lite",
      query,
      candidateId: queryRecord.candidateId || "",
      rank
    }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.queryFile) throw new Error("Provide --query-file <path>");

  const queryData = await readJson(args.queryFile);
  const queryRecords = (queryData.queries || []).filter((item) => item.query).slice(0, args.limit);
  const sources = [];
  const seenUrls = new Set();
  const warnings = [];

  for (const queryRecord of queryRecords) {
    const html = await searchHtml(queryRecord.query, args.mockHtml);
    const parsed = parseResults(html);
    if (parsed.warning) warnings.push({ query: queryRecord.query, warning: parsed.warning });
    const [firstResult] = parsed.results;
    if (!firstResult) {
      if (!parsed.warning) warnings.push({ query: queryRecord.query, warning: "no-search-results-parsed" });
      continue;
    }
    if (seenUrls.has(firstResult.sourceUrl)) continue;
    seenUrls.add(firstResult.sourceUrl);
    sources.push(sourceFromResult(firstResult, queryRecord, 1));
  }

  const output = {
    version: 1,
    updatedAt: today,
    generatedFrom: {
      queryFile: path.relative(repoRoot, args.queryFile),
      mockHtml: args.mockHtml ? path.relative(repoRoot, args.mockHtml) : "",
      mode: args.mockHtml ? "mock-search-results" : "duckduckgo-lite-search"
    },
    sources
  };

  if (!args.dryRun) {
    await writeFile(args.outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        dryRun: args.dryRun,
        out: path.relative(repoRoot, args.outPath),
        queries: queryRecords.length,
        sources: sources.length,
        warnings,
        topSources: sources.slice(0, 5).map((source) => source.sourceUrl)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

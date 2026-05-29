import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {
    configPath: path.join(repoRoot, "knowledge/data/automation-cycle.example.json"),
    dryRunOverride: null,
    reportOut: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--config") {
      args.configPath = path.resolve(repoRoot, argv[index + 1] || args.configPath);
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRunOverride = true;
    } else if (value === "--write") {
      args.dryRunOverride = false;
    } else if (value === "--report-out") {
      args.reportOut = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
    }
  }

  return args;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function repoPath(value) {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  return path.resolve(repoRoot, value);
}

function compact(values) {
  return values.filter((value) => value !== "" && value !== null && value !== undefined);
}

function buildLoopArgs(config, dryRun) {
  const args = ["scripts/run-learning-loop.mjs"];
  if (config.limit) args.push("--limit", String(config.limit));
  if (config.sourceFile) args.push("--source-file", repoPath(config.sourceFile));
  if (config.feedFile) args.push("--feed-file", repoPath(config.feedFile));
  for (const sourceUrl of config.urls || []) args.push("--url", sourceUrl);
  if (config.urlFile) args.push("--url-file", repoPath(config.urlFile));
  if (config.queryOut) args.push("--query-out", repoPath(config.queryOut));
  if (config.searchOut) args.push("--search-out", repoPath(config.searchOut));
  if (config.searchMockHtml) args.push("--search-mock-html", repoPath(config.searchMockHtml));
  if (config.ingestSearchResults) args.push("--ingest-search-results");
  if (config.reviewFile) args.push("--review-file", repoPath(config.reviewFile));
  if (config.skipBuild) args.push("--skip-build");
  if (dryRun) args.push("--dry-run");
  return args;
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });

  return {
    command: `node ${args.join(" ")}`,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeReport(filePath, report) {
  if (!filePath) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(args.configPath);
  const dryRun = args.dryRunOverride ?? config.dryRun !== false;
  const loopArgs = buildLoopArgs(config, dryRun);
  const loopStep = runNode(loopArgs);
  const loopReport = parseJson(loopStep.stdout);
  const reportOut = args.reportOut || (config.reportOut ? repoPath(config.reportOut) : "");
  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    config: path.relative(repoRoot, args.configPath),
    name: config.name || "",
    dryRun,
    reportOut: reportOut ? path.relative(repoRoot, reportOut) : "",
    loop: loopReport,
    steps: [loopStep]
  };

  await writeReport(reportOut, report);

  console.log(
    JSON.stringify(
      {
        dryRun,
        config: path.relative(repoRoot, args.configPath),
        reportOut: report.reportOut,
        loopStatus: loopStep.status,
        candidates: loopReport?.collect?.candidates || 0,
        searchSources: loopReport?.search?.sources || 0,
        searchIngestCandidates: loopReport?.searchIngest?.candidates || 0,
        steps: compact([loopReport?.collect && "collect", loopReport?.search && "search", loopReport?.searchIngest && "searchIngest", "build"])
      },
      null,
      2
    )
  );

  if (loopStep.status !== 0) {
    process.exitCode = loopStep.status;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

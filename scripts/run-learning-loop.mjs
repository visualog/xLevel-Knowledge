import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "knowledge/data/learning-loop-report.json");
const defaultQueryOutPath = path.join(repoRoot, "knowledge/data/discovery-queries.json");

function parseArgs(argv) {
  const args = {
    limit: 20,
    sourceFile: "",
    feedFile: "",
    urls: [],
    urlFile: "",
    queryOutPath: "",
    reviewFile: "",
    dryRun: false,
    skipBuild: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--limit") {
      args.limit = Number(argv[index + 1] || args.limit);
      index += 1;
    } else if (value === "--review-file") {
      args.reviewFile = path.resolve(repoRoot, argv[index + 1] || "");
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
      args.urls.push(/^https?:\/\//.test(next) ? next : path.resolve(repoRoot, next));
      index += 1;
    } else if (value === "--url-file") {
      args.urlFile = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
    } else if (value === "--query-out") {
      const next = argv[index + 1] || defaultQueryOutPath;
      args.queryOutPath = path.resolve(repoRoot, next);
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--skip-build") {
      args.skipBuild = true;
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) args.limit = 20;
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

function parseJsonOutput(step) {
  if (!step.stdout) return null;
  try {
    return JSON.parse(step.stdout);
  } catch {
    return null;
  }
}

async function readReviewActionCount(filePath) {
  if (!filePath) return 0;
  const reviewData = JSON.parse(await readFile(filePath, "utf8"));
  return Array.isArray(reviewData) ? reviewData.length : (reviewData.actions || []).length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const steps = [];

  if (args.reviewFile) {
    steps.push(runNode(["scripts/apply-candidates.mjs", "--dry-run", "--review-file", args.reviewFile]));
  }

  const collectArgs = ["scripts/collect-knowledge.mjs", "--limit", String(args.limit)];
  if (args.sourceFile) collectArgs.push("--source-file", args.sourceFile);
  if (args.feedFile) collectArgs.push("--feed-file", args.feedFile);
  for (const sourceUrl of args.urls) collectArgs.push("--url", sourceUrl);
  if (args.urlFile) collectArgs.push("--url-file", args.urlFile);
  if (args.queryOutPath) collectArgs.push("--query-out", args.queryOutPath);
  if (args.dryRun) collectArgs.push("--dry-run");
  steps.push(runNode(collectArgs));

  if (!args.skipBuild) {
    steps.push(runNode(["scripts/build-knowledge-index.mjs"]));
  }

  const failed = steps.filter((step) => step.status !== 0);
  const applyStep = args.reviewFile ? steps[0] : null;
  const collectStep = args.reviewFile ? steps[1] : steps[0];
  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    mode: "review-first",
    dryRun: args.dryRun,
    limit: args.limit,
    sourceFile: args.sourceFile ? path.relative(repoRoot, args.sourceFile) : "",
    feedFile: args.feedFile ? (/^https?:\/\//.test(args.feedFile) ? args.feedFile : path.relative(repoRoot, args.feedFile)) : "",
    urls: args.urls.map((sourceUrl) => (/^https?:\/\//.test(sourceUrl) ? sourceUrl : path.relative(repoRoot, sourceUrl))),
    urlFile: args.urlFile ? path.relative(repoRoot, args.urlFile) : "",
    queryOut: args.queryOutPath ? path.relative(repoRoot, args.queryOutPath) : "",
    reviewFile: args.reviewFile ? path.relative(repoRoot, args.reviewFile) : "",
    reviewActions: await readReviewActionCount(args.reviewFile),
    collect: parseJsonOutput(collectStep),
    apply: applyStep ? parseJsonOutput(applyStep) : null,
    buildStatus: args.skipBuild ? "skipped" : steps[steps.length - 1].status,
    steps
  };

  if (!args.dryRun) {
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  }

  console.log(JSON.stringify(report, null, 2));

  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

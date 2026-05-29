import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const candidatesPath = path.join(repoRoot, "knowledge/data/candidates.json");
const rejectedPath = path.join(repoRoot, "knowledge/data/rejected-candidates.json");
const entriesRoot = path.join(repoRoot, "knowledge/self-learning/entries");
const today = new Date().toISOString().slice(0, 10);

function parseArgs(argv) {
  const args = {
    approve: "",
    reject: "",
    merge: "",
    into: "",
    reviewFile: "",
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--approve") {
      args.approve = argv[index + 1] || "";
      index += 1;
    } else if (value === "--reject") {
      args.reject = argv[index + 1] || "";
      index += 1;
    } else if (value === "--merge") {
      args.merge = argv[index + 1] || "";
      index += 1;
    } else if (value === "--into") {
      args.into = argv[index + 1] || "";
      index += 1;
    } else if (value === "--review-file") {
      args.reviewFile = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    }
  }

  return args;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(filePath, value, dryRun) {
  if (dryRun) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 88) || "knowledge-candidate";
}

function uniqueList(values) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function yamlString(value) {
  const text = String(value || "");
  if (!text) return "";
  if (/[:#"'[\]{}]|^\s|\s$/.test(text)) return JSON.stringify(text);
  return text;
}

function yamlList(values) {
  return `[${uniqueList(values).map((value) => JSON.stringify(value)).join(", ")}]`;
}

function markdownList(values) {
  const items = uniqueList(values);
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- needs-verification";
}

function candidateEntryId(candidate) {
  const base = candidate.id?.replace(/^candidate-/, "knowledge-") || `knowledge-${slugify(candidate.title)}`;
  return slugify(base);
}

function candidateToMarkdown(candidate) {
  const id = candidateEntryId(candidate);
  const meta = candidate.candidateMeta || {};
  const verificationStatus = candidate.sourceUrl ? "needs-verification" : "needs-verification";
  const title = candidate.title || "Untitled candidate";
  const sourceName = candidate.sourceName || "Discovery candidate";
  const sourceUrl = candidate.sourceUrl || "";
  const author = candidate.author || "xLevel Knowledge Agent";
  const publishedAt = candidate.publishedAt || "";
  const accessedAt = candidate.accessedAt || today;
  const category = candidate.category || "미분류";

  return `---
id: ${yamlString(id)}
title: ${yamlString(title)}
sourceUrl: ${yamlString(sourceUrl)}
sourceName: ${yamlString(sourceName)}
author: ${yamlString(author)}
publishedAt: ${yamlString(publishedAt)}
accessedAt: ${yamlString(accessedAt)}
category: ${yamlString(category)}
tags: ${yamlList(candidate.tags)}
verificationStatus: ${verificationStatus}
---

# ${title}

## Summary
${candidate.summary || "needs-verification"}

## Key Concepts
${markdownList(candidate.concepts)}

## Practical Principles
${markdownList(candidate.principles)}

## Applications
${markdownList(candidate.applications)}

## Problem Framing
This entry was promoted from a review-needed discovery candidate. Verify the source before treating source-specific claims as final.

## Approach
Discovery query: ${meta.query || "needs-verification"}

Review reason: ${meta.reason || "needs-verification"}

## Implications
Use this card to guide future source discovery, project judgment, and knowledge graph linking after source verification.

## Connections
${markdownList(candidate.connections)}

## One-Sentence Knowledge
${title} is a review-needed knowledge card for strengthening ${category} judgment criteria.
`;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: markdown };

  const meta = {};
  for (const line of match[1].split("\n")) {
    const [rawKey, ...rawValue] = line.split(":");
    if (!rawKey) continue;
    const key = rawKey.trim();
    const value = rawValue.join(":").trim();
    if (value === "[]") {
      meta[key] = [];
    } else if (value.startsWith("[") && value.endsWith("]")) {
      meta[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      meta[key] = value.replace(/^["']|["']$/g, "");
    }
  }

  return { meta, body: match[2] };
}

function serializeFrontmatter(meta) {
  return [
    "---",
    `id: ${yamlString(meta.id)}`,
    `title: ${yamlString(meta.title)}`,
    `sourceUrl: ${yamlString(meta.sourceUrl)}`,
    `sourceName: ${yamlString(meta.sourceName)}`,
    `author: ${yamlString(meta.author)}`,
    `publishedAt: ${yamlString(meta.publishedAt)}`,
    `accessedAt: ${yamlString(meta.accessedAt)}`,
    `category: ${yamlString(meta.category)}`,
    `tags: ${yamlList(meta.tags)}`,
    `verificationStatus: ${meta.verificationStatus || "needs-verification"}`,
    "---"
  ].join("\n");
}

function section(body, heading) {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = body.match(pattern);
  return match ? match[1].trim() : "";
}

function listSection(body, heading) {
  return section(body, heading)
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter(Boolean);
}

function replaceSection(body, heading, content) {
  const next = `## ${heading}\n${content.trim()}\n`;
  const pattern = new RegExp(`## ${heading}\\n[\\s\\S]*?(?=\\n## |$)`, "i");
  if (pattern.test(body)) return body.replace(pattern, next.trimEnd());
  return `${body.trim()}\n\n${next}`;
}

async function findEntryFile(entryId) {
  const knowledgeDir = path.join(repoRoot, "knowledge");
  const sourceDirs = await readdir(knowledgeDir, { withFileTypes: true });
  for (const sourceDir of sourceDirs) {
    if (!sourceDir.isDirectory()) continue;
    const dir = path.join(knowledgeDir, sourceDir.name, "entries");
    let files = [];
    try {
      files = await readdir(dir);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    for (const file of files.filter((item) => item.endsWith(".md"))) {
      const filePath = path.join(dir, file);
      const markdown = await readFile(filePath, "utf8");
      const { meta } = parseFrontmatter(markdown);
      if ((meta.id || file.replace(/\.md$/, "")) === entryId) return filePath;
    }
  }
  return "";
}

function removeCandidate(candidatesData, candidateId) {
  const before = candidatesData.candidates.length;
  candidatesData.candidates = candidatesData.candidates.filter((candidate) => candidate.id !== candidateId);
  if (before === candidatesData.candidates.length) throw new Error(`Candidate not found: ${candidateId}`);
  candidatesData.updatedAt = today;
}

async function rebuildIndex(dryRun) {
  if (dryRun) return;
  const result = spawnSync(process.execPath, ["scripts/build-knowledge-index.mjs"], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) throw new Error("Failed to rebuild knowledge index");
}

async function approveCandidate(candidate, candidatesData, dryRun) {
  const id = candidateEntryId(candidate);
  const filePath = path.join(entriesRoot, `${id}.md`);
  if (existsSync(filePath)) throw new Error(`Entry file already exists: ${path.relative(repoRoot, filePath)}`);

  removeCandidate(candidatesData, candidate.id);
  if (!dryRun) {
    await mkdir(entriesRoot, { recursive: true });
    await writeFile(filePath, candidateToMarkdown(candidate), "utf8");
    await writeJson(candidatesPath, candidatesData, false);
  }
  await rebuildIndex(dryRun);

  return {
    action: "approve",
    candidateId: candidate.id,
    entryId: id,
    file: path.relative(repoRoot, filePath)
  };
}

async function rejectCandidate(candidate, candidatesData, dryRun) {
  const rejectedData = await readJson(rejectedPath, { version: 1, updatedAt: today, rejected: [] });
  removeCandidate(candidatesData, candidate.id);
  rejectedData.rejected = [
    {
      id: candidate.id,
      title: candidate.title,
      sourceUrl: candidate.sourceUrl || "",
      rejectedAt: today,
      reason: "Rejected during review"
    },
    ...(rejectedData.rejected || []).filter((item) => item.id !== candidate.id)
  ];
  rejectedData.updatedAt = today;

  if (!dryRun) {
    await writeJson(candidatesPath, candidatesData, false);
    await writeJson(rejectedPath, rejectedData, false);
  }

  return {
    action: "reject",
    candidateId: candidate.id
  };
}

async function mergeCandidate(candidate, targetId, candidatesData, dryRun) {
  if (!targetId) throw new Error("--merge requires --into <entry-id>");
  const filePath = await findEntryFile(targetId);
  if (!filePath) throw new Error(`Target entry not found: ${targetId}`);

  const markdown = await readFile(filePath, "utf8");
  const { meta, body } = parseFrontmatter(markdown);
  meta.tags = uniqueList([...(Array.isArray(meta.tags) ? meta.tags : []), ...(candidate.tags || [])]);
  meta.accessedAt = meta.accessedAt || today;

  let nextBody = body;
  nextBody = replaceSection(nextBody, "Key Concepts", markdownList([...listSection(nextBody, "Key Concepts"), ...(candidate.concepts || [])]));
  nextBody = replaceSection(nextBody, "Practical Principles", markdownList([...listSection(nextBody, "Practical Principles"), ...(candidate.principles || [])]));
  nextBody = replaceSection(nextBody, "Applications", markdownList([...listSection(nextBody, "Applications"), ...(candidate.applications || [])]));
  nextBody = replaceSection(
    nextBody,
    "Connections",
    markdownList([...listSection(nextBody, "Connections"), ...(candidate.connections || []).filter((connection) => connection !== targetId)])
  );

  removeCandidate(candidatesData, candidate.id);
  if (!dryRun) {
    await writeFile(filePath, `${serializeFrontmatter(meta)}\n${nextBody.startsWith("\n") ? "" : "\n"}${nextBody.trim()}\n`, "utf8");
    await writeJson(candidatesPath, candidatesData, false);
  }
  await rebuildIndex(dryRun);

  return {
    action: "merge",
    candidateId: candidate.id,
    targetId,
    file: path.relative(repoRoot, filePath)
  };
}

async function readActions(args) {
  if (args.reviewFile) {
    const reviewData = await readJson(args.reviewFile, []);
    const actions = Array.isArray(reviewData) ? reviewData : reviewData.actions || [];
    return actions.map((action) => ({
      action: action.action || action.type,
      candidateId: action.candidateId || action.id,
      into: action.into || action.entryId || ""
    }));
  }

  const actions = [];
  if (args.approve) actions.push({ action: "approve", candidateId: args.approve });
  if (args.reject) actions.push({ action: "reject", candidateId: args.reject });
  if (args.merge) actions.push({ action: "merge", candidateId: args.merge, into: args.into });
  return actions;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const actions = await readActions(args);
  if (!actions.length) {
    throw new Error("Provide --approve, --reject, --merge, or --review-file");
  }

  const candidatesData = await readJson(candidatesPath, { version: 1, updatedAt: today, candidates: [] });
  const results = [];

  for (const action of actions) {
    const candidate = candidatesData.candidates.find((item) => item.id === action.candidateId);
    if (!candidate) throw new Error(`Candidate not found: ${action.candidateId}`);

    if (action.action === "approve") {
      results.push(await approveCandidate(candidate, candidatesData, args.dryRun));
    } else if (action.action === "reject") {
      results.push(await rejectCandidate(candidate, candidatesData, args.dryRun));
    } else if (action.action === "merge") {
      results.push(await mergeCandidate(candidate, action.into, candidatesData, args.dryRun));
    } else {
      throw new Error(`Unsupported action: ${action.action}`);
    }
  }

  console.log(JSON.stringify({ dryRun: args.dryRun, results }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

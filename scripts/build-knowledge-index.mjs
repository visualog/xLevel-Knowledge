import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const knowledgeDir = join(root, "knowledge");
const outputFile = join(root, "knowledge", "data", "knowledge.json");

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

async function readExistingOutput() {
  try {
    return JSON.parse(await readFile(outputFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { entries: [] };
    throw error;
  }
}

async function main() {
  const existingOutput = await readExistingOutput();
  const existingById = new Map((existingOutput.entries || []).map((entry) => [entry.id, entry]));
  const existingOrder = new Map((existingOutput.entries || []).map((entry, index) => [entry.id, index]));
  const sourceDirs = await readdir(knowledgeDir, { withFileTypes: true });
  const entriesDirs = [];
  for (const sourceDir of sourceDirs) {
    if (!sourceDir.isDirectory()) continue;
    const entriesDir = join(knowledgeDir, sourceDir.name, "entries");
    try {
      await readdir(entriesDir);
      entriesDirs.push(entriesDir);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const entries = [];

  for (const entriesDir of entriesDirs.sort()) {
    const files = (await readdir(entriesDir)).filter((file) => file.endsWith(".md")).sort();
    for (const file of files) {
      const markdown = await readFile(join(entriesDir, file), "utf8");
      const { meta, body } = parseFrontmatter(markdown);
      const parsed = {
        id: meta.id || file.replace(/\.md$/, ""),
        title: meta.title || body.match(/^# (.+)$/m)?.[1] || file.replace(/\.md$/, ""),
        sourceUrl: meta.sourceUrl || "",
        sourceName: meta.sourceName || "",
        author: meta.author || "",
        publishedAt: meta.publishedAt || "",
        accessedAt: meta.accessedAt || "",
        category: meta.category || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        summary: section(body, "Summary"),
        concepts: listSection(body, "Key Concepts"),
        principles: listSection(body, "Practical Principles"),
        applications: listSection(body, "Applications"),
        connections: listSection(body, "Connections"),
        verificationStatus: meta.verificationStatus || "needs-verification"
      };
      entries.push({ ...(existingById.get(parsed.id) || {}), ...parsed });
    }
  }

  entries.sort((left, right) => {
    const leftOrder = existingOrder.has(left.id) ? existingOrder.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightOrder = existingOrder.has(right.id) ? existingOrder.get(right.id) : Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder || left.id.localeCompare(right.id, "ko");
  });

  await writeFile(
    outputFile,
    JSON.stringify({ version: 1, updatedAt: new Date().toISOString().slice(0, 10), entries }, null, 2) + "\n",
    "utf8"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

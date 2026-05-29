import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const entriesDir = join(root, "knowledge", "plusx-flex", "entries");
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

async function main() {
  const files = (await readdir(entriesDir)).filter((file) => file.endsWith(".md"));
  const entries = [];

  for (const file of files) {
    const markdown = await readFile(join(entriesDir, file), "utf8");
    const { meta, body } = parseFrontmatter(markdown);
    entries.push({
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
    });
  }

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


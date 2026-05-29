import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 8090);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function safePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const resolved = path.resolve(repoRoot, cleanPath || "knowledge/site/index.html");
  if (!resolved.startsWith(repoRoot)) return "";
  return resolved;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${host}:${port}`);
  let filePath = safePath(url.pathname === "/" ? "/knowledge/site/index.html" : url.pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    } else if (!existsSync(filePath) && !path.extname(filePath)) {
      filePath = path.join(filePath, "index.html");
    }
    const data = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "cache-control": path.extname(filePath) === ".json" ? "no-store" : "no-cache"
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

async function applyReviewActions(request, response) {
  const body = await readBody(request);
  const actions = Array.isArray(body) ? body : body.actions || [];
  const dryRun = Boolean(body.dryRun);
  if (!actions.length) {
    sendJson(response, 400, { ok: false, error: "No review actions provided" });
    return;
  }

  const reviewFile = path.join(os.tmpdir(), `xlevel-review-actions-${Date.now()}.json`);
  await writeFile(reviewFile, JSON.stringify({ version: 1, actions }, null, 2) + "\n", "utf8");
  const args = ["scripts/apply-candidates.mjs"];
  if (dryRun) args.push("--dry-run");
  args.push("--review-file", reviewFile);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });

  let payload = null;
  try {
    payload = result.stdout ? JSON.parse(result.stdout) : null;
  } catch {
    payload = null;
  }

  sendJson(response, result.status === 0 ? 200 : 500, {
    ok: result.status === 0,
    dryRun,
    actions: actions.length,
    result: payload,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${host}:${port}`);
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        mode: "local-write-bridge",
        applyCommand: "scripts/apply-candidates.mjs"
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/apply-review-actions") {
      await applyReviewActions(request, response);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response);
      return;
    }

    sendJson(response, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`xLevel Knowledge server running at http://${host}:${port}/knowledge/site/`);
});

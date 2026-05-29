import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const homeDir = os.homedir();
const defaultLabel = "com.xlevel.knowledge.automation";
const launchAgentsDir = path.join(homeDir, "Library/LaunchAgents");

function parseArgs(argv) {
  const args = {
    action: argv[0] || "print",
    label: defaultLabel,
    intervalSeconds: 6 * 60 * 60,
    configPath: path.join(repoRoot, "knowledge/data/automation-cycle.example.json")
  };

  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--label") {
      args.label = argv[index + 1] || args.label;
      index += 1;
    } else if (value === "--interval-seconds") {
      args.intervalSeconds = Number(argv[index + 1] || args.intervalSeconds);
      index += 1;
    } else if (value === "--config") {
      args.configPath = path.resolve(repoRoot, argv[index + 1] || args.configPath);
      index += 1;
    }
  }

  if (!Number.isFinite(args.intervalSeconds) || args.intervalSeconds < 300) {
    args.intervalSeconds = 6 * 60 * 60;
  }

  return args;
}

function plistPath(label) {
  return path.join(launchAgentsDir, `${label}.plist`);
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plist(args) {
  const logDir = path.join(repoRoot, "logs");
  const stdoutPath = path.join(logDir, "automation-cycle.out.log");
  const stderrPath = path.join(logDir, "automation-cycle.err.log");
  const nodePath = process.execPath;
  const runnerPath = path.join(repoRoot, "scripts/run-automation-cycle.mjs");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${xmlEscape(args.label)}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xmlEscape(nodePath)}</string>
    <string>${xmlEscape(runnerPath)}</string>
    <string>--config</string>
    <string>${xmlEscape(args.configPath)}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xmlEscape(repoRoot)}</string>
  <key>StartInterval</key>
  <integer>${Math.trunc(args.intervalSeconds)}</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${xmlEscape(stdoutPath)}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(stderrPath)}</string>
</dict>
</plist>
`;
}

function launchctl(args) {
  return spawnSync("launchctl", args, {
    encoding: "utf8"
  });
}

async function install(args) {
  await mkdir(launchAgentsDir, { recursive: true });
  await mkdir(path.join(repoRoot, "logs"), { recursive: true });
  const target = plistPath(args.label);
  await writeFile(target, plist(args), "utf8");
  launchctl(["bootout", `gui/${process.getuid()}`, target]);
  const result = launchctl(["bootstrap", `gui/${process.getuid()}`, target]);
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `launchctl bootstrap failed with status ${result.status}`);
  }
  return {
    action: "install",
    label: args.label,
    plist: target,
    intervalSeconds: args.intervalSeconds
  };
}

async function uninstall(args) {
  const target = plistPath(args.label);
  if (existsSync(target)) {
    launchctl(["bootout", `gui/${process.getuid()}`, target]);
    await unlink(target);
  }
  return {
    action: "uninstall",
    label: args.label,
    plist: target,
    removed: true
  };
}

async function status(args) {
  const result = launchctl(["print", `gui/${process.getuid()}/${args.label}`]);
  return {
    action: "status",
    label: args.label,
    installed: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;

  if (args.action === "print") {
    console.log(plist(args));
    return;
  }
  if (args.action === "install") {
    result = await install(args);
  } else if (args.action === "uninstall") {
    result = await uninstall(args);
  } else if (args.action === "status") {
    result = await status(args);
  } else {
    throw new Error("Use one of: print, install, uninstall, status");
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

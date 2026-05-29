# Plan: launchd Scheduler

Date: 2026-05-30
Task: Add macOS launchd scheduler tooling for the self-learning automation cycle.

## Objective

Provide a safe way to install, uninstall, and inspect a recurring local scheduler that runs the dry-run automation cycle.

## Current State

`scripts/run-automation-cycle.mjs` is a stable runner, but no OS-level scheduler artifact exists yet.

## Plan

1. Add `scripts/install-automation-scheduler.mjs`.
2. Generate a launchd plist under `~/Library/LaunchAgents`.
3. Default to dry-run automation config.
4. Support `install`, `uninstall`, `print`, and `status` actions.
5. Keep scheduler logs in `logs/`.
6. Update goal documents with install/uninstall commands.

## Expected Change Areas

- `scripts/install-automation-scheduler.mjs`
- `docs/self-learning-knowledge-automation-goal.md`
- `knowledge/agent-goals/self-learning-knowledge-automation-goal.md`
- `notes/launchd-scheduler-completion-report.md`

## Risks And Assumptions

- Actual `launchctl bootstrap` modifies user launchd state, so verification should use `print` unless the operator explicitly wants installation.
- The scheduled job should run dry-run config by default.
- Logs should stay outside knowledge data files.

## Verification Plan

- `node --check scripts/install-automation-scheduler.mjs`
- `node scripts/install-automation-scheduler.mjs print`
- Verify the printed plist references `scripts/run-automation-cycle.mjs` and `knowledge/data/automation-cycle.example.json`.

## Before Screenshots

![Before](./screenshots/launchd-scheduler-2026-05-30/before-fullscreen.png)

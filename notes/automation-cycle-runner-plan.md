# Plan: Automation Cycle Runner

Date: 2026-05-30
Task: Add a safe repeatable runner for the self-learning automation loop.

## Objective

Create one stable command that operators or schedulers can run repeatedly without remembering the full `run-learning-loop` argument set.

## Current State

`scripts/run-learning-loop.mjs` can run discovery, search, search ingest, review dry-runs, and rebuilds. It is flexible but verbose, and there is no durable config file for routine execution.

## Plan

1. Add `knowledge/data/automation-cycle.example.json`.
2. Add `scripts/run-automation-cycle.mjs`.
3. Default the cycle to `dryRun: true`.
4. Build `run-learning-loop` arguments from config and optional CLI overrides.
5. Write a cycle report path when configured.
6. Update the goal documents with the operational command.

## Expected Change Areas

- `scripts/run-automation-cycle.mjs`
- `knowledge/data/automation-cycle.example.json`
- `docs/self-learning-knowledge-automation-goal.md`
- `knowledge/agent-goals/self-learning-knowledge-automation-goal.md`
- `notes/automation-cycle-runner-completion-report.md`

## Risks And Assumptions

- Automation must remain review-first and dry-run by default.
- A scheduler should call this script, not auto-approve results.
- Git commit and push remain explicit operator actions.

## Verification Plan

- `node --check scripts/run-automation-cycle.mjs`
- `node scripts/run-automation-cycle.mjs --config knowledge/data/automation-cycle.example.json`
- Confirm the generated report includes collect, search, and searchIngest steps.
- Confirm repository data files are not mutated by the default example config.

## Before Screenshots

![Before](./screenshots/automation-cycle-runner-2026-05-30/before-fullscreen.png)

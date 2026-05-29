# Plan: Fabric Note Workflow Correction

Date: 2026-05-29
Task: Correct the Fabric note workflow to use repository-local Markdown notes and macOS screenshots.

## Objective

Replace the previous Fabric-tool-dependent wording with the actual workflow for this repo: Fabric notes are Markdown files in `notes/`, and before/after screenshots are saved with macOS `screencapture`.

## Current State

- The repository had a fallback-oriented rule under `docs/fabric-notes/`.
- The wording implied Fabric sync was pending when no Fabric tool was available.
- The user clarified that Fabric notes should be created directly as Markdown files in `notes/`.

## Plan

1. Update `AGENTS.md` to require `notes/` plan/report files.
2. Rewrite `docs/fabric-note-workflow.md` around `notes/` and `screencapture`.
3. Add `notes/README.md`.
4. Remove the stale Fabric-sync-pending documents.
5. Verify that no obsolete blocker language remains.

## Expected Change Areas

- `AGENTS.md`
- `docs/fabric-note-workflow.md`
- `notes/`
- `docs/fabric-notes/`

## Risks And Assumptions

- This setup task does not need before/after UI screenshots because it changes repo workflow documentation, not a visual UI.
- Future UI tasks must capture actual before/after screens under `notes/screenshots/`.

## Verification Plan

- Search for stale “Fabric sync pending” wording.
- Confirm `notes/README.md` exists.
- Confirm `AGENTS.md` references `notes/`.

## Before Screenshots

Not applicable for this documentation-only correction.


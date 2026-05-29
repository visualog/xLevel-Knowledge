# Plan: Manual URL Adapter

Date: 2026-05-30
Task: Add manual URL input support to the review-first discovery pipeline.

## Objective

Allow operators to seed the learning loop with specific source URLs or URL-list files, extracting only source-safe metadata into review-needed candidates.

## Current State

The collector supports deterministic generation, curated JSON source files, and RSS/Atom feed metadata. It does not yet accept ad hoc URL inputs.

## Plan

1. Add `--url <path-or-url>` and `--url-file <path>` to `scripts/collect-knowledge.mjs`.
2. Extract HTML metadata only: title, canonical URL, site name, author, publication date, and meta description.
3. Convert each URL source into a review-needed candidate with source links, category inference, duplicate scoring, and existing-entry connections.
4. Pass the options through `scripts/run-learning-loop.mjs`.
5. Add deterministic local fixtures for verification without network access.
6. Update the goal document to mark manual URL input as implemented.

## Expected Change Areas

- `scripts/collect-knowledge.mjs`
- `scripts/run-learning-loop.mjs`
- `knowledge/data/url-seeds.example.txt`
- `knowledge/data/url-source.example.html`
- `docs/self-learning-knowledge-automation-goal.md`
- `knowledge/agent-goals/self-learning-knowledge-automation-goal.md`
- `notes/manual-url-adapter-completion-report.md`

## Risks And Assumptions

- Live URL fetching may require network approval in sandboxed runs.
- The adapter should never store full page bodies.
- Local HTML fixture verification is the stable baseline.

## Verification Plan

- `node --check scripts/collect-knowledge.mjs`
- `node --check scripts/run-learning-loop.mjs`
- `node scripts/collect-knowledge.mjs --dry-run --url-file knowledge/data/url-seeds.example.txt --limit 5`
- `node scripts/run-learning-loop.mjs --dry-run --url-file knowledge/data/url-seeds.example.txt --limit 5`

## Before Screenshots

![Before](./screenshots/manual-url-adapter-2026-05-30/before-fullscreen.png)

# Plan: Source File Adapter

Date: 2026-05-29
Task: Add the first real discovery adapter for curated external source metadata.

## Objective

Extend `scripts/collect-knowledge.mjs` so it can turn curated source metadata into review-needed candidates with source URLs, classifications, and recommended links.

## Current State

Candidate collection is deterministic and generates placeholder discovery queries. The goal document calls for initial adapters such as curated URL list input, RSS/feed input, and manual URL input.

## Plan

1. Add `--source-file <path>` to `scripts/collect-knowledge.mjs`.
2. Read a JSON file containing `sources`.
3. Convert each source into a review-needed candidate.
4. Score duplicates and link candidates to existing entries.
5. Add an example source file.
6. Pass `--source-file` through `scripts/run-learning-loop.mjs`.

## Expected Change Areas

- `scripts/collect-knowledge.mjs`
- `scripts/run-learning-loop.mjs`
- `knowledge/data/source-seeds.example.json`
- `notes/source-file-adapter-completion-report.md`

## Risks And Assumptions

- The adapter only uses provided metadata; it does not fetch article bodies.
- Source-specific claims remain `needs-verification`.
- This is a safe stepping stone before live web/RSS adapters.

## Verification Plan

- `node --check scripts/collect-knowledge.mjs`
- `node scripts/collect-knowledge.mjs --dry-run --source-file knowledge/data/source-seeds.example.json --limit 5`
- `node scripts/run-learning-loop.mjs --dry-run --source-file knowledge/data/source-seeds.example.json --limit 5`

## Before Screenshots

![Before](./screenshots/source-file-adapter-2026-05-29/before-fullscreen.png)

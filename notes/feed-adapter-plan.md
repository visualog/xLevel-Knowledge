# Plan: RSS Feed Adapter

Date: 2026-05-29
Task: Add RSS/feed input support to the review-first discovery pipeline.

## Objective

Allow `scripts/collect-knowledge.mjs` to ingest RSS or Atom feed metadata as review-needed candidates without storing article bodies.

## Current State

The collector supports deterministic candidate generation and curated JSON source files. It does not yet read feed metadata.

## Plan

1. Add `--feed-file <path-or-url>` to `scripts/collect-knowledge.mjs`.
2. Parse RSS and Atom item metadata: title, link, author, publication date, summary.
3. Convert feed items into review-needed candidates with source metadata.
4. Pass `--feed-file` through `scripts/run-learning-loop.mjs`.
5. Add a local fixture for deterministic verification.

## Expected Change Areas

- `scripts/collect-knowledge.mjs`
- `scripts/run-learning-loop.mjs`
- `knowledge/data/feed-seeds.example.xml`
- `notes/feed-adapter-completion-report.md`

## Risks And Assumptions

- This adapter stores feed metadata and generated summaries only, not full article bodies.
- Feed parsing stays intentionally small and dependency-free.
- Live feed URL fetching may require network approval; local fixture verification is the stable baseline.

## Verification Plan

- `node --check scripts/collect-knowledge.mjs`
- `node scripts/collect-knowledge.mjs --dry-run --feed-file knowledge/data/feed-seeds.example.xml --limit 5`
- `node scripts/run-learning-loop.mjs --dry-run --feed-file knowledge/data/feed-seeds.example.xml --limit 5`

## Before Screenshots

![Before](./screenshots/feed-adapter-2026-05-29/before-fullscreen.png)

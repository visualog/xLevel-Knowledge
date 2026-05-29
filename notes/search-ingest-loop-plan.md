# Plan: Search Ingest Loop

Date: 2026-05-30
Task: Let the learning loop ingest search-discovered source seeds as candidates.

## Objective

Close the loop from generated discovery queries to search-discovered source metadata to review-needed candidates inside one `run-learning-loop` command.

## Current State

`run-learning-loop` can collect candidate queries and call `scripts/search-discovery.mjs` to create source seed JSON. A separate command is still needed to feed that source seed back into `collect-knowledge --source-file`.

## Plan

1. Add `--ingest-search-results` to `scripts/run-learning-loop.mjs`.
2. After `search-discovery`, run `scripts/collect-knowledge.mjs --source-file <search-out>`.
3. Preserve review-first behavior: dry-run should not mutate candidates, non-dry-run can write candidate queue.
4. Include the ingest step in the structured learning-loop report.
5. Update goal docs with a single-command search ingest example.

## Expected Change Areas

- `scripts/run-learning-loop.mjs`
- `docs/self-learning-knowledge-automation-goal.md`
- `knowledge/agent-goals/self-learning-knowledge-automation-goal.md`
- `notes/search-ingest-loop-completion-report.md`

## Risks And Assumptions

- `--ingest-search-results` requires `--search-out`.
- Search provider output may be empty; the ingest step should still report clearly.
- No approval should happen automatically.

## Verification Plan

- `node --check scripts/run-learning-loop.mjs`
- `node scripts/run-learning-loop.mjs --dry-run --query-out /private/tmp/xlevel-loop-queries.json --search-out /private/tmp/xlevel-loop-sources.json --search-mock-html knowledge/data/search-results.example.html --ingest-search-results --limit 5`
- Verify candidates and knowledge data are not mutated in dry-run.

## Before Screenshots

![Before](./screenshots/search-ingest-loop-2026-05-30/before-fullscreen.png)

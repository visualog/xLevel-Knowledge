# Knowledge Collection Automation Plan

Date: 2026-05-29

## Goal

Build a deterministic, review-first candidate generation pipeline for `knowledge/data/knowledge.json`. The pipeline should analyze current entries, find weak or repeated knowledge patterns, generate related discovery candidates, link candidates back to existing entries, and save them to `knowledge/data/candidates.json`.

## Scope

This pass will focus on scripts and data generation, not UI. The goal document allows UI to be recorded as follow-up if it is too large for the current pass.

## Current Findings

- `knowledge/data/knowledge.json` exists and contains the approved knowledge entries.
- `knowledge/data/candidates.json` does not exist yet.
- `scripts/collect-knowledge.mjs` does not exist yet.
- Existing scripts are import/build helpers, not candidate discovery automation.

## Implementation Plan

1. Create `scripts/collect-knowledge.mjs`.
2. Support:
   - `node scripts/collect-knowledge.mjs`
   - `node scripts/collect-knowledge.mjs --dry-run`
   - `node scripts/collect-knowledge.mjs --limit 10`
   - `node scripts/collect-knowledge.mjs --out knowledge/data/candidates.json`
3. Analyze entries for:
   - connection count
   - category counts
   - repeated tags and concepts
   - low-link entries with useful concepts
4. Generate candidate cards from:
   - weakly connected entries
   - repeated concepts
   - adjacent category opportunities
5. Score candidates for relevance, trust, and duplicate risk.
6. Deduplicate against existing entries and existing candidates.
7. Save review-needed candidates to `knowledge/data/candidates.json`.

## Verification

- `node --check scripts/collect-knowledge.mjs`
- `node scripts/collect-knowledge.mjs --dry-run`
- `node scripts/collect-knowledge.mjs --limit 10`
- Confirm `knowledge/data/candidates.json` exists.
- Confirm at least 10 candidates exist.
- Confirm candidates include `connections` and required `candidateMeta` fields.


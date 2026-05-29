# Plan: Durable Apply Flow

Date: 2026-05-29
Task: Implement Phase 1 of `docs/self-learning-knowledge-automation-goal.md`.

## Objective

Add a script that applies reviewed candidates back into durable repository files instead of keeping approvals only in browser localStorage.

## Current State

Candidates are generated in `knowledge/data/candidates.json` and visible in the site. The site can approve, reject, or merge locally, but there is no repository-writing apply command.

## Plan

1. Create `scripts/apply-candidates.mjs`.
2. Support `--approve`, `--reject`, `--merge --into`, `--review-file`, and `--dry-run`.
3. On approve, create a Markdown entry, remove the candidate, and rebuild `knowledge/data/knowledge.json`.
4. On reject, remove the candidate and append a compact rejected-candidate record to avoid losing review context.
5. On merge, update an existing Markdown entry by adding unique tags, concepts, principles, applications, and connections, then rebuild the index.
6. Add verification and completion notes.

## Expected Change Areas

- `scripts/apply-candidates.mjs`
- `knowledge/data/rejected-candidates.json`
- `notes/durable-apply-flow-completion-report.md`

## Risks And Assumptions

- Candidate entries with no `sourceUrl` remain `needs-verification`.
- The script should avoid destructive overwrites and fail if an approved entry file already exists.
- `scripts/build-knowledge-index.mjs` remains the source of truth for rebuilding normalized JSON.

## Verification Plan

- `node --check scripts/apply-candidates.mjs`
- `node scripts/apply-candidates.mjs --dry-run --approve <candidate-id>`
- `node scripts/apply-candidates.mjs --dry-run --reject <candidate-id>`
- `node scripts/apply-candidates.mjs --dry-run --merge <candidate-id> --into <entry-id>`
- `node scripts/apply-candidates.mjs --dry-run --review-file <temp-review-file>`

## Before Screenshots

![Before](./screenshots/durable-apply-flow-2026-05-29/before-fullscreen.png)

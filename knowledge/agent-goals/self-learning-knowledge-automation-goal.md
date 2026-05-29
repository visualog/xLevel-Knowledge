# Self-Learning Knowledge Automation Agent Goal

Use this goal when the user asks to make xLevel Knowledge learn continuously from external sources, review generated candidates, and apply approved knowledge back into the repository.

Full goal document:

`docs/self-learning-knowledge-automation-goal.md`

## Start Here

1. Read `AGENTS.md`.
2. Read `knowledge/README.md`.
3. Read `knowledge/schema.md`.
4. Read `docs/self-learning-knowledge-automation-goal.md`.
5. Search existing `knowledge/`, `scripts/`, and `knowledge/site/` before editing.
6. Follow the Fabric note workflow for planning notes, screenshots, completion reports, and verification.

## First Implementation Target

Start with Phase 1 from the full goal:

- create `scripts/apply-candidates.mjs`
- support approve, reject, merge, and review-file workflows
- make approved candidates durable by updating Markdown entries and rebuilt JSON data
- keep all source handling copyright-safe and review-first

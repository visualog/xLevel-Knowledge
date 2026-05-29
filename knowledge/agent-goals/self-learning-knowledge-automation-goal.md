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

## Current Implementation Target

Phase 1 and the local Phase 2 bridge are implemented. Continue from the full goal with Phase 3 and Phase 4:

- add source adapters that discover external source opportunities without storing article bodies
- keep all discovered items review-first
- make the learning loop repeatable through `scripts/run-learning-loop.mjs`
- verify source candidates can be exported or applied through the local bridge
- keep all source handling copyright-safe and review-first

Implemented source adapter inputs:

```bash
node scripts/collect-knowledge.mjs --source-file knowledge/data/source-seeds.example.json
node scripts/collect-knowledge.mjs --feed-file knowledge/data/feed-seeds.example.xml
node scripts/collect-knowledge.mjs --url-file knowledge/data/url-seeds.example.txt
node scripts/collect-knowledge.mjs --url https://example.com/source
node scripts/collect-knowledge.mjs --query-out knowledge/data/discovery-queries.json
node scripts/search-discovery.mjs --query-file knowledge/data/discovery-queries.json --out knowledge/data/search-source-seeds.json
node scripts/collect-knowledge.mjs --source-file knowledge/data/search-source-seeds.json
node scripts/run-learning-loop.mjs --query-out knowledge/data/discovery-queries.json --search-out knowledge/data/search-source-seeds.json --ingest-search-results
node scripts/run-automation-cycle.mjs --config knowledge/data/automation-cycle.example.json
```

Use `--query-out` when the next step needs a human-search handoff. Use `scripts/search-discovery.mjs` to turn those queries into source metadata seeds that can be reviewed through `--source-file`.

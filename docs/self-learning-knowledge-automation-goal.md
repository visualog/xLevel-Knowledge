# Self-Learning Knowledge Automation Goal

Build xLevel Knowledge into a semi-automated self-learning knowledge system.

The system should continuously discover useful external knowledge, summarize it safely, classify it into the local knowledge schema, connect it to existing cards, expose it for review, and apply approved learnings back into the repository as durable files.

## Core Objective

Move the current system from a static knowledge browser plus candidate list into a review-first learning loop:

1. Discover new source opportunities.
2. Extract source metadata and reusable ideas.
3. Classify each source into the existing knowledge schema.
4. Link new candidates to existing knowledge cards.
5. Let the user review, approve, reject, or merge candidates.
6. Persist approved candidates into repository files.
7. Rebuild the normalized index.
8. Keep output copyright-safe, source-linked, and commit-ready.

## Current Context

The repository already has:

- `knowledge/data/knowledge.json`
- `knowledge/data/candidates.json`
- `knowledge/site/`
- `scripts/collect-knowledge.mjs`
- `scripts/build-knowledge-index.mjs`
- candidate review UI in the static site

Current limitations:

- Static-site candidate review actions can still fall back to localStorage/export.
- A local-only write bridge can apply exported review actions when the site is served by `scripts/knowledge-server.mjs`.
- Durable apply flow exists for approve, reject, merge, and review-file workflows.
- Discovery supports deterministic generation, curated JSON sources, RSS/Atom feed metadata, and manual URL metadata extraction.
- Live search/browser/API discovery is not yet fully automated.
- Git commit and push remain explicit operator actions.

Implemented command examples:

```bash
node scripts/collect-knowledge.mjs --dry-run --source-file knowledge/data/source-seeds.example.json --limit 5
node scripts/collect-knowledge.mjs --dry-run --feed-file knowledge/data/feed-seeds.example.xml --limit 5
node scripts/collect-knowledge.mjs --dry-run --url-file knowledge/data/url-seeds.example.txt --limit 5
node scripts/run-learning-loop.mjs --dry-run --feed-file knowledge/data/feed-seeds.example.xml --limit 5
PORT=8091 node scripts/knowledge-server.mjs
```

## Required Behavior

Follow the repository instructions in `AGENTS.md`.

Before implementation:

1. Read `knowledge/README.md`.
2. Read `knowledge/schema.md`.
3. Search existing `knowledge/` and `scripts/` for related patterns.
4. Create a planning note in `notes/`.
5. Capture before screenshots if UI changes are involved.

After implementation:

1. Create a completion report in `notes/`.
2. Capture after screenshots if UI changed.
3. Run relevant verification commands.
4. Keep the repository in a commit-ready state.

## Implementation Priorities

### Phase 1: Durable Apply Flow

Implement a safe way to turn reviewed candidates into durable repository knowledge.

Preferred approach:

- Add `scripts/apply-candidates.mjs`.

The script should support:

```bash
node scripts/apply-candidates.mjs --approve <candidate-id>
node scripts/apply-candidates.mjs --reject <candidate-id>
node scripts/apply-candidates.mjs --merge <candidate-id> --into <entry-id>
node scripts/apply-candidates.mjs --review-file <path>
```

Approval should:

- Remove the candidate from `knowledge/data/candidates.json`.
- Create a Markdown entry using `knowledge/schema.md`.
- Add or update normalized data.
- Run or reuse `scripts/build-knowledge-index.mjs`.
- Preserve source metadata.
- Mark unverifiable items as `needs-verification`.

Rejection should:

- Remove or mark the candidate rejected.
- Avoid rediscovery if possible.

Merge should:

- Add useful tags, concepts, principles, applications, and connections to an existing entry.
- Avoid duplicate list values.
- Preserve existing user-authored content.

### Phase 2: Site-To-Repo Bridge

Upgrade the review UI so site actions can be exported or applied.

If staying static:

- Add an `Export Review Actions` button.
- Store actions as JSON.
- Let `scripts/apply-candidates.mjs --review-file` apply them.

If adding a local server is reasonable:

- Add a minimal local Node server.
- Serve `knowledge/site/`.
- Expose local-only endpoints for approve, reject, and merge.
- Never expose write endpoints publicly.
- Keep static fallback working.

### Phase 3: Real Discovery

Extend `scripts/collect-knowledge.mjs` beyond placeholder candidates.

Add a source adapter architecture, but keep it simple.

Initial adapters may include:

- curated URL list input: implemented with `--source-file`
- RSS or feed input: implemented with `--feed-file`
- manual URL input: implemented with `--url` and `--url-file`
- search query output for human review
- later: browser or search API integration

For each discovered source, collect:

- source URL
- title
- author
- publication date
- source name
- access date
- short source-safe summary
- reusable concepts
- practical principles
- applications
- recommended connections
- verification status

Do not store copied article bodies.

### Phase 4: Continuous Loop

Add commands that make the loop repeatable:

```bash
node scripts/collect-knowledge.mjs --limit 20
node scripts/apply-candidates.mjs --review-file knowledge/data/review-actions.json
node scripts/build-knowledge-index.mjs
```

Optionally add:

```bash
node scripts/run-learning-loop.mjs
```

This should orchestrate discovery, candidate generation, validation, and reporting without automatically approving unverified sources.

## Product Rules

- Review-first by default.
- Never auto-approve web-discovered content.
- Do not store full article text.
- Separate facts from interpretation.
- Keep source URLs and metadata.
- Mark uncertain claims as `needs-verification`.
- Prefer official or primary sources when exact claims matter.
- Keep generated summaries short, original, and reusable.
- The site should make the automation visible and understandable without requiring users to inspect JSON files.

## UI Expectations

The site should clearly show:

- knowledge cards
- candidate review queue
- source status
- discovery query or source URL
- why the candidate was suggested
- relevance, trust, and duplicate risk
- recommended existing connections
- approval state
- what will happen when approving

Avoid hidden or ambiguous controls. If an action writes only localStorage, say so in the UI. If an action writes repository files, say so in the UI.

## Verification

Run at minimum:

```bash
node --check scripts/collect-knowledge.mjs
node --check scripts/apply-candidates.mjs
node --check knowledge/site/app.js
node scripts/collect-knowledge.mjs --dry-run
node scripts/collect-knowledge.mjs --limit 10
```

If apply flow is implemented, test with a temporary candidate or dry-run mode:

```bash
node scripts/apply-candidates.mjs --dry-run --approve <candidate-id>
```

Verify:

- Candidate count changes correctly.
- Approved entries follow `knowledge/schema.md`.
- `knowledge/data/knowledge.json` rebuilds successfully.
- No full source bodies are stored.
- Existing entries are not overwritten destructively.
- UI still loads cards, graph, and candidates.

## Completion Report

When complete, report:

- what part of the learning loop now works
- what remains manual
- which files changed
- which commands passed
- how to run the next learning cycle
- whether changes were committed and pushed

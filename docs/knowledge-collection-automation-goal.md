# Knowledge Collection Automation Goal

Build a semi-automated knowledge collection pipeline that reads the current `knowledge/data/knowledge.json`, discovers related knowledge opportunities, classifies and links candidates, and generates follow-up discovery topics.

The goal is not a simple crawler. It is a review-first knowledge collection agent loop:

1. Read current knowledge data.
2. Analyze concepts, tags, categories, and connections.
3. Find weakly connected clusters and missing adjacent topics.
4. Generate search queries.
5. Collect or prepare candidate source metadata.
6. Score duplicate risk, trust, and relevance.
7. Generate candidate knowledge cards.
8. Recommend links to existing entries.
9. Save candidates to `knowledge/data/candidates.json`.
10. Allow approved candidates to be merged into `knowledge/data/knowledge.json`.

## Product Context

This product collects knowledge from many sources, classifies it, links it, and helps users reuse it as project judgment criteria. It must not depend on a single source. Plus X/플엑익힘책 data is only the initial seed. Future sources may include Brunch, official documentation, design system docs, research articles, case studies, books, and paper metadata.

## Important Principle

Do not write automatically discovered items directly into `knowledge/data/knowledge.json`.

First save them as review-needed candidates in `knowledge/data/candidates.json`. Automated collection can produce false positives, duplicates, low-quality sources, and copyright risk. The default policy is review-first.

## Required Workflow

Use this repo's Fabric note convention. Do not require a Fabric tool.

Before editing code:

1. Create `notes/knowledge-collection-automation-plan.md`.
2. If UI changes are required, create `notes/screenshots/knowledge-collection-automation-2026-05-29/`.
3. If UI changes are required, capture before screenshot:
   - `notes/screenshots/knowledge-collection-automation-2026-05-29/before-fullscreen.png`

After implementation and verification:

1. Create `notes/knowledge-collection-automation-completion-report.md`.
2. If UI changed, capture after screenshot:
   - `notes/screenshots/knowledge-collection-automation-2026-05-29/after-fullscreen.png`
3. Include screenshot Markdown links in the notes when screenshots exist.

## Implementation Scope

### 1. Data Model

Create or update:

- `knowledge/data/candidates.json`

Candidate entries must be compatible with the existing `knowledge.json` entry shape, with extra metadata for review.

Example:

```json
{
  "version": 1,
  "updatedAt": "2026-05-29",
  "candidates": [
    {
      "id": "candidate-slug",
      "title": "Source title",
      "sourceUrl": "https://...",
      "sourceName": "Source name",
      "author": "Author",
      "publishedAt": "YYYY-MM-DD",
      "accessedAt": "YYYY-MM-DD",
      "category": "UX 디자인",
      "tags": ["UX", "리서치"],
      "summary": "짧은 요약",
      "concepts": ["concept"],
      "principles": ["principle"],
      "applications": ["application"],
      "connections": ["existing-entry-id"],
      "verificationStatus": "review-needed",
      "candidateMeta": {
        "discoveredFrom": ["entry-id"],
        "query": "generated search query",
        "relevanceScore": 0.82,
        "trustScore": 0.7,
        "duplicateScore": 0.12,
        "reason": "Why this candidate is useful"
      }
    }
  ]
}
```

### 2. Scripts

Create:

- `scripts/collect-knowledge.mjs`

Responsibilities:

- Read `knowledge/data/knowledge.json`.
- Generate discovery queries from current knowledge.
- Generate candidate source opportunities.
- Generate candidate knowledge cards.
- Recommend links to existing entries.
- Save candidates to `knowledge/data/candidates.json`.

The first implementation does not need to depend on live web crawling. Network access can be unstable. The MVP must be deterministic.

MVP approach:

- Analyze categories, tags, concepts, and connection counts.
- Find weakly connected entries, repeated concepts, and adjacent categories.
- Generate search-query candidates.
- Instead of running external search, generate placeholder candidates with `candidateMeta.query` and `candidateMeta.reason`.
- Keep the structure ready for future real search APIs or browser-based collectors.

Optional modules if they reduce complexity:

- `scripts/knowledge/discover.mjs`
- `scripts/knowledge/classify.mjs`
- `scripts/knowledge/link.mjs`
- `scripts/knowledge/score.mjs`

Avoid unnecessary abstraction if the current repo size does not justify it.

### 3. Candidate Generation

Generate candidates from:

- Low-link entries that still contain important concepts.
- Frequently repeated tags or concepts.
- Adjacent topics to overrepresented categories.
- Topics useful as reusable project judgment criteria.
- Gaps in the current knowledge graph.

Generate at least 10 candidates.

Each candidate must include:

- `title`
- `category`
- `tags`
- `concepts`
- `summary`
- `principles`
- `applications`
- `connections`
- `candidateMeta.query`
- `candidateMeta.relevanceScore`
- `candidateMeta.trustScore`
- `candidateMeta.duplicateScore`
- `candidateMeta.reason`

### 4. Deduplication

Avoid duplicates against both:

- existing `knowledge/data/knowledge.json`
- existing `knowledge/data/candidates.json`

Duplicate signals:

- Same `sourceUrl`.
- Same or very similar title.
- Same query and same `discoveredFrom` combination.
- Excessive concept/tag overlap.

Full embedding search is not required. Use normalized title comparison and simple string-based similarity first.

### 5. Linking

Candidates must be connected to existing knowledge.

Linking signals:

- shared tags
- shared concepts
- same category
- generated query seed
- source or context similarity

Each candidate should include at least one existing entry id in `connections` when possible.

### 6. UI Integration

If feasible, add candidate review UI to the static site.

Minimum UI:

- `Candidates` tab or button
- candidate card list
- relevance/trust/duplicate scores
- recommended connections
- `Approve`, `Reject`, `Merge` actions

MVP actions may use `localStorage`.

Approval behavior:

- Approve: add candidate to knowledge entries and remove from candidates.
- Reject: mark candidate rejected or remove it.
- Merge: enrich an existing entry with candidate concepts, tags, and connections.

If UI work is too large for the current pass, complete scripts and `candidates.json` generation first, and record UI as follow-up in the completion report.

### 7. Commands

These commands must work:

```bash
node scripts/collect-knowledge.mjs
```

Optional supported options:

```bash
node scripts/collect-knowledge.mjs --limit 20
node scripts/collect-knowledge.mjs --dry-run
node scripts/collect-knowledge.mjs --out knowledge/data/candidates.json
```

### 8. Verification

Before marking complete, verify:

- `node --check scripts/collect-knowledge.mjs` passes.
- `node scripts/collect-knowledge.mjs --dry-run` runs.
- `node scripts/collect-knowledge.mjs --limit 10` runs.
- `knowledge/data/candidates.json` is created or updated.
- At least 10 candidates are generated.
- Candidates are linked to existing entry ids when possible.
- Duplicate candidates are not excessive.
- If UI changed, before/after screenshots are saved.
- Completion report exists.

## Output

Report briefly:

- created scripts
- created or updated data files
- candidate count
- verification commands
- whether UI work was included
- follow-up work


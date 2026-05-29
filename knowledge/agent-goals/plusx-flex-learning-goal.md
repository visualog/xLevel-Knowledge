# Agent Goal: Plus X 플엑익힘책 Knowledge Builder

## Objective

Collect the URL list for Plus X's Brunch series "플엑익힘책", read each accessible post, and convert the content into a reusable, source-linked design knowledge base without copying original article bodies.

## Scope

- Source platform: Brunch.
- Target source: Plus X posts in the "플엑익힘책" series.
- Output location: this repository, under `knowledge/plusx-flex/`.
- Management UI data: `knowledge/data/knowledge.json`.

## Operating Principles

- Do not copy or archive full original text.
- Do not use long quotations.
- Preserve source metadata and URLs.
- Separate factual source metadata from agent interpretation.
- Mark inaccessible, duplicate, or uncertain sources clearly.
- Convert articles into reusable principles, concepts, tags, and decision criteria.

## Step 1: Collect URL List

1. Search Brunch for Plus X "플엑익힘책" posts.
2. Prefer source pages controlled by Brunch or Plus X.
3. Collect candidate URLs into `knowledge/plusx-flex/sources/urls.md`.
4. For every candidate URL, record:
   - URL
   - discovered title
   - source page where the URL was found
   - discovered date
   - status: `candidate`, `duplicate`, `inaccessible`, or `ready`
5. Remove exact duplicate URLs.
6. Keep near-duplicates with a note until manually verified.

## Step 2: Verify Sources

For each URL:

1. Open the page.
2. Confirm it is a Plus X "플엑익힘책" post.
3. Capture title, author, publication date, URL, and access date.
4. Mark pages that require login, are deleted, or are blocked as `inaccessible`.

## Step 3: Create Knowledge Cards

For each verified article, create a Markdown entry in `knowledge/plusx-flex/entries/` using `knowledge/schema.md`.

Each card must include:

- Title
- Source URL
- Author
- Publication date if available
- Access date
- Category
- Tags
- Five-line-or-shorter summary
- Key concepts
- Practical principles
- Applicable situations
- Problem framing
- Approach
- Implications for design, branding, UX, UI, organization, or process
- Connected concepts or related articles
- One-sentence knowledge statement

## Step 4: Synthesize the Series

After individual cards are complete, create `knowledge/plusx-flex/summary.md` with:

- Repeated Plus X perspectives
- Plus X's apparent design philosophy
- Practical principles across the series
- Category map
- Concept map
- Tag system
- Remaining learning gaps

## Step 5: Update Management Site

Run:

```sh
node scripts/build-knowledge-index.mjs
```

Then review:

```sh
python3 -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080/knowledge/site/
```

Use the `Graph` view to inspect whether the new cards are organically connected. If isolated nodes appear, add clearer tags, concepts, or explicit `connections` rather than forcing unrelated links.

## Final Output Checklist

- URL list exists and has statuses.
- Each accessible source has a knowledge card.
- Inaccessible sources are documented.
- `summary.md` exists.
- `knowledge/data/knowledge.json` is updated.
- The local management site loads and shows the entries.
- The graph view shows category clusters and organic links where shared concepts exist.

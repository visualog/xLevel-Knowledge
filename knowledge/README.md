# xLevel Knowledge Base

This repository stores reusable learning data for future agent work.

## Structure

- `agent-goals/`: reusable goal prompts for agents.
- `plusx-flex/`: Plus X Brunch "플엑익힘책" research and knowledge cards.
- `data/knowledge.json`: normalized data used by the local management site.
- `site/`: static browser UI for browsing, filtering, graph viewing, adding, importing, and exporting notes.
- `schema.md`: the required structure for knowledge entries.

## Operating Rule

Agents should search this knowledge base before making design, UX, branding, or product decisions. Use the notes as internal context, then verify source-specific facts against the linked source when accuracy matters.

## Organic Classification And Graph Links

The site automatically infers a category when a card has no category. It uses title, summary, tags, concepts, and principles to map cards into broad groups such as brand strategy, UX design, UI design, design systems, content strategy, and design process.

The graph view computes organic links between cards from shared category, tags, concepts, principles, and explicit `connections`. This is intentionally similar to an Obsidian graph: relationships become visible as more cards accumulate.

## Copyright Rule

Store original interpretation, summaries, tags, principles, and source metadata. Do not archive full article text or long excerpts.

# xLevel Agent Memory Guide

This directory is a local knowledge base for agent work across projects.

## Required Behavior

Before starting project work, agents should check this directory for reusable knowledge:

1. Read `knowledge/README.md` to understand the repository structure.
2. Search `knowledge/` for concepts related to the current task.
3. Prefer structured notes in `knowledge/plusx-flex/entries/` and `knowledge/data/knowledge.json` when available.
4. Use source URLs for verification. Do not treat summaries as a substitute for the original source when exact claims matter.
5. Add new learning as Markdown notes using the schema in `knowledge/schema.md`.

## Source Handling

- Do not store copied article bodies.
- Keep source URL, title, author, publication date, and access date.
- Separate facts from interpretation.
- Mark uncertain or unverified claims as `needs-verification`.

## Update Flow

When new knowledge is added:

1. Add or update a Markdown entry under `knowledge/plusx-flex/entries/`.
2. Update `knowledge/data/knowledge.json` or run `node scripts/build-knowledge-index.mjs`.
3. Open `knowledge/site/index.html` or serve the directory locally to review the site.

## Fabric Notes

For every non-trivial implementation task from now on:

1. Before editing files, create a planning note in `notes/`.
2. Capture relevant full-screen before screenshots with macOS `screencapture` and save them under `notes/screenshots/<task-slug>-<YYYY-MM-DD>/`.
3. After completing the work, create a completion report in `notes/`.
4. Capture relevant full-screen after screenshots with `screencapture` and include before/after images in the completion report.
5. Use Markdown image links so the screenshots are visible from the note.

The note templates live in `docs/fabric-note-workflow.md`.

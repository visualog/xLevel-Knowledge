# Plan: Local Write Bridge

Date: 2026-05-29
Task: Add a local-only server bridge so reviewed candidates can be applied from the site to repository files.

## Objective

Close the gap between browser review actions and durable repository writes while keeping the static export fallback.

## Current State

The site can queue and export review actions. `scripts/apply-candidates.mjs` can apply review files. The user still has to export JSON and run the script manually.

## Plan

1. Add `scripts/knowledge-server.mjs`.
2. Serve `knowledge/site/`, `knowledge/data/`, and static assets from a local-only Node HTTP server.
3. Add `/api/health` so the site can detect the write bridge.
4. Add `/api/apply-review-actions` that accepts review actions and runs `scripts/apply-candidates.mjs --review-file`.
5. Update the site to use the bridge when available and keep export/localStorage fallback when not.

## Expected Change Areas

- `scripts/knowledge-server.mjs`
- `knowledge/site/app.js`
- `knowledge/site/index.html`
- `knowledge/site/styles.css`
- `notes/local-write-bridge-completion-report.md`

## Risks And Assumptions

- The server must bind only to `127.0.0.1`.
- The server writes files only by invoking the existing apply script.
- Static fallback must remain usable when the site is served with `python3 -m http.server`.

## Verification Plan

- `node --check scripts/knowledge-server.mjs`
- Start the server on a test port.
- `GET /api/health`
- `POST /api/apply-review-actions` with dry-run and with normal guarded behavior.
- Verify normal site syntax still passes.

## Before Screenshots

![Before](./screenshots/local-write-bridge-2026-05-29/before-fullscreen.png)

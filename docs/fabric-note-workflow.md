# Fabric Note Workflow

This repository treats Fabric notes as Markdown files stored in `notes/`.

No dedicated Fabric tool or computer-use tool is required. For screenshots, use the macOS `screencapture` CLI. If a browser view is needed, open the URL first, then capture the screen.

## Required Workflow

For every meaningful implementation task:

1. Create a planning note before editing code.
2. Capture before screenshots.
3. Implement and verify the work.
4. Capture after screenshots.
5. Create a completion report with before/after screenshots and verification results.

## Paths

Planning note:

`notes/<task-slug>-plan.md`

Completion report:

`notes/<task-slug>-completion-report.md`

Screenshots:

`notes/screenshots/<task-slug>-<YYYY-MM-DD>/before-fullscreen.png`

`notes/screenshots/<task-slug>-<YYYY-MM-DD>/after-fullscreen.png`

For UI work, also capture focused states when useful:

`notes/screenshots/<task-slug>-<YYYY-MM-DD>/before-graph.png`

`notes/screenshots/<task-slug>-<YYYY-MM-DD>/after-graph.png`

## Screenshot Commands

Create the screenshot directory:

```sh
mkdir -p notes/screenshots/<task-slug>-<YYYY-MM-DD>
```

Capture the current full screen:

```sh
screencapture -x notes/screenshots/<task-slug>-<YYYY-MM-DD>/before-fullscreen.png
```

Capture after implementation:

```sh
screencapture -x notes/screenshots/<task-slug>-<YYYY-MM-DD>/after-fullscreen.png
```

If the web UI should be visible, open it first:

```sh
open http://localhost:8080/knowledge/site/
```

If direct GUI manipulation is unavailable, provide the URL and capture command; the user can leave the target screen visible before capture.

## Planning Note Template

```md
# Plan: [Task Title]

Date:
Task:

## Objective

## Current State

## Plan

1.
2.
3.

## Expected Change Areas

- 

## Risks And Assumptions

- 

## Verification Plan

- 

## Before Screenshots

![Before](./screenshots/<task-slug>-<YYYY-MM-DD>/before-fullscreen.png)
```

## Completion Report Template

```md
# Completion Report: [Task Title]

Date:
Task:

## Summary

## Changes

- 

## Before And After

### Before

![Before](./screenshots/<task-slug>-<YYYY-MM-DD>/before-fullscreen.png)

### After

![After](./screenshots/<task-slug>-<YYYY-MM-DD>/after-fullscreen.png)

## Verification

- 

## Known Limits

- 
```

## Screenshot Guidance

- Capture full-screen states unless a narrower capture is explicitly more useful.
- Include card/list and graph views for knowledge-site UI work.
- Capture before images before file edits.
- Capture after images after the local site reloads and key interactions are visible.
- Keep filenames predictable and tied to the task slug.

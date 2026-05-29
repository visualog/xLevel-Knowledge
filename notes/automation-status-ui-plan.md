# Plan: Automation Status UI

Date: 2026-05-30
Task: Make the self-learning automation visible in the knowledge site.

## Objective

Add an Automation view to the site so users can see available automation commands, runner configuration, scheduler status command, and the current review-first flow without opening JSON files.

## Current State

The site has Cards, Candidates, and Graph views. Automation scripts and configs exist, but the site does not surface the loop, runner, or scheduler commands.

## Plan

1. Add an Automation segmented tab.
2. Add an automation panel section.
3. Load `automation-cycle.example.json` when available.
4. Render the review-first flow and copyable commands.
5. Include scheduler preview/install/status/uninstall commands.
6. Keep the UI static and non-writing.

## Expected Change Areas

- `knowledge/site/index.html`
- `knowledge/site/app.js`
- `knowledge/site/styles.css`
- `notes/automation-status-ui-completion-report.md`

## Risks And Assumptions

- This view should not execute commands from the browser.
- It should clarify that automation remains dry-run/review-first by default.
- Static file loading may fail when opened directly from disk; commands should still render.

## Verification Plan

- `node --check knowledge/site/app.js`
- Open or serve site and confirm Automation tab renders.
- Verify text includes runner, scheduler, apply, and review commands.

## Before Screenshots

![Before](./screenshots/automation-status-ui-2026-05-30/before-fullscreen.png)

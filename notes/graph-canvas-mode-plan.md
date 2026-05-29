# Graph Canvas Mode Plan

Date: 2026-05-29

## Goal

Turn Graph view into a full-screen infinite canvas exploration mode while preserving Cards view as the list, filtering, and management surface.

## Before

![Before](./screenshots/graph-canvas-mode-2026-05-29/before-fullscreen.png)

## Current Findings

- Graph view still lives inside the normal three-column dashboard layout.
- Sidebar filters and the right editor remain permanently visible in graph mode.
- Graph controls are fixed inside a panel toolbar instead of floating over the canvas.
- Nodes can be selected but cannot be dragged or persisted.
- View mode control does not exist beyond Cards/Graph.
- Local focus is implemented as a checkbox, but graph mode needs explicit Overview, Cluster, and Local Focus modes.

## Implementation Plan

1. Add graph canvas mode layout classes when `state.view === "graph"`.
2. Restructure graph markup to support floating top-left, top-right, bottom-left, bottom-right controls and a slide-in inspector.
3. Preserve cards view and editor behavior outside canvas mode.
4. Add graph mode state for `overview`, `cluster`, and `local` with meaningful layout/visibility differences.
5. Add draggable nodes with screen-to-world coordinate conversion.
6. Persist dragged node positions in `localStorage` and support `Reset layout`.
7. Make Fit use current node positions, including manual positions.
8. Add inspector close behavior via canvas background, close button, and `Esc`; add `0` keyboard shortcut for Fit.
9. Verify graph canvas, card view, view modes, drag persistence, reset layout, and screenshots.

## Verification Checklist

- Cards view remains a management/list view.
- Graph view hides the standard sidebar/editor layout and fills the viewport.
- Floating controls are visible and compact.
- Nodes can be dragged and positions persist after refresh.
- Reset layout clears persisted node positions.
- Fit works after manual dragging.
- Selecting a node opens a slide-in inspector.
- `Esc` and background click close inspector/clear selection.
- Overview, Cluster, and Local Focus modes are meaningfully different.
- `node --check knowledge/site/app.js` passes.


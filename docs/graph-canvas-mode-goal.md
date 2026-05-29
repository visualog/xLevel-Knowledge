# Graph Canvas Mode Goal

Transform the graph view in `xLevel Knowledge` into a full-screen infinite canvas exploration mode. Card view remains the list/management/editing mode. Graph view becomes a focused canvas experience with only the UI needed for navigation, filtering, selection, and inspection.

## Product Context

This product collects knowledge from many sources, classifies it, links it, and helps users reuse it as project judgment criteria. It must not feel like a Plus X-only archive. The graph should feel like a calm professional knowledge workspace inspired by Obsidian graph view, Sigma.js/Cytoscape graph explorers, and spatial canvas tools.

The desired UX is normal but detailed: quiet, useful, polished, and not decorative. Interactions should improve understanding through motion, hierarchy, and direct manipulation.

## Required Workflow

Use this repo's Fabric note convention. Do not require a Fabric tool.

Before editing code:

1. Create `notes/graph-canvas-mode-plan.md`.
2. Create `notes/screenshots/graph-canvas-mode-2026-05-29/`.
3. Open the current site at `http://localhost:8080/knowledge/site/#graph`.
4. Capture the before state:
   - `notes/screenshots/graph-canvas-mode-2026-05-29/before-fullscreen.png`

After implementation and verification:

1. Capture the after state:
   - `notes/screenshots/graph-canvas-mode-2026-05-29/after-fullscreen.png`
2. Create `notes/graph-canvas-mode-completion-report.md`.
3. Include these image links in the plan and report:

```md
![Before](./screenshots/graph-canvas-mode-2026-05-29/before-fullscreen.png)
![After](./screenshots/graph-canvas-mode-2026-05-29/after-fullscreen.png)
```

Use macOS `screencapture` for screenshots. If direct GUI manipulation is unavailable, provide the URL and capture commands, then use the visible browser state.

## Current Starting Point

The existing implementation already has:

- A card view and graph view toggle.
- A graph panel rendered in `knowledge/site/app.js`.
- Bounding-box fit logic for the graph.
- Category clusters, links, labels, hover preview, selection, and local focus.
- `#graph` routing support.

Build on this work instead of replacing it wholesale.

## Core UX Direction

When switching from Cards to Graph:

- The page should become a graph-first infinite canvas mode.
- The standard three-column management layout should be hidden.
- The graph canvas should occupy the viewport.
- Only essential controls should remain visible as floating UI.
- Card editing stays available, but only through a selected-node inspector or explicit action.

Graph mode should feel like entering a spatial workspace, not like opening a graph inside a dashboard card.

## Required Graph Canvas UI

### Full-Screen Canvas

- Graph view should use the full viewport height and width.
- Hide the left filter sidebar and persistent right editor by default.
- Remove the boxed dashboard feeling from the graph panel in canvas mode.
- Use a subtle infinite-canvas background grid or dot pattern.
- Keep the graph as the primary object on screen.

### Floating Controls

Replace the fixed dashboard toolbar with lightweight floating controls:

- Top-left: Back to Cards, title, visible node/link count.
- Top or top-right: Search, Fit, Reset, Local focus, View mode.
- Bottom-left: Category legend.
- Bottom or bottom-right: Zoom level, density slider, optional minimap placeholder.
- Right side: Slide-in inspector only when a node is selected.

Controls should be compact, readable, and not block the graph.

### Node Inspector

Selecting a node should open a right-side inspector:

- Title, category, source, published date, status.
- Summary.
- Concepts, principles, applications.
- Related nodes.
- Edit action.

The inspector should be dismissible by:

- clicking the canvas background,
- pressing `Esc`,
- using a close button.

### Direct Manipulation

Nodes must be draggable.

- Dragging a node should update its position immediately.
- Connected links should follow while dragging.
- Dragging a node should not trigger canvas pan.
- Dragged positions should persist in `localStorage`.
- Provide `Reset layout` to clear saved positions and return to auto layout.
- Fit should fit the current visible node positions, including manually moved nodes.

### Canvas Navigation

- Canvas drag pans the graph.
- Mouse wheel or trackpad zooms around the cursor position.
- Fit returns the current graph to the visible viewport.
- Reset returns zoom/pan to fitted overview and optionally clears manual layout when using Reset layout.
- Keyboard:
  - `Esc`: close inspector / clear selection.
  - `0`: fit view.
  - Optional: `1-6` switch view modes.

## Required View Modes

Provide a view mode control. Implement as much as possible with the existing static app architecture.

Minimum required modes:

1. `Overview`
   - Default graph layout.
   - Shows all visible cards and strongest links.

2. `Cluster`
   - Emphasizes category grouping.
   - Stronger cluster boundaries and clearer category separation.

3. `Local Focus`
   - Shows selected node and directly connected neighbors.
   - If no node is selected, show a helpful prompt instead of a confusing empty view.

Preferred additional modes if feasible:

4. `Source`
   - Groups nodes by source name or author/source metadata.

5. `Concept`
   - Prioritizes concepts/tags and shared terms.

6. `Timeline`
   - Places nodes along a publication or collection date axis.

Do not fake modes with labels only. Each mode should change layout, filtering, or visual emphasis in a meaningful way. If a mode is not fully implemented, mark it visually disabled or omit it for now.

## Design Requirements

- Use one coherent sans-serif typography system.
- Avoid a source-specific title or copy that implies only Plus X data.
- Avoid oversized dashboard cards in graph mode.
- Avoid visual noise from too many labels or heavy links.
- Use restrained but clear motion for mode changes, inspector open/close, hover, and selection.
- Keep buttons, segmented controls, range sliders, toggles, and floating panels visually consistent.
- Ensure graph labels and controls do not overlap incoherently.
- Keep touch targets reasonable and keyboard focus visible.
- Respect `prefers-reduced-motion`.

## Suggested Code Targets

Start with:

- `knowledge/site/index.html`
- `knowledge/site/styles.css`
- `knowledge/site/app.js`

Likely changes:

- Add a canvas-mode class to the page or shell when `state.view === "graph"`.
- Split management layout CSS from graph canvas layout CSS.
- Add floating graph control containers in HTML.
- Add graph view mode state.
- Add node drag state.
- Store manual node positions in `localStorage`.
- Teach `graphLayout()` to read saved positions.
- Teach link rendering to update after node movement.
- Add inspector open/close state distinct from the full editor form.
- Update fit bounds after drag and after mode changes.

## Verification

Before calling the work complete, verify:

- Cards view still works as a management/list view.
- Switching to Graph hides the standard three-column layout and opens a full-screen canvas.
- Floating controls are visible and usable.
- The graph initially fits the viewport.
- Nodes can be dragged.
- Dragged node positions persist after refresh.
- Reset layout clears persisted positions.
- Fit works after manual dragging.
- Selecting a node opens the inspector.
- Canvas background click and `Esc` close the inspector or clear selection.
- Overview, Cluster, and Local Focus modes change the graph meaningfully.
- Local Focus handles the no-selection state gracefully.
- Graph view remains readable at desktop and narrow widths.
- `node --check knowledge/site/app.js` passes.
- Before/after screenshots and completion report exist.

## Output

Report briefly:

- Key UX changes made.
- Which view modes are implemented.
- Verification performed.
- Note and screenshot paths.
- Any intentionally deferred graph modes or known follow-ups.


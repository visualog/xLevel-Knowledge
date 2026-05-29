# UX/UI RAG Improvement Goal

## Objective

Improve the current knowledge management site's UI, layout, node graph experience, interactions, and information architecture.

The goal is not to decorate the page. The goal is to make knowledge exploration, classification, graph navigation, and editing clearer, calmer, more useful, and more refined.

## Desired Direction

The interface should feel:

- Normal, but highly finished.
- Quiet, organized, and trustworthy.
- Detailed without being decorative.
- Smooth without feeling animated for its own sake.
- Interesting through useful interaction, not visual noise.
- Similar in spirit to Apple product UX: small states, spacing, transitions, focus, feedback, and hierarchy should feel carefully considered.

Current concerns:

- UI and UX polish are not strong enough.
- Layout hierarchy and density feel unresolved.
- The node graph is functional but not yet compelling or clearly useful.
- Serif and sans-serif typography are mixed without a clear system.
- Interactions are present but do not yet enrich the experience.
- Knowledge search, filtering, graph exploration, and editing do not yet feel like one coherent workflow.

## RAG Requirements

Before changing UI, inspect and use the local knowledge base:

- `AGENTS.md`
- `knowledge/README.md`
- `knowledge/schema.md`
- `knowledge/data/knowledge.json`
- `knowledge/plusx-flex/summary.md`
- `knowledge/plusx-flex/entries/`

Use this context to understand:

- What data the site manages.
- How users should explore accumulated knowledge from multiple sources, including the current Plus X dataset.
- The category and concept structure of the 플엑익힘책 data.
- Which node relationships are meaningful.
- How cards, filters, graph, and details should work together.

Do not expose or copy long source text. Use knowledge cards as structured context.

## Design Principles

### Typography

- Use a coherent sans-serif-first type system.
- Do not mix serif and sans-serif casually.
- Define clear hierarchy for title, metadata, body, tags, controls, and graph labels.
- Korean titles must wrap cleanly without overflowing.
- Graph labels should remain compact but readable.

### Layout

- Organize the workflow around exploration, graph understanding, and detail/editing.
- The sidebar should feel like a control panel, not a loose filter stack.
- The detail panel should support both reading and editing.
- Cards, graph, and detail panel should share selection state.
- Use restrained depth, separators, spacing, and grouping.

### Node Graph UX

The graph should feel closer to an Obsidian-style knowledge graph, but calmer and more task-focused.

Improve:

- Node and link visual hierarchy.
- Link strength expression.
- Selected node emphasis.
- Neighbor highlighting.
- Non-selected node dimming.
- Category clusters.
- Search/filter integration.
- Hover preview.
- Click-to-detail behavior.
- Pan, zoom, reset, and fit interactions.
- Empty, loading, and sparse-data states.
- Dense graph readability.

The graph should prioritize understanding relationships over visual spectacle.

### Interaction Detail

Add careful states:

- Hover
- Active
- Selected
- Focus-visible
- Disabled
- Empty
- Loading
- Save feedback
- Filter feedback
- Graph node selection feedback

Motion should be fast, subtle, and useful.

### Visual Tone

Aim for:

- Quiet
- Refined
- Useful
- Detailed
- Slightly interesting
- Not flashy

Avoid:

- Heavy gradients
- Decorative cards everywhere
- Excessive shadows
- Dark developer-tool aesthetics
- Marketing landing-page composition
- Generic AI dashboard patterns
- Messy serif/sans-serif mixing
- Graphs covered in unreadable lines

## Feature Improvements

### Top Area

- Show current knowledge state succinctly.
- Include total cards, visible links, categories, and update status.
- Avoid a large marketing hero.

### Sidebar

Support:

- Search
- Category filtering
- Status filtering
- Tag filtering if feasible
- Graph density or display-strength control if feasible
- Data status summary

### Cards

Improve cards with:

- Title
- Category
- Tags
- Summary
- Connection count
- Clear selected state
- Synchronization with graph selection
- Helpful hover affordance

### Detail/Edit Panel

Improve the panel so it is not only a raw form:

- Provide a readable selected-card detail view.
- Make edit mode intentional.
- Show source, concepts, principles, applications, and connections clearly.
- Provide save feedback.

### Graph

Improve:

- Cards/Graph switching.
- Near-full exploration space.
- Selected-node-centered relationship understanding.
- Node size, line weight, color, and labels.
- Graph density management for 65+ entries.

## Implementation Principles

- Read the existing code first.
- Keep the static site architecture unless there is a strong reason to change it.
- Do not add unnecessary frameworks.
- Improve CSS/JS organization where useful.
- Preserve accessibility.
- Support keyboard focus.
- Keep mobile, tablet, and desktop usable.
- Prevent text overflow.
- Keep graph rendering performant for at least 65 entries.

## Work Procedure

1. Inspect the current files and site code.
2. Read the knowledge JSON and available source summaries.
3. Identify concrete UX problems.
4. Make a short implementation plan.
5. Modify UI, layout, CSS, and JS.
6. Improve graph interaction and selection state.
7. Check responsive behavior.
8. Run the local site.
9. Run syntax checks and basic verification.
10. Summarize changes and verification.

## Completion Criteria

The work is complete when:

- Typography is coherent and sans-serif-led.
- Layout hierarchy is clearer.
- The graph works as a relationship exploration tool, not just a node dump.
- Cards, filters, graph, and detail panel share a coherent workflow.
- Hover, selected, focus, save feedback, and other details exist.
- Interactions are subtle, fast, and useful.
- 65+ cards remain usable without visual overload.
- The local site loads correctly.
- Available syntax checks pass.

The final result should be a normal but detailed knowledge exploration tool that helps users find knowledge, understand relationships, and use the data in future project decisions.

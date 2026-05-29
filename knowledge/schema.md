# Knowledge Entry Schema

Use this schema for Markdown entries and JSON records.

## Required Fields

- `id`: stable kebab-case identifier.
- `title`: source or knowledge card title.
- `sourceUrl`: original URL.
- `sourceName`: publication or platform.
- `author`: author or organization.
- `publishedAt`: ISO date if available.
- `accessedAt`: ISO date when checked.
- `category`: primary category.
- `tags`: reusable tags.
- `summary`: short original summary.
- `concepts`: key concepts extracted from the source.
- `principles`: practical rules or decision criteria.
- `applications`: situations where this knowledge applies.
- `connections`: related notes, ideas, or sources.
- `verificationStatus`: `verified`, `needs-verification`, or `inaccessible`.

## Automatic Classification

If `category` is empty, the management site infers one from title, summary, tags, concepts, and principles. Explicit categories always take priority.

## Organic Links

The graph UI links entries when they share category, tags, concepts, or important principle terms. Explicit `connections` create stronger links.

## Markdown Template

```md
---
id:
title:
sourceUrl:
sourceName: Brunch
author: Plus X
publishedAt:
accessedAt:
category:
tags: []
verificationStatus: needs-verification
---

# Title

## Summary

## Key Concepts

## Practical Principles

## Applications

## Problem Framing

## Approach

## Implications

## Connections

## One-Sentence Knowledge
```

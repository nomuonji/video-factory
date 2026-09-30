# Catalog authoring

## Editing entries

An agent-readable editing pattern needs more than a visual name.

- `intents`: why an editor would choose it.
- `triggers`: observable semantic or visual signals.
- `avoidWhen`: conditions that suppress misuse.
- `requirements`: information or capabilities that must exist.
- `intensity` / `densityCost`: inputs to style guardrails.
- `implementation`: actual renderer support, never aspirational support.

Do not add precise animation timings until they are tested in a renderer. Editorial semantics and renderer parameters are separate concerns.

## Scene entries

Scene patterns describe reusable presentation strategies and should survive provider changes.

Bad: `vendor-x-image-card`
Good: `generated-broll`

## Asset capabilities

Capabilities describe required inputs and produced outputs, not vendors.

Bad: `vendor-y-voice`
Good: `narration`

## Styles

A style profile constrains selection frequency and intensity. It must not redefine what a punch-in or definition card means.

## Source-derived catalog

The initial 92 editing entries use names, categories, and purposes from YouTube Editing Visual Library Japan v0.3. Triggers, avoidance rules, requirements, density costs, and renderer mappings are Video Factory normalization and should evolve from real productions.

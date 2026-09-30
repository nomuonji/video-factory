# Video Factory

Agent-native video production orchestration for generating complete videos from a prompt, optional source material, or both.

Video Factory owns **what to make, what to show, and when to show it**. Rendering engines such as [nomuonji/animation-factory](https://github.com/nomuonji/animation-factory) own **how supported visual behavior is rendered**.

## Included now

- 92-entry agent-normalized YouTube editing catalog
- 16 reusable scene strategies for prompt-first productions
- 16 provider-neutral asset capabilities
- 6 style profiles with pacing and effect-density budgets
- Brief, Storyboard, and Edit Plan JSON contracts
- Pattern-selection logic
- Repetition and strong-effect guardrails
- Animation Factory adapter with explicit capability mapping
- Dependency-free cross-reference validator

## Pipeline

```text
Prompt / raw footage / references
        ↓
Concept + script
        ↓
Storyboard
        ↓
Scene Plan + Asset Requirements
        ↓
Asset generation / acquisition
        ↓
Editing Intent
        ↓
Agent Editing Catalog
        ↓
Style + density constraints
        ↓
Edit Plan (renderer-neutral IR)
        ↓
Renderer adapter
        ↓
Animation Factory / future renderers
        ↓
MP4
```

The expected default is `inputMode: "generated"`: no filmed source video is required.

## Repository layout

```text
catalog/
  editing/       92 machine-readable editing patterns
  scenes/        reusable scene strategies
  assets/        provider-neutral generation/acquisition capabilities
  styles/        pacing, density, and format profiles
schemas/         JSON contracts
src/
  core/          stable domain types
  catalog/       registry
  planner/       selection and guardrails
  adapters/      renderer mappings
tools/           validation
examples/        prompt-only example artifacts
docs/            architecture and catalog guidance
```

## Checks

```bash
npm install
npm run validate
npm run typecheck
# or
npm run check
```

## Agent contract

Read `AGENTS.md` first. Normal agent output should be Storyboard and Edit Plan data rather than arbitrary renderer code.

A pattern is a decision object, not just an effect name. For example, `VS-R01` includes intents, observable triggers, avoidance conditions, requirements, intensity, density cost, and actual renderer support.

## Extensibility

Catalogs are independent. Adding an asset provider does not require changing editing patterns. Adding a renderer does not require rewriting Storyboards. Adding a visual pattern does not require duplicating style profiles.

Provider-specific integrations belong behind asset capability adapters. Renderer-specific behavior belongs behind renderer adapters.

## Animation Factory relationship

```text
Video Factory
  director / writer / storyboarder / editor
              ↓ Edit Plan
Animation Factory
  reusable visual components / deterministic renderer / audio pipeline
```

Only Animation Factory capabilities that were verified in its current component catalog are marked `supported` or `partial`.

## Source catalog

The initial editing vocabulary is normalized from **YouTube Editing Visual Library Japan v0.3**:

https://youtube-editing-visual-library.ayami.chatgpt.site/

Names, categories, and stated purposes are source-derived. Trigger rules, avoidance rules, density costs, requirements, and implementation mappings are Video Factory additions for agent use.

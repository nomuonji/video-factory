# Video Factory

Agent-native video production orchestration for generating complete videos from a prompt, optional source material, or both.

Video Factory owns **what to make, what to show, and when to show it**. Rendering engines such as [nomuonji/animation-factory](https://github.com/nomuonji/animation-factory) own **how a supported visual behavior is rendered**.

## Design goals

- Prompt-first: source footage is optional.
- Data-first: agents produce structured plans instead of arbitrary renderer code.
- Extensible catalogs: scenes, assets, editing patterns, styles, and renderer adapters are independent registries.
- Provider-neutral assets: image, TTS, music, SFX, screenshots, diagrams, charts, and future generators use capability contracts rather than hard-coded vendors.
- Explainable planning: every edit operation records the intent and catalog pattern that caused it.
- Graceful degradation: unsupported effects can fall back to simpler patterns instead of breaking the production.
- Renderer separation: Video Factory can target Animation Factory now and additional renderers later.

## Production pipeline

```text
Prompt / raw footage / references
        ↓
Concept + script
        ↓
Storyboard
        ↓
Scene Plan
        ↓
Asset Requirements
        ↓
Asset generation / acquisition
        ↓
Editing Intent
        ↓
Agent Editing Catalog
        ↓
Style + density constraints
        ↓
Edit Plan (intermediate representation)
        ↓
Renderer adapter
        ↓
Animation Factory / future renderers
        ↓
MP4
```

The key boundary is the **Edit Plan**. Agents should not write renderer-specific code during normal production.

## Repository layout

```text
catalog/
  editing/       Machine-readable editing vocabulary
  scenes/        Reusable scene strategies
  assets/        Provider-neutral asset capabilities
  styles/        Production profiles and pacing rules
schemas/         JSON schemas for catalog entries and plans
src/
  core/          Stable domain types
  catalog/       Registry and lookup logic
  planner/       Planning and guardrails
  adapters/      Renderer adapters
tools/           Catalog validation and maintenance
examples/        Example briefs and plans
docs/            Architecture and authoring guidance
```

## Catalog philosophy

A pattern is not only an effect name. It carries enough context for an agent to decide whether it should be used:

```json
{
  "id": "VS-R01",
  "name": "punch-in",
  "intents": ["emphasis", "surprise"],
  "inputModes": ["generated", "raw", "hybrid"],
  "triggers": ["important_claim", "punchline"],
  "avoidWhen": ["calm_explanation", "recent_same_effect"],
  "requirements": ["focus_target"],
  "intensity": "medium",
  "implementation": { "status": "planned" }
}
```

The editing catalog is seeded from the YouTube Editing Visual Library, then normalized for machine use. The source is a reference, not a runtime dependency.

## Relationship with Animation Factory

```text
Video Factory
  director / writer / storyboarder / editor
              ↓ renderer contract
Animation Factory
  visual components / deterministic renderer / audio pipeline
```

Do not copy Animation Factory internals into this repository. Add or update an adapter mapping instead.

## Status

Initial architecture and machine-readable catalogs are being established. The first milestone is a stable planning contract that remains valid while renderers, asset generators, and editing vocabulary continue to grow.

# AGENTS.md

## Mission

Turn a user brief into a reproducible video production. Prefer structured production data and reusable catalog entries over one-off rendering code.

## Read first

1. `README.md`
2. `catalog/manifest.json`
3. the selected style profile in `catalog/styles/styles.json`
4. `catalog/scenes/scenes.json`
5. `catalog/editing/patterns.json`
6. `catalog/assets/assets.json`
7. the selected renderer support map in `catalog/renderers/`
8. the schemas relevant to the artifacts you are writing

## Default flow

```text
brief → storyboard → asset requests → edit plan → prepare → render
```

For prompt-only productions, do not invent a fake source-video stage. Generate scene and asset requirements directly from the brief.

A runnable production lives in `productions/<id>/` and normally contains:

- `brief.json`
- `storyboard.json`
- `edit-plan.json`
- `assets.json` when produced or acquired media exists

## Hard rules

- Do not emit renderer-specific code when Storyboard + Edit Plan can express the same intent.
- Every edit operation must use a catalog `patternId` and include a human-readable `reason`.
- Respect the selected style profile's density and repetition limits.
- Check `catalog/renderers/<renderer>.json` before assuming an edit pattern can render.
- A pattern missing from the selected renderer map is unsupported. Keep the base scene or choose a declared simpler pattern; never silently invent support.
- Keep provider names out of core schemas. Provider-specific details belong behind asset-provider adapters.
- New reusable behavior belongs in a catalog, renderer component, or adapter rather than a single production.
- Preserve provenance and licensing metadata for external media.
- Do not commit credentials, API keys, generated secrets, or private source media.
- The default general-purpose renderer is Remotion. Use Animation Factory when the production intentionally needs its pixel-art/character runtime.

## Extending

### Editing pattern
Add editorial semantics to the editing catalog. Renderer support is registered separately under `catalog/renderers/`.

### Asset type
Add one provider-neutral capability to `catalog/assets/assets.json`. Providers satisfy capabilities without changing Storyboards.

### Renderer
Add a renderer support catalog and adapter/runtime. Do not change Storyboard or Edit Plan semantics to fit one renderer.

### Style
Add a profile under `catalog/styles/styles.json`. Styles constrain selection; they do not duplicate patterns.

Run `npm run validate` after catalog changes, `npm run typecheck` after TypeScript changes, and `npm run prepare -- <id>` before rendering.

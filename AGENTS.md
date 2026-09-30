# AGENTS.md

## Mission

Turn a user brief into a reproducible video production plan. Prefer structured data and reusable catalog entries over one-off rendering code.

## Read first

1. `README.md`
2. `catalog/styles/styles.json`
3. `catalog/scenes/scenes.json`
4. `catalog/editing/patterns.json`
5. `catalog/assets/assets.json`
6. the schemas relevant to the artifact you are writing

## Normal flow

```text
brief → script/storyboard → asset requests → edit plan → renderer adapter → render
```

For prompt-only productions, do not invent a fake source-video stage. Generate scene and asset requirements directly from the brief.

## Hard rules

- Do not emit renderer-specific code when an Edit Plan can express the same intent.
- Every edit operation must use a catalog `patternId` and include a human-readable `reason`.
- Respect the selected style profile's density and repetition limits.
- Check `implementation.status` before assuming a pattern can render.
- If a pattern is unsupported, prefer a declared fallback or surface an explicit missing capability.
- Keep provider names out of core schemas. Provider-specific details belong in adapters.
- New reusable behavior should become a catalog entry or adapter mapping rather than being hidden in one production.
- Preserve provenance and licensing metadata for external media.
- Do not commit credentials, API keys, generated secrets, or private source media.

## Extending

### Editing pattern
Add the editorial semantics to the editing catalog first; add renderer mappings separately.

### Asset type
Add one provider-neutral capability to `catalog/assets/assets.json`. Providers implement capabilities without changing Storyboards.

### Renderer
Implement `RendererAdapter` under `src/adapters/`. Do not change Edit Plan semantics to fit a renderer.

### Style
Add a profile under `catalog/styles/styles.json`. Styles constrain selection; they do not duplicate patterns.

Run `npm run validate` after catalog changes and `npm run typecheck` after TypeScript changes.

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
7. `catalog/assets/coverage.json` and `catalog/assets/presets.json`
8. the selected renderer support map in `catalog/renderers/`
9. the schemas relevant to the artifacts you are writing

## Default flow

```text
brief → storyboard → asset requests → edit plan → prepare:production → render
```

For prompt-only productions, do not invent a fake source-video stage. Generate scene and asset requirements directly from the brief.

A runnable production lives in `productions/<id>/` and normally contains:

- `brief.json`
- `storyboard.json`
- `edit-plan.json`
- `assets.json` when produced or acquired media exists

## Triggering a GitHub Actions render

After the production files are committed to the default branch, agents using the connected GitHub tool can trigger a render by creating an Issue:

```text
[render-video] <production_id>
```

Example:

```text
[render-video] oauth-60s
```

Do not create a render Issue until the production exists on the default branch. Do not create duplicate render Issues for the same production while one is open. The workflow only accepts render Issues opened by the repository owner. A successful run closes the Issue automatically; a failed run leaves it open with a run-log link.

Humans can alternatively use `workflow_dispatch` from the Actions UI or:

```bash
gh workflow run render-video.yml -f production_id=<production_id>
```

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
- For Japanese productions that request narration, prefer `assetProviders.narration: voicevox` unless the user explicitly wants a silent video. GitHub Actions starts the VOICEVOX runtime automatically.
- Author narration to fit each scene's time budget. Treat narration filling less than roughly 55% of a scene as a pacing defect unless silence is intentional; narration longer than the scene will be clipped.
- Preserve generated voice attribution. VOICEVOX narration assets carry attribution metadata and the Remotion renderer displays it near the end of the video.
- Prefer the `procedural` provider for generic editorial visuals, subtitles, diagrams, icons, code panels, BGM, SFX, and ambience when no factual external asset is needed.
- Never use procedural material as fake evidence. Real UI screenshots, documents, products, people, and geographic maps require real/supplied or evidence-producing providers.
- Never invent values to satisfy a chart request. The procedural chart provider intentionally rejects requests without numeric data.
- If true generated video is unavailable, use a procedural still plus cataloged camera/motion patterns rather than pretending a still is generated video.

## Extending

### Editing pattern
Add editorial semantics to the editing catalog. Renderer support is registered separately under `catalog/renderers/`.

### Asset type
Add one provider-neutral capability to `catalog/assets/assets.json`. Providers satisfy capabilities without changing Storyboards.

### Renderer
Add a renderer support catalog and adapter/runtime. Do not change Storyboard or Edit Plan semantics to fit one renderer.

### Style
Add a profile under `catalog/styles/styles.json`. Styles constrain selection; they do not duplicate patterns.

Run `npm run validate` after catalog changes, `npm run typecheck` after TypeScript changes, and `npm run prepare:production -- <id>` before rendering.

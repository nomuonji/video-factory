# Production Runner

Video Factory can now render a prompt-first production without source footage.

## Production folder

Create `productions/<id>/` with:

- `brief.json`
- `storyboard.json`
- `edit-plan.json`
- `assets.json` (optional; generated or acquired assets)

The agent is responsible for planning the first three artifacts. Asset providers may satisfy requests later.

## Prepare

```bash
npm install
npm run prepare -- oauth-60s
```

Preparation performs:
1. production ID consistency checks,
2. style guardrails,
3. renderer capability filtering,
4. timeline validation,
5. generation of `.generated/render-props.json` and `.generated/report.json`.

Unsupported edit operations are explicit in the report; the base scene is still rendered.

## Render

```bash
npm run render -- oauth-60s
```

The default renderer is Remotion and outputs:

```text
outputs/oauth-60s.mp4
```

The renderer is intentionally data-driven. Agents should change production JSON, catalogs, or reusable renderer components rather than generate a bespoke React composition for every video.

## Renderer roles

- **Remotion**: default general-purpose renderer for text, cards, diagrams, layouts, generated media, and ordinary YouTube editing.
- **Animation Factory**: specialized pixel-art/character animation renderer exposed through its adapter.

Additional renderers can register support under `catalog/renderers/` without changing the production contracts.

## Current limitation

The runner does not generate narration audio by itself yet. It accepts produced audio assets through the asset layer, but the next milestone is a provider-backed narration pipeline with timing data and audio muxing.

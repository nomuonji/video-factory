# Production Runner

Video Factory renders prompt-first productions without requiring filmed source footage.

## Production folder

Create `productions/<id>/` with:

- `brief.json`
- `storyboard.json`
- `edit-plan.json`
- `production.config.json` for provider choices
- `assets.json` for generated, acquired, or manually supplied media

## Stages

```text
Storyboard asset requests
        ↓
npm run assets
        ↓
assets.json + public/generated/
        ↓
npm run prepare
        ↓
RenderSpec + report
        ↓
npm run render
        ↓
outputs/<id>.mp4
```

`npm run render -- <id>` runs the asset and prepare stages automatically before Remotion.

## Narration

Narration is provider-based. The built-in free/local option is VOICEVOX.

Keep narration disabled:

```json
{
  "assetProviders": {
    "narration": "none"
  }
}
```

Enable local VOICEVOX:

```json
{
  "assetProviders": {
    "narration": "voicevox"
  },
  "providers": {
    "voicevox": {
      "url": "http://127.0.0.1:50021",
      "speaker": 3,
      "speedScale": 1.05
    }
  }
}
```

You can also set `VOICEVOX_URL` and `VOICEVOX_SPEAKER`. These are configuration values, not credentials.

Each Storyboard scene requesting the `narration` capability becomes one WAV file under `public/generated/<production-id>/`. `assets.json` links it back to the scene, and the Remotion renderer places the audio at that scene's start time.

## Prepare

```bash
npm install
npm run prepare -- oauth-60s
```

Preparation performs production ID checks, style guardrails, renderer capability filtering, timeline validation, and writes `.generated/render-props.json` plus `.generated/report.json`.

Unsupported edit operations are explicit in the report; the base scene still renders.

## Render

```bash
npm run render -- oauth-60s
```

Output:

```text
outputs/oauth-60s.mp4
```

## Renderer roles

- **Remotion**: default general-purpose renderer for ordinary YouTube editing and generated media.
- **Animation Factory**: specialized pixel-art and character-animation renderer.

Additional renderers register support under `catalog/renderers/` without changing the core production contracts.

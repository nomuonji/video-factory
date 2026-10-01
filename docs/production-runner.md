# Production Runner

Video Factory renders prompt-first productions without requiring filmed source footage.

## GitHub Actions rendering

The normal production renderer is `.github/workflows/render-video.yml`.

Two explicit triggers are supported:

```text
workflow_dispatch(production_id)
          OR
owner Issue: [render-video] <production_id>
                    ↓
resolve + validate production ID
                    ↓
validate production files
                    ↓
Node 22 + Noto CJK + conditional VOICEVOX runtime
                    ↓
npm install
                    ↓
npm run check
                    ↓
npm run render -- <production_id>
                    ↓
verify MP4 + report
                    ↓
GitHub Artifact (7 days)
```

Ordinary pushes do not render videos.

### Manual UI / CLI dispatch

UI:

```text
Actions → Render Video → Run workflow
```

GitHub CLI:

```bash
gh workflow run render-video.yml -f production_id=oauth-60s
```

### Agent / MCP dispatch

The current connected GitHub tool can create Issues but does not expose the workflow-dispatch write API. To keep the production flow agent-operable, create an Issue with this title:

```text
[render-video] oauth-60s
```

Security rules:

- the Issue opener must equal `github.repository_owner`;
- the title must start with `[render-video] `;
- the parsed production ID must match `^[A-Za-z0-9._-]+$`.

A successful Issue-triggered render comments with the Actions run URL and artifact name, then closes the Issue. A failed render comments with the run logs and leaves the Issue open.

The uploaded artifact contains:

- `<production_id>.mp4`
- `render-report.json`
- `run-metadata.json`
- the production JSON files used for that run
- generated narration assets when a narration provider is enabled

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
npm run prepare:production
        ↓
RenderSpec + report
        ↓
npm run render
        ↓
outputs/<id>.mp4
```

`npm run render -- <id>` runs the asset and prepare-production stages automatically before Remotion.

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

Enable VOICEVOX in an environment where VOICEVOX Engine is running:

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

You can also set `VOICEVOX_URL` and `VOICEVOX_SPEAKER`.

Each Storyboard scene requesting `narration` becomes one WAV file under `public/generated/<production-id>/`. `assets.json` records measured duration, scene fill ratio, VOICEVOX speaker/style, and attribution. Remotion places audio at the scene start and displays voice attribution during the final seconds.

`render-video.yml` automatically starts the official pinned `ghcr.io/voicevox/voicevox_engine:cpu-0.25.2` container only when the production selects `assetProviders.narration: voicevox`. It waits for the API, validates the configured speaker/style ID, generates narration WAV files, and stops the container after rendering. Productions with `narration: none` skip the VOICEVOX runtime.

## Local render

```bash
npm install
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

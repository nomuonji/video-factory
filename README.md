# Video Factory

Agent-native video production orchestration for generating complete videos from a prompt, optional source material, or both.

## Recommended render path: GitHub Actions

Production rendering is designed to run on GitHub Actions.

1. Commit a production under `productions/<id>/`.
2. Open **Actions → Render Video → Run workflow**.
3. Enter the `production_id`.
4. Download the resulting `video-<production_id>-<run_number>` artifact.

The workflow validates catalogs and TypeScript, installs Japanese fonts, renders through Remotion, and uploads the MP4 plus its render report and source production JSON. Artifacts are retained for 7 days.

The workflow uses `workflow_dispatch` only, so editing the repository does not automatically spend rendering minutes.

For local development, this still works:

```bash
npm install
npm run render -- oauth-60s
```

The default input mode is **generated**: filmed source footage is not required.

`render` runs:

```text
asset materialization → guardrails / prepare → Remotion → MP4
```

The included OAuth example keeps narration disabled so it renders without a TTS engine. Set `assetProviders.narration` to `voicevox` in `production.config.json` when rendering in an environment where VOICEVOX Engine is running.

See `docs/production-runner.md` for the production contract and provider configuration.

## Architecture

```text
Prompt / raw footage / references
        ↓
Brief → Storyboard → Asset Requests → Edit Plan
        ↓
Asset Provider Registry
        ↓
Style guardrails + renderer capability negotiation
        ↓
RenderSpec
        ↓
Remotion (default) / Animation Factory (specialized)
        ↓
MP4
```

Catalogs are independent:

- `catalog/editing/`: editorial vocabulary (92 patterns)
- `catalog/scenes/`: reusable scene strategies
- `catalog/assets/`: provider-neutral media capabilities
- `catalog/styles/`: pacing and density profiles
- `catalog/renderers/`: renderer-specific support maps

Agents should read `AGENTS.md` before authoring a production.

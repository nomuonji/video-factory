# Video Factory

Agent-native video production orchestration for generating complete videos from a prompt, optional source material, or both.

## Runnable path

```bash
npm install
npm run render -- oauth-60s
```

The default input mode is **generated**: filmed source footage is not required.

`render` runs:

```text
asset materialization → guardrails / prepare → Remotion → MP4
```

The included OAuth example keeps narration disabled so it renders without a local TTS engine. Set `assetProviders.narration` to `voicevox` in its `production.config.json` to generate Japanese narration through a local VOICEVOX engine.

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

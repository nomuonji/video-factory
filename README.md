# Video Factory

Agent-native video production orchestration for generating complete videos from a prompt, optional source material, or both.

## Current runnable path

```bash
npm install
npm run render -- oauth-60s
```

This prepares the prompt-only example, applies editing guardrails, filters operations through the default Remotion capability catalog, and renders `outputs/oauth-60s.mp4`.

The default input mode is **generated**: filmed source footage is not required.

See `docs/production-runner.md` for the production folder contract.

## Architecture

```text
Prompt / raw footage / references
        ↓
Brief → Storyboard → Asset Requests → Edit Plan
        ↓
Style guardrails + renderer capability negotiation
        ↓
RenderSpec
        ↓
Remotion (default) / Animation Factory (specialized)
        ↓
MP4
```

Catalogs remain independent:

- `catalog/editing/`: editorial vocabulary (92 patterns)
- `catalog/scenes/`: reusable scene strategies
- `catalog/assets/`: provider-neutral media capabilities
- `catalog/styles/`: pacing and density profiles
- `catalog/renderers/`: renderer-specific support maps

Agents should read `AGENTS.md` before authoring a production.

# Architecture

Video Factory separates creative planning from rendering implementation.

1. **Brief** — goal, audience, duration, format, language, constraints.
2. **Storyboard** — semantic scenes, narration, scene strategy, asset requests.
3. **Catalogs** — reusable vocabulary for scenes, assets, editing patterns, styles.
4. **Edit Plan** — renderer-neutral timeline operations with explicit reasons.
5. **Adapter** — translates supported operations into renderer-native events.
6. **Renderer** — produces frames, audio, and final video.

The Storyboard + Edit Plan pair is the stable boundary. Asset providers and renderers are replaceable.

## Input modes

- `generated`: prompt-first; all needed visual/audio assets are requested or generated.
- `raw`: footage-first; supplied material is analyzed and edited.
- `hybrid`: supplied and generated media are mixed.

All modes converge on the same Storyboard and Edit Plan contracts.

## Catalog split

- Scene catalog: **what should be on screen?**
- Asset catalog: **what media capability is needed?**
- Editing catalog: **how should attention, timing, and emphasis be shaped?**
- Style catalog: **how often and how strongly may those choices be used?**

This keeps new asset generators and new effects independent.

## Renderer capability negotiation

Editing patterns are `planned`, `partial`, or `supported`. A render stage must map a pattern, use a declared fallback, or report it as unsupported. Silent substitution is forbidden because it hides quality regressions.

## Animation Factory

Animation Factory already exposes declarative camera, UI, transition, actor, and effect events. Video Factory maps only capabilities known to exist there. Expanding Animation Factory should be followed by an explicit adapter mapping and catalog status update.

## Future growth

New image/video generators, TTS engines, music/SFX libraries, screen capture, stock media, 3D renderers, or evaluation agents can be added behind capability/adaptor boundaries without changing core production artifacts.

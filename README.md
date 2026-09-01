# Modern Bedroom Character Studio

A mobile-friendly Three.js bedroom scene containing the supplied character model.

## Run locally

Serve the repository over HTTP (the GLB cannot be loaded reliably from `file://`):

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Character animation note

The supplied GLB is a single static mesh: it contains no armature, skin joints, morph targets, or animation clips. The included controls therefore provide scene-level preview motions only. True limb animation (walk, sit, lie down, gestures) requires an armature/skin rig to be authored in Blender or a character-rigging service, then exported back to GLB. The loader is ready to receive a rigged replacement at `assets/character.glb`.

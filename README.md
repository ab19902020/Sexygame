# Modern Bedroom Character Studio

A mobile-friendly Three.js bedroom scene containing the supplied character model.

## Run locally

Serve the repository over HTTP (the GLB cannot be loaded reliably from `file://`):

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Character animation note

The scene now uses the supplied 41-joint humanoid rig and its original sample clip. Runtime skeletal motions include idle breathing, walking around the bed, hip sway, standing pose, sitting, camera-aware posing, a playful wave, and an automatic bedroom performance sequence.

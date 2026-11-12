# rdl_bottom_key_still

- Source image: `review/wp1d4-forward-hinge/rdl_bottom_key_still.png`
- Exercise ID: `romanian_deadlift`
- Camera: SideCam orthographic, sagittal (azimuth 0 deg from +X, looking -X)
- Frames rendered: 180
- JPEG size: 784x1136 px (max width 1600)
- JPEG quality: 45
- Chunks: 3 (`part-000.txt` ... `part-002.txt`)
- Total base64 characters: 61612
- SHA-256 (JPEG, before chunking): `076bec278a1569a202884d6a44b0f8496fa1694029bcf68c70f7251415e727f2`
- SHA-256 (JPEG, rebuilt from chunks): `076bec278a1569a202884d6a44b0f8496fa1694029bcf68c70f7251415e727f2`
- Reassembly check: concatenated chunks decode to a JPEG with magic bytes `FF D8 FF` and the same SHA-256 as the original.

## Anatomy convention

World anterior is **-Y**, posterior **+Y**, body up **Z**. The side camera
looks along -X, so the screen shows the sagittal (Y-Z) plane: anterior is
**image left**, posterior **image right**. Positive signed lean means the
thorax sits anterior of the pelvis (a forward hinge). Nothing is mirrored.

## Scope

Deepest hinge key still, annotated.

These are PREVIEW images for visual inspection, not a production render.
Status: **PREVIEW / AWAITING HUMAN REVIEW**. No exercise is approved here.

Rebuild the JPEG with:

```bash
cat part-*.txt | tr -d '\n' | base64 -d > preview.jpg
```

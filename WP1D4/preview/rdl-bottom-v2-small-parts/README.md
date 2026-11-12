# rdl_bottom_key_still

- Source image: `review/wp1d4-forward-hinge/rdl_bottom_key_still.png`
- Exercise ID: `romanian_deadlift`
- Camera: SideCam orthographic, sagittal (azimuth 0 deg from +X, looking -X)
- Frames rendered: 180
- JPEG size: 784x1136 px (max width 1600)
- JPEG quality: 45
- Chunks: 3 (`part-000.txt` ... `part-002.txt`)
- Total base64 characters: 61584
- SHA-256 (JPEG, before chunking): `fdc6a85ced0be310765c6d0a80b6b12e835cfde55077275408ab4d6b9bae5b36`
- SHA-256 (JPEG, rebuilt from chunks): `fdc6a85ced0be310765c6d0a80b6b12e835cfde55077275408ab4d6b9bae5b36`
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

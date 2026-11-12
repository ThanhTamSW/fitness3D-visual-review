# row_front45_sheet

- Source image: `review/wp1d4-forward-hinge/row_front45_sheet.png`
- Exercise ID: `barbell_row`
- Camera: FrontCam orthographic, azimuth 45 deg
- Frames rendered: 150
- JPEG size: 924x996 px (max width 1600)
- JPEG quality: 45
- Chunks: 3 (`part-000.txt` ... `part-002.txt`)
- Total base64 characters: 60244
- SHA-256 (JPEG, before chunking): `47fff0cc8a6665c2f88f88294841ad31d3e513a2eb14ef2d3cc1f69dc9f43c21`
- SHA-256 (JPEG, rebuilt from chunks): `47fff0cc8a6665c2f88f88294841ad31d3e513a2eb14ef2d3cc1f69dc9f43c21`
- Reassembly check: concatenated chunks decode to a JPEG with magic bytes `FF D8 FF` and the same SHA-256 as the original.

## Anatomy convention

World anterior is **-Y**, posterior **+Y**, body up **Z**. The side camera
looks along -X, so the screen shows the sagittal (Y-Z) plane: anterior is
**image left**, posterior **image right**. Positive signed lean means the
thorax sits anterior of the pelvis (a forward hinge). Nothing is mirrored.

## Scope

Front-45 check that both palms sit on the shaft.

These are PREVIEW images for visual inspection, not a production render.
Status: **PREVIEW / AWAITING HUMAN REVIEW**. No exercise is approved here.

Rebuild the JPEG with:

```bash
cat part-*.txt | tr -d '\n' | base64 -d > preview.jpg
```

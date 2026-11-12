# row_side_sheet

- Source image: `review/wp1d4-forward-hinge/row_side_sheet.png`
- Exercise ID: `barbell_row`
- Camera: SideCam orthographic, sagittal (azimuth 0 deg from +X, looking -X)
- Frames rendered: 1, 75, 150, 225, 300
- JPEG size: 1556x3292 px (max width 1600)
- JPEG quality: 32
- Chunks: 14 (`part-000.txt` ... `part-013.txt`)
- Total base64 characters: 325164
- SHA-256 (JPEG, before chunking): `eded3beedd9b8f6241f2f532e5563cc1f294093ddc3e5fac83f066c7a6afe4b7`
- SHA-256 (JPEG, rebuilt from chunks): `eded3beedd9b8f6241f2f532e5563cc1f294093ddc3e5fac83f066c7a6afe4b7`
- Reassembly check: concatenated chunks decode to a JPEG with magic bytes `FF D8 FF` and the same SHA-256 as the original.

## Anatomy convention

World anterior is **-Y**, posterior **+Y**, body up **Z**. The side camera
looks along -X, so the screen shows the sagittal (Y-Z) plane: anterior is
**image left**, posterior **image right**. Positive signed lean means the
thorax sits anterior of the pelvis (a forward hinge). Nothing is mirrored.

## Scope

Contact sheet of the row side stills, annotated with signed lean and shaft gap.

These are PREVIEW images for visual inspection, not a production render.
Status: **PREVIEW / AWAITING HUMAN REVIEW**. No exercise is approved here.

Rebuild the JPEG with:

```bash
cat part-*.txt | tr -d '\n' | base64 -d > preview.jpg
```

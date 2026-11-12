# rdl_side_sheet

- Source image: `review/wp1d4-forward-hinge/rdl_side_sheet.png`
- Exercise ID: `romanian_deadlift`
- Camera: SideCam orthographic, sagittal (azimuth 0 deg from +X, looking -X)
- Frames rendered: 1, 90, 180, 270
- JPEG size: 1556x2214 px (max width 1600)
- JPEG quality: 45
- Chunks: 11 (`part-000.txt` ... `part-010.txt`)
- Total base64 characters: 244452
- SHA-256 (JPEG, before chunking): `d63de98ab3160d38bab04597a49971bcc450ec69e1467a427feb8a214bbf6cab`
- SHA-256 (JPEG, rebuilt from chunks): `d63de98ab3160d38bab04597a49971bcc450ec69e1467a427feb8a214bbf6cab`
- Reassembly check: concatenated chunks decode to a JPEG with magic bytes `FF D8 FF` and the same SHA-256 as the original.

## Anatomy convention

World anterior is **-Y**, posterior **+Y**, body up **Z**. The side camera
looks along -X, so the screen shows the sagittal (Y-Z) plane: anterior is
**image left**, posterior **image right**. Positive signed lean means the
thorax sits anterior of the pelvis (a forward hinge). Nothing is mirrored.

## Scope

Contact sheet of the side stills, annotated with signed lean and shaft gap.

These are PREVIEW images for visual inspection, not a production render.
Status: **PREVIEW / AWAITING HUMAN REVIEW**. No exercise is approved here.

Rebuild the JPEG with:

```bash
cat part-*.txt | tr -d '\n' | base64 -d > preview.jpg
```

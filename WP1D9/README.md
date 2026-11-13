# WP1D.9 — Shadow Temporal Stability Investigation

Status: **PREVIEW / AWAITING HUMAN REVIEW**

This folder holds the diagnostic evidence for WP1D.9. The findings, the numbers
and the remedy comparison are in the code repository:

`ThanhTamSW/fitness3D`, branch `wp1d6/visual-artifact-audit` @ `99db1dc`,
`docs/production/WP1D9_SHADOW_TEMPORAL_STABILITY.md`

Nothing here approves an exercise. RDL and the barbell row remain
`PREVIEW / AWAITING HUMAN REVIEW`. F3 is not implemented.

## The finding in one paragraph

The shadow brightness variation WP1D.7 reported as 9.396 levels is real, but
that number was diluted: the WP1D.7 subject mask was a luminance threshold on an
opaque frame whose backdrop covered 88% of the mask. Measured on the production
alpha subject, the same event is a **35.25-level, 100,370-pixel flash on the
torso**: the equipment's cast shadow appears on one frame and is gone on the
next. It appears in roughly half of the production render processes measured and
on different frame numbers each time, so it is render-call state, not a frame
pattern. Four renders of the same frame in one process are byte-identical.

## Folder map

| Path | What it is |
|---|---|
| `evidence/` | The retained PNGs each finding cites. Every number in `measurements/series.json` is recomputable from these plus the code repository's `flicker.js` |
| `measurements/series.json` | The controlled matrix: 24 series, per-frame means, hashes, steps and the flicker verdict |
| `findings.json` | C1–C7 and the remedy comparison R1–R6, machine-readable, each with evidence paths |
| `playback/consecutive_shipped.mp4` | 15 frames, 30 fps, 0.5 s, of the worst RDL run |
| `playback/consecutive_row_shipped.mp4` | The row control, same window, stable |

The `evidence/` pairs are the frames on either side of the worst measured step,
so a reader can check the flash by opening two files. For the stable series the
pair is the first two consecutive frames, which is the "these two adjacent 30 fps
frames are equal" claim.

## What to look at first

1. `evidence/consecutive_shipped__0183.png` and `…__0184.png` — the flash. The
   torso is shadowed in one and lit in the other.
2. `evidence/same_frame_shipped__0180__r0.png` through `…__r3.png` — four
   renders of one frame, all four with the same SHA-256.
3. `evidence/consecutive_shipped__0184.png` against
   `evidence/consecutive_shadow_scale_05__0176.png` — the shadow passes look
   almost the same, which is the point: the remedy costs little visually.

## Limits of this evidence

A still cannot flicker. The measured step is a per-frame difference; the clips
are the moving form of the same frames. No viewer study was run, so "visible
flicker" here means a 35-level, 100,370-pixel change in a 30 fps sequence, not a
perception result. The internal shadow-page mechanism is not isolated (C7), and
`shadow_resolution_scale = 0.5` has 60 frames of evidence for an intermittent
defect, not a full production run.

The full probe tree (557 PNGs, 535 MB) is not published. It is regenerable with
`01_production_scene.py`, and the code repository's `.gitignore` says so.

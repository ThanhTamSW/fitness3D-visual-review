# WP1D9.1 — Shadow Resolution Scale 0.5 Full-Length Validation

**Status: PREVIEW / AWAITING HUMAN REVIEW**

Decision: **`PARTIALLY VALIDATED — MORE TESTING REQUIRED`**

R1 (`shadow_resolution_scale = 0.5`) is **not** implemented in production. This
folder is the validation evidence, not a shipped change.

## The result in one table

Serial full-length renders, one Blender process at a time, adjacent-frame step
on the eroded alpha subject, 2.0-level defect threshold from WP1D.9:

| Exercise | Variant | Frames | Max step | Defect |
|---|---|---:|---:|---|
| RDL | shipped | 360 | 32.94 | yes |
| RDL | R1 | 360 | **21.83** | **yes** |
| Row | shipped | 300 | 23.79 | yes |
| Row | R1 | 300 | **0.06** | **no** |

**R1 clears the row and does not clear the Romanian deadlift.** On RDL it
reduces the excursion from 32.94 to 21.83 levels — still ten times the
threshold — without changing its shape. RDL is the exercise that motivated the
work, so this is partial.

## Why the first pass was thrown away

The first pass ran three Blender processes at once to save wall time. In 6 of 7
runs that produced frames where the subject rendered at mean ~23 instead of
~119 with an identical alpha silhouette (same 172,589 subject pixels; RGB max
42 instead of 255). GPU contention, not a shadow. Serialising removed it: 0
dark frames in every serial run.

Both passes are kept. The parallel numbers are labelled invalid in the code
repository's `measurements/confound.json` rather than deleted, because a
measurement you discard silently is one you cannot learn from.

## Interval frames worth looking at

| File | What it shows |
|---|---|
| `rdl_shipped_f0066.png` / `f0067` | the shipped defect: 119.9 → 86.9 → 119.8 |
| `rdl_r1_f0053.png` / `f0054` | the same event under R1: 115.9 → 97.8 → 119.6 |
| `rdl_shipped_f0053..55`, `f0068` | neighbouring frames for contrast |
| `rdl_r1_f0055`, `f0066..68` | neighbouring frames under R1 |
| `row_shipped_f0249..251` | the row defect at frame 250 |
| `row_shipped_f0081`, `f0082` | a second row event |

Each `.png` is the render; each `.jpg` is a quality-88 preview for inline
viewing; each `-b64/` folder holds the JPEG as base64 chunks, so an image can
be rebuilt by a client that cannot fetch binary:

```bash
cat part-*.txt | tr -d '\n' | base64 -d > rebuilt.jpg
```

## Hashes

`manifest.json` carries the PNG and JPEG SHA-256 for every image, plus chunk
counts. All 17 chunk sets were verified by reading the files back, decoding,
checking `FF D8 FF`, and comparing SHA-256 against the JPEG before chunking.
No image needs more than 7 chunks or more than 24,000 characters per chunk.

## Shadow quality

| Metric | RDL shipped | RDL R1 | Row shipped | Row R1 |
|---|---:|---:|---:|---:|
| Shadow fraction of subject | 0.04756 | 0.04546 | 0.04617 | 0.04545 |
| Shadow mean brightness | 43.91 | 43.90 | 44.36 | 44.49 |
| Lit mean brightness | 122.36 | 121.93 | 123.28 | 123.70 |

Coverage drops ~4% on RDL and ~1.6% on Row; darkness is unchanged, so
self-shadowing survives and R1 is not equivalent to disabling shadows.

**These are pixel metrics, not a verdict.** Nobody has looked at these images
and decided the softer shadow is acceptable. No viewer study was run and no
playback clip was produced. Whether a 4% coverage loss is visible at 30 fps is
open.

## Unverified

- The internal EEVEE Next shadow allocation mechanism is still unexplained.
- **One serial run per exercise-variant.** The row result rests on a single
  300-frame run; a defect seen in 2 of 4 earlier runs needs more than one clean
  run before it can be called absent.
- Shadow quality at scales other than 0.5 is not measured.
- Only RDL and Row are in scope; the other six exercises cannot produce a
  moving-equipment cast shadow, and the reasons are in the code repository's
  `plan.js`.

## Reproducibility, stated honestly

The PNGs here are the cited frames. The full ~3,000-frame sequences (~3.5 GB)
are not published: they are in the code repository's `timing*/raw/` trees,
gitignored, regenerable with `run_full.js`. `manifest.json` carries the SHA-256
of every PNG here, and every reported number comes from the per-frame
measurement JSON that **is** tracked.

Tracking issue: [#1](https://github.com/ThanhTamSW/fitness3D/issues/1) — open.

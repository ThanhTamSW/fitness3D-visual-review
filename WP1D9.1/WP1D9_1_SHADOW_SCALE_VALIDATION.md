# WP1D.9.1 — Shadow Resolution Scale 0.5 Full-Length Validation

Status: **PREVIEW / AWAITING HUMAN REVIEW**
Decision: **`PARTIALLY VALIDATED — MORE TESTING REQUIRED`**

Validation only. R1 is **not** implemented in production configuration.

## 1. Starting state

| | |
|---|---|
| Code repo | `ThanhTamSW/fitness3D`, branch `wp1d6/visual-artifact-audit` |
| Code HEAD at start | `13dad19` |
| Review repo | `ThanhTamSW/fitness3D-visual-review`, `main` |
| Review HEAD at start | `e085e9b` |

Both trees clean. WP1D.8 (`c353847`) and WP1D.9 (`13dad19`) evidence preserved.

## 2. Exercises and frame counts

Read from each job document, never assumed:

| Exercise | Frames | Equipment | In scope |
|---|---|---|---|
| Romanian deadlift | **360** | barbell, plates, collars (`hands_from_floor`) | yes — primary defect case |
| Barbell row | **300** | barbell, plates, collars (`hands_from_floor`) | yes |
| Dead hang | — | fixed overhead bar, body travels under it | excluded: no moving caster |
| Push-up | — | static mat under the body | excluded: cannot sweep a shadow |
| Shoulder mobility | — | none declared | excluded: no equipment |
| Walking lunge | — | none declared | excluded: no equipment |

Only two exercises carry equipment that moves relative to the torso, so only two
can reproduce the defect under study.

## 3. Method note: the first pass was invalid

The first pass rendered three Blender processes at once. **That contaminated the
result and is reported here rather than hidden.**

With three processes running, 6 of 7 runs contained frames where the subject
rendered at mean ~23 instead of ~119 with an **identical alpha silhouette** —
same 172,589 subject pixels, RGB maximum 42 instead of 255. The step detector
correctly flags those as defects, but they are a renderer/GPU contention
artifact, not the shadow defect under study.

Serialising fixed it completely:

| Variant | Parallel dark frames | Serial dark frames |
|---|---:|---:|
| RDL shipped | 6 | **0** |
| RDL R1 | 0 seen / 3 runs, 1 run inverted | **0** |
| Row R1 | 11 and 3 | **0** |
| Row shipped | — | **0** |

**Every number below is from serial renders: one Blender process at a time.**
The parallel JSON is kept in `timing/raw/` and its numbers are in
`measurements/confound.json`, labelled as invalid for this question. Wall time
was ~12 minutes per 360-frame run serial versus ~58 minutes for the whole
parallel matrix; the price of a valid measurement is time, not accuracy.

## 4. Serial results, full length

One serial run per exercise per variant. Adjacent-frame step on the eroded
alpha subject, defect threshold 2.0 levels from WP1D.9 (imported, not restated).

| Exercise | Variant | Frames | Median | Max step | Step frame | Defect |
|---|---|---:|---:|---:|---:|---|
| RDL | shipped | 360 | 119.11 | **32.94** | 66 | yes |
| RDL | R1 | 360 | 118.53 | **21.83** | 54 | **yes** |
| Row | shipped | 300 | 119.51 | **23.79** | 250 | yes |
| Row | R1 | 300 | 119.95 | **0.06** | 102 | **no** |

**R1 removes the defect on Row and does not remove it on RDL.** On RDL it
reduces the amplitude from 32.94 to 21.83 levels without changing its shape:
the same frame dips and recovers instead of jumping clean.

The RDL sequence shows why a smaller shadow map is not sufficient. Shipped
frame 66 goes 119.9 → 86.9 → 119.8 in two frames. Under R1, frame 53–54 goes
115.9 → 97.8 → 119.6. The excursion is shallower and still 21.8 levels, ten
times the 2.0-level rule.

`consecutive_plates_hidden` in WP1D.9 measured 0.0006, so the caster is still
the equipment. R1 changes how much of the caster's shadow is lost, not whether
it can be lost.

## 5. Shadow quality

Matched frames, averaged across each full sequence:

| Metric | RDL shipped | RDL R1 | Ratio |
|---|---:|---:|---:|
| Shadow fraction of subject | 0.04756 | 0.04546 | 0.956 |
| Shadow mean brightness | 43.91 | 43.90 | 1.000 |
| Lit mean brightness | 122.36 | 121.93 | 0.996 |
| Row shadow fraction | 0.04617 | 0.04545 | 0.985 |
| Row shadow mean | 44.36 | 44.49 | 1.003 |

Shadow **coverage** drops ~4% on RDL and ~1.5% on Row; shadow **darkness** is
unchanged. Self-shadowing still exists — the shadow region is not empty at
either setting, so R1 is not equivalent to disabling shadows.

**Not measured here:** shadow edge sharpness as a perceptual quantity, shadow
acne, peter-panning, and contact-shadow crispness. `validate.js` has a
`shadowEdgeGradient` metric, but it was not run across the full serial set in
this pass. **Nobody has looked at the images.** These numbers bound the change;
they do not decide whether a viewer finds it acceptable.

## 6. Evidence: what is reproducible

| Path | Contents | Tracked | Reproducible from a clone |
|---|---|---|---|
| `timing-serial/raw/*.json` | 4 full serial runs, per-frame means and hashes | yes | **yes**, measurements only |
| `timing/raw/*.json` | 7 parallel runs (invalid, see §3) | yes | **yes**, measurements only |
| `measurements/summary.json` | computed series and events | yes | yes |
| `measurements/confound.json` | parallel vs serial side by side | yes | yes |
| `measurements/quality.json` | shadow coverage comparison | yes | yes |
| `timing*/raw/**/*.png` | ~2,400 + 720 rendered frames | **no** (gitignored) | **no** |

The PNGs are ~3.5 GB and regenerable with `run_full.js` or the serial commands
in §3. The `file` fields in the serial JSON point at `timing-serial/raw/...`,
which is the correct location but is gitignored, so a clone has the numbers and
not the pixels. **A fresh clone can rebuild every reported number from the
tracked JSON; it cannot re-derive those numbers from images without
re-rendering.** The report says which, per row, instead of claiming blanket
reproducibility.

## 7. Clean-clone behaviour

`build/anatomy.glb` is gitignored by design, so a clean clone cannot verify
assets that depend on it. `protected-inputs.js` reports a missing asset as an
explicit **skip with a reason**, not a pass and not a failure. Present files are
still hashed and must match, so corruption cannot hide behind the skip.

## 8. Decision

**`PARTIALLY VALIDATED — MORE TESTING REQUIRED`**

R1 is not eligible for implementation review. It works on Row (0.06 levels,
60 frames of clean signal at 2.0 threshold) and fails on RDL (21.83 levels, ten
times the threshold) — and RDL is the exercise that motivated F3.

A remedy that fixes one of two exercises, on a single run each, is not a fix.
Tuning `shadow_resolution_scale` further (0.25, 0.125) is the obvious next
experiment and is **not** attempted here: it would trade an unknown amount of
shadow quality for an unknown defect reduction, and the RDL failure suggests the
mechanism is not resolution-driven.

## 9. Unverified

1. The internal EEVEE Next shadow allocation mechanism remains unresolved. This
   milestone did not attempt to explain it.
2. **One serial run per exercise-variant.** Four runs total. A defect that
   appeared in 2 of 4 WP1D.9 runs needs more than one clean run to call absent,
   and the Row result rests on a single 300-frame run.
3. Shadow quality on scales other than 0.5 is not measured.
4. No perceptual assessment. No viewer study. No full-length MP4.
5. Only RDL and Row are in scope; six remaining exercises produce no relevant
   caster.
6. Frame-to-frame behaviour at playback speed is unmeasured; this is
   still-frame analysis at 30 fps spacing.

## 10. Files

`review/wp1d9-1-shadow-scale-validation/`: `plan.js`, `validate.js`,
`protected-inputs.js`, `run_full.js`, `aggregate.js`, `confound.js`,
`quality.js`, `measurements/`, `timing/`, `timing-serial/`.
Test: `test/wp1d9-1.test.js`.

No production file changed. `render.py`, both specs, the render config, the
anatomy asset and the production manifests are untouched. No MP4 or GLB was
generated. No exercise was approved. Issue #1 is open.

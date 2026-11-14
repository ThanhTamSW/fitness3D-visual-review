# WP1D.9.1 — Shadow Resolution Scale 0.5 Full-Length Validation

Status: **PREVIEW / AWAITING HUMAN REVIEW**
Decision: **`R1 REJECTED — IMPROVES 2, DEGRADES 3, 1 UNMEASURABLE`**

Validation only. R1 is **not** implemented in production configuration.

This revision replaces the earlier four-run verdict. The corpus is now 20 serial
full-length runs covering all six moving-equipment exercises, and two earlier
conclusions did not survive it: that serialising removes the dark-frame artifact,
and that R1 is a plausible general fix.

## 1. Starting state

| | |
|---|---|
| Code repo | `ThanhTamSW/fitness3D`, branch `wp1d6/visual-artifact-audit` |
| Code HEAD at start | `13dad19` |
| Review repo | `ThanhTamSW/fitness3D-visual-review`, `main` |
| Review HEAD at start | `e085e9b` |

Both trees clean. WP1D.8 (`c353847`) and WP1D.9 (`13dad19`) evidence preserved.

## 2. Exercises and frame counts

Read from each job document, never assumed. Every moving-equipment exercise is
validated; none is silently omitted.

| Exercise | Frames | Equipment | Runs baseline / R1 |
|---|---|---:|---|
| Romanian deadlift | 360 | barbell, plates, collars (`hands_from_floor`) | 2 / **3** |
| Barbell row | 300 | barbell, plates, collars (`hands_from_floor`) | 1 / **2** |
| Barbell squat | 360 | barbell (`upper_back_and_hands`), rack (`behind_figure`) | 1 / **2** |
| Bicep curl | 300 | dumbbell (`in_hands`) | 1 / **2** |
| Hip thrust | 360 | barbell (`hips_supported_on_bench`), bench (`behind_figure`) | 1 / **2** |
| Pallof press | 300 | cable machine (`handle_in_hands`) | 1 / **2** |

Excluded, with the reason recorded rather than the exercise skipped:

| Exercise | Reason |
|---|---|
| Dead hang | fixed overhead grip; the body travels under a static bar, so there is no moving caster |
| Push-up | static mat under the body; it cannot sweep a shadow across the torso |
| Shoulder mobility | no equipment declared |
| Walking lunge | no equipment declared |

## 3. Method: two confounds, one of them not what was believed

### 3.1 Parallel rendering corrupts frames

The first pass ran three Blender processes at once. In 6 of 7 runs the subject
rendered at mean ~23 instead of ~119 with an **identical alpha silhouette**
(same 172,589 subject pixels, RGB maximum 42 instead of 255). That is GPU/process
contention, not the shadow defect. `timing/raw/` holds those runs, labelled
invalid in `measurements/confound.json`.

The runner now refuses `--parallel` other than 1, and the aggregator refuses to
read `timing/`. Both are enforced by tests, because a warning in a log was
evidently not enough.

### 3.2 Serial rendering does **not** eliminate dropped lighting passes

The earlier report claimed serial dark frames = 0. **That was wrong**, and it was
wrong because it rested on four runs. On the 20-run serial corpus:

| Run | Dropped frames | Of | Share |
|---|---:|---:|---:|
| `barbell_squat` R1 run b | **254** | 360 | 70.6% |
| `bicep_curl` R1 run a | 289 | 300 | 96.3% |
| `bicep_curl` R1 run b | 283 | 300 | 94.3% |
| `bicep_curl` shipped run a | 297 | 300 | 99.0% |
| `hip_thrust` shipped run a | 2 | 360 | 0.6% |
| `pallof_press` shipped run a | 1 | 300 | 0.3% |
| `romanian_deadlift` R1 run c | 1 | 360 | 0.3% |

A dropped frame renders the subject at mean 19–27 with RGB max ≤ 43 while the
alpha silhouette is byte-identical to its neighbours. Verified at pixel level:
`barbell_squat/shadow_scale_05/runb` f5 is lit (RGB max 255), f50/f100/f200/f348
are dropped (19.4/19.4/19.2/19.4), and every one has the same subject-pixel count
as its lit twin in run a.

**The affected run counts are opposite to what concurrency would predict** — RDL
run c, the third of three serial RDL runs, dropped one frame; squat run a dropped
none. So parallel rendering is not the cause. It changes the frequency, not the
existence, of the fault. The mechanism remains unexplained and is recorded as an
open question, not a resolved one.

### 3.3 The bicep curl scene is uniformly dark by design

`bicep_curl` renders at subject median **27.08** in *both* variants (RGB max 42,
whole-frame max luminance 38). That is not a dropout: it is what this exercise's
scene looks like. It is therefore **unmeasurable** with a threshold calibrated on
lit scenes, and it is reported as unmeasurable rather than as "no defect".

### 3.4 Consequence for the metric

Pairing a dropped frame with its lit neighbour fabricates a ~97-level step. On
RDL R1 run c that single pair produced a raw maximum of **96.904**, which
inverted the verdict from "R1 reduces the peak 32.94 → ~22" to "R1 is worse than
baseline". The number was an artifact of the dropout, not a shadow.

The aggregator now computes the step series between consecutive **lit** frames
only, records how many frames it excluded, and reports both the raw and the
lit-only maximum so the exclusion is auditable. The threshold (60) sits in an
empty gap: lit subjects measure 85–125, dropped frames 19–27.

## 4. Results, 20 serial runs, 6,660 frames

Lit frames only. Adjacent-frame step on the eroded alpha subject; defect
threshold 2.0 levels imported from WP1D.9. "Defects" counts steps ≥ 2.0 across
all runs of that configuration.

| Exercise | Runs (base/R1) | Baseline peak | Baseline defects | R1 peak | R1 defects | Verdict |
|---|---:|---:|---:|---:|---:|---|
| Barbell row | 1 / 2 | 23.79 | 12 | **0.06** | **0** | **IMPROVED** |
| Barbell squat | 1 / 2 | 31.10 | 76 | **4.36** | **15** | **IMPROVED** |
| Hip thrust | 1 / 2 | 10.12 | 8 | **32.69** | **52** | **WORSE** |
| Pallof press | 1 / 2 | 25.62 | 56 | 11.70 | **315** | **WORSE** |
| Romanian deadlift | 2 / 3 | 32.94 | 26 | 22.48 | **147** | **WORSE** |
| Bicep curl | 1 / 2 | — | — | — | — | **UNMEASURABLE** |

### Run-to-run consistency

Independent runs of the same configuration agree closely, which is what makes the
comparison usable:

| Exercise | Variant | Per-run lit peaks | Spread |
|---|---|---|---:|
| Romanian deadlift | R1 | 21.83, 22.48, 22.41 | **0.65** |
| Romanian deadlift | shipped | 32.94, 32.90 | 0.04 |
| Barbell row | R1 | 0.055, 0.055 | 0.00 |
| Hip thrust | R1 | 32.69, 32.51 | 0.19 |
| Pallof press | R1 | 9.26, 11.70 | 2.44 |
| Barbell squat | R1 | 4.36, 3.31 | 1.06 |

So R1 genuinely halves the RDL **peak** (32.94 → ~22) and the second datum
confirms it. But the peak is not the whole defect: RDL R1 has **147** defect
events against the baseline's 26. A smaller shadow map makes each excursion
shallower and makes them more frequent.

That is the decision-relevant fact, and it is why a peak-only reading gets the
answer backwards.

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
unchanged. Self-shadowing survives — the shadow region is non-empty at either
setting, so R1 is not equivalent to disabling shadows.

**Not measured:** shadow edge sharpness as a perceptual quantity, acne,
peter-panning, contact-shadow crispness. `validate.js` has a
`shadowEdgeGradient` metric; it was not run across the full serial set.
**Nobody has looked at the images.** These numbers bound the change; they do not
decide whether a viewer finds it acceptable.

## 6. Evidence: what is reproducible

| Path | Contents | Tracked | Reproducible from a clone |
|---|---|---|---|
| `timing-serial/raw/*.json` | **20** full serial runs, per-frame means and hashes | yes | **yes**, measurements only |
| `timing/raw/*.json` | 7 parallel runs (invalid, see §3.1) | yes | **yes**, measurements only |
| `measurements/summary.json` | computed series, events, lit-only figures, verdicts | yes | yes |
| `measurements/confound.json` | parallel vs serial side by side | yes | yes |
| `measurements/quality.json` | shadow coverage comparison | yes | yes |
| `timing*/raw/**/*.png` | ~7,000 rendered frames | **no** (gitignored) | **no** |

The PNGs are several GB and regenerable with `run_full.js`. A fresh clone can
rebuild every reported number from the tracked JSON; it cannot re-derive those
numbers from images without re-rendering. Total serial wall time: **197 minutes**
for 16 new runs (4 were already complete), ~11–15 minutes per run.

## 7. Clean-clone behaviour

`build/anatomy.glb` is gitignored by design, so a clean clone cannot verify
assets that depend on it. `protected-inputs.js` reports a missing asset as an
explicit **skip with a reason**, not a pass and not a failure. Present files are
still hashed and must match, so corruption cannot hide behind the skip.

`build/tmp/wp1d9/*.job.json` is also gitignored; `build-jobs.js` regenerates it
from the specs through the production job builder.

## 8. Decision

**`R1 REJECTED — IMPROVES 2, DEGRADES 3, 1 UNMEASURABLE`**

R1 is not eligible for implementation review.

- **Improves** barbell row (0.06 peak, 0 defects) and barbell squat
  (31.10 → 4.36, 76 → 15 defects).
- **Degrades** hip thrust (peak 10.12 → 32.69, defects 8 → 52), pallof press
  (defects 56 → 315), and the Romanian deadlift (peak down 32%, **defects up
  26 → 147**). RDL is the exercise that motivated F3.
- **Unmeasurable** for bicep curl: its scene is uniformly dark in both variants.

A change that fixes two exercises and makes three worse is not a global setting.
Any future attempt must be per-exercise and validated per-exercise, or it must
address the cause rather than the shadow-map size.

## 9. What remains unresolved

1. **The EEVEE Next shadow mechanism is not explained.** R1 changing peak
   amplitude and defect frequency in opposite directions on different exercises
   is inconsistent with a simple "resolution affects shadow stability" model.
   The pool-size sweep in WP1D.9 was equally non-monotonic (1024 worse than 512).
2. **The dropped-lighting-pass fault is unexplained** and is not caused by
   concurrency, as §3.2 now shows. It affects 1 frame in 360 in some runs and 254
   in 360 in another. Its frequency is high enough to corrupt any single-run
   measurement that does not exclude it.
3. **No human has viewed any of these frames.** Every claim here is numeric.
4. **One baseline run per non-primary exercise.** That is enough to establish a
   peak and a defect count, not enough to characterise baseline variance.
5. **Bicep curl has no usable baseline**, so it cannot support any R1 conclusion
   until its scene exposure is fixed — which is out of scope here.

## 10. Production state

Unchanged and verified by test: `production/config/render.config.json` does not
set `shadow_resolution_scale`, and `production/scripts/render.py` does not
reference it. R1 exists only as a harness variant in
`review/wp1d9-shadow-stability/01_production_scene.py`.

RDL and Barbell Row remain **PREVIEW / AWAITING HUMAN REVIEW**. No exercise
carries an approval status.

# WP1D9.1 — Shadow Resolution Scale 0.5 Full-Length Validation

**Status: PREVIEW / AWAITING HUMAN REVIEW**

Decision: **`R1 REJECTED — IMPROVES 2, DEGRADES 3, 1 UNMEASURABLE`**

R1 (`shadow_resolution_scale = 0.5`) is **not** implemented in production. This
folder is the validation evidence, not a shipped change.

## The result in one table

20 serial full-length renders, one Blender process at a time, adjacent-frame
step on the eroded alpha subject, 2.0-level defect threshold from WP1D.9.
"Defects" counts steps over that threshold across all runs of a configuration.

| Exercise | Runs (base/R1) | Baseline peak | Baseline rate | R1 peak | R1 rate | Ratio | Verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| Barbell row | 1 / 2 | 23.79 | 40.13 | **0.06** | **0.00** | **0.00×** | **IMPROVED** |
| Barbell squat | 1 / 2 | 31.10 | 211.70 | **4.36** | **38.36** | **0.18×** | **IMPROVED** |
| Hip thrust | 1 / 2 | 10.12 | 22.54 | **32.69** | 72.42 | **3.21×** | **WORSE** |
| Pallof press | 1 / 2 | 25.62 | 188.55 | 11.70 | **526.76** | **2.79×** | **WORSE** |
| Romanian deadlift | 2 / 3 | 32.94 | 36.21 | 22.48 | **136.74** | **3.78×** | **WORSE** |
| Bicep curl | 1 / 2 | — | — | — | — | — | **UNMEASURABLE** |

Rate = defect events per 1,000 usable lit frame pairs. The configurations have
different run counts (RDL has 2 baseline runs and 3 R1 runs), so raw totals
would reward whichever variant was rendered more often. The normalisation does
not change any verdict — it confirms that the conclusion rests on the effect,
not on sample size.

**R1 is not a global setting.** It clears the row and the squat, and makes hip
thrust, pallof press and the Romanian deadlift worse. RDL is the exercise that
motivated the work: its peak falls 32.94 → 22.48 while its defect **rate** rises
**3.78×**, because a smaller shadow map makes each excursion shallower and more
likely. A peak-only reading gets that backwards.

## Two corrections

The earlier four-run version of this report said R1 was "partially validated"
and that serialising removed the dark frames. Both claims are corrected here
rather than quietly dropped.

**1. Serial rendering does not remove the dark frames.** The 20-run serial
corpus contains them too: `barbell_squat` R1 run b dropped 254 of 360 frames,
`romanian_deadlift` R1 run c dropped 1, two baselines dropped 1–2. So
concurrency is not the cause; it changes the frequency, not the existence. The
mechanism is unexplained and is listed as an open question.

A dropped frame renders the subject at mean 19–27 with RGB max ≤ 43 while the
alpha silhouette is byte-identical to its neighbours. Pairing one with a lit
neighbour fabricates a ~97-level step. On RDL run c that single pair produced a
raw maximum of 96.90 and inverted the verdict. The aggregator now measures
between consecutive **lit** frames only, and reports both the raw and the
lit-only maximum so the exclusion is auditable.

**2. The tracked summary was built from the invalid parallel pass.** It reported
Row R1 max 98.95; the serial value is 0.06. The aggregator now refuses to read
`timing/`, defaults to `timing-serial/`, and the runner refuses `--parallel`
other than 1. Tests enforce all three.

**3. Bicep curl is unmeasurable, not clean.** Its scene renders at subject
median 27 in *both* variants (whole-frame luminance max 38). With a threshold
calibrated on lit scenes it produces no detectable steps, which would read as
"R1 fixed it". It is reported as unmeasurable instead.

## Frames to look at

`evidence/` holds 20 PNGs, each with a JPEG and a base64 chunk set that verifies
against the manifest hash. They are chosen to show every claim and every
correction:

| What | Frames |
|---|---|
| Row: baseline peak vs clean R1 | `barbell_row_ship_runa_f0250`, `barbell_row_r1_runb_f0102` |
| Squat: R1 improvement | `barbell_squat_ship_runa_f0162`, `barbell_squat_r1_runa_f0026` |
| Squat: a lit frame next to dropouts | `..._r1_runb_f0005` (lit), `f0050` and `f0100` (dropouts) |
| RDL: R1 still defective | `romanian_deadlift_ship_runa_f0066`, `..._r1_runb_f0032` |
| RDL: the dropout that inverted the verdict | `..._r1_runc_f0280`, `f0281`, `f0300` |
| Hip thrust / pallof: R1 degradation | `hip_thrust_ship_runa_f0334`, `..._r1_runa_f0025`, `pallof_press_*` |
| Bicep curl: uniformly dark | `bicep_curl_ship_runa_f0100`, `..._r1_runa_f0300` |

Four of the original runs predate this session and their PNGs were removed; the
frames the earlier report quoted survive in the code repository's tracked
`evidence/` directory and are republished from there.

## Reproducing

```
node review/wp1d9-1-shadow-scale-validation/build-jobs.js
node review/wp1d9-1-shadow-scale-validation/run_full.js --out timing-serial
node review/wp1d9-1-shadow-scale-validation/aggregate.js --from timing-serial
python tools/wp1d9_1_package.py
```

Serial wall time: 197 minutes for 16 runs (~11–15 min each). The per-frame JSON
is tracked; the PNGs are not, so a clone can rebuild every number but not the
pixels without re-rendering.

## What is still unknown

- The EEVEE Next shadow mechanism. R1 moving peak and defect frequency in
  opposite directions on different exercises is inconsistent with a simple
  "resolution affects shadow stability" model.
- The dropped-lighting-pass cause. Not concurrency, as the serial corpus shows.
- Whether any of this is perceptible. **Nobody has looked at these images.**
  Every statement above is numeric.

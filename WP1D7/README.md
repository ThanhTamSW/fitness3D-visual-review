# WP1D.7 — Anatomy Overlay & Render Artifact Investigation

Status: **PREVIEW / AWAITING HUMAN REVIEW**
Revision: **WP1D.7.1** (evidence reconciliation and documentation sync)

This folder holds the diagnostic evidence for WP1D.7. The findings, the numbers
and the proposed fixes are in the code repository:

`ThanhTamSW/fitness3D`, branch `wp1d6/visual-artifact-audit` @ `0ca5731`,
`docs/production/WP1D7_ANATOMY_OVERLAY_RENDER_INVESTIGATION.md`

Nothing here approves an exercise. Both exercises remain
`PREVIEW / AWAITING HUMAN REVIEW`.

WP1D.7.1 changed no image, render or measurement. It reconciled the documents
with the artefacts already published, and rewrote this README against
`measurements/matrix_repeat.json` and the code repository's report. The
superseded figures stay recorded in the report's §12, not silently dropped.

## Folder map

| Folder | What it isolates |
|---|---|
| `diagnostics/` | 7 renders per exercise, one variable each: body only, muscle only, body+muscle, +skeleton, neutral material, wireframe, normals as colour |
| `matrix/` | The required raytracing x denoise table, A/B/C/D, two renders per cell |
| `visibility/` | Ray-cast front-most surface maps: no shading, no materials, no denoiser |
| `skin_seams/` | Body shell only, shipping vs welded surface, each rendered twice |
| `shadow/` | Frames proving the shadow-pass brightness step, plus one frame per candidate switch |
| `measurements/` | Every JSON the report quotes, plus `anatomy_audit.json`, `cross_side.json` and `face_definitions.json` |
| `findings.json` | The same findings in machine-readable form, with evidence paths |

`weld/` and `repeat/` are **not** published here. They are regenerable from the
PNGs and scripts in the code repository, and the report says so.

Each PNG has a `.jpg` beside it for inline viewing. The PNG is the authoritative
file; the JPEG is a preview encoded at quality 88 and is not used for any
measurement.

Each `.jpg` also has a `-b64/` folder beside it holding `part-000.txt`,
`part-001.txt`, ... — the same base64 chunking WP1D6 uses, so an image can be
rebuilt by a client that cannot fetch binary. All 44 sets were verified by
reading the chunk files back, decoding, checking `FF D8 FF`, and comparing
SHA-256 against the JPEG before chunking. No set needs more than 4 chunks or
more than 24,000 characters per chunk. The per-image hashes are in
`measurements/chunk_manifest.json`.

```bash
cat part-*.txt | tr -d '\n' | base64 -d > rebuilt.jpg
```

## How to read the evidence

Grain and seams were measured on the PNGs, never on the JPEGs. The reviewed
WP1D.6 JPEGs were encoded at quality 80, and that encode adds 8x8 block ringing
on its own (`measurements/published_grain.json`), so measuring a JPEG would mix
the renderer with the encoder.

## The raytracing x denoise matrix

Two renders of an unchanged scene per cell, shadows off so the B1 oscillation
cannot contaminate the comparison. Pixels differing by more than 8 levels:

| Cell | Ray tracing | Denoise | Romanian deadlift | Barbell row |
|---|---|---|---|---:|
| A | ON | ON | 36,715 | 38,683 |
| B | OFF | ON | 2 | 1 |
| C | OFF | OFF | 0 | 0 |
| D | ON | OFF | 12,280 | 10,279 |

Source: `measurements/matrix_repeat.json`, recomputed from `matrix/*.png` with
`abs(r0 - r1)` on RGB, max across channels. No cell is byte-identical; cells B
and C sit at the 8-bit floor and cells A and D are three to four orders of
magnitude above it. An earlier revision of this README carried different tracer
counts that appeared in no measurement file; §12 (V1, V9) of the report records
what was superseded and why.

## What the evidence shows

- The body shell ships as per-face split vertices: 41,999 vertices for 7,160
  unique float32 positions. Welding it in memory changes 16.6% of the skin's
  pixels. 1,177 shared positions carry corner normals more than 30° apart (2,366
  corner normals away from the first corner at their position); 760 split edges
  disagree across the seam.
- `obliques` publishes two different face counts and both are correct.
  **3,240** faces are flagged flat by Blender's glTF import, which derives the
  flag from the corner normals because glTF stores no shading flag. **3,312**
  faces carry corner normals that are not all identical, which is the "not
  smooth" reading. 3,320 faces are fully faceted and the 3,240 sit inside them;
  the counts are not complements, because 6,632 − 3,240 = 3,392. It also carries
  453 isolated spike vertices in the row pose (457 at rest).
- The `skeleton` mesh is opaque ivory, protruded up to 69.5 mm through the skin,
  and was **not hidden** in production renders when this audit was written. Ray
  casting makes it front-most on 340 sampled pixels of 22,564 in RDL and 111 of
  27,159 in the row. Adding it to the diagnostic creates 548 warm pixels in RDL
  and 4,754 in the row. Those are geometry measurements and are unaffected by
  WP1D.8. **WP1D.8 then hid it from the production render** (see "F1 implemented" below).
- The shadow pass alternates whole-frame brightness by 9.4 levels on every
  render call. Turning shadows off is the only tested switch that removes the
  step; it does not make the render byte-identical.
- The raytraced pass is non-deterministic: two renders of an unchanged scene
  differ by the counts in the matrix above.
- Ray tracing is **not** the cause of the grain in the reviewed stills: those
  were rendered with the tracer already off.
- The published WP1D.6 stills cannot be reproduced by re-running their own
  script. The surviving differences are consistent with the shadow-pass defect.

## Definitions behind the numbers

`measurements/face_definitions.json` records each definition used above, the
corner-normal dot tolerance, and the asset hash it was measured on. It is the
file to read before quoting any face or normal count. If a number in this README
and that file disagree, the file wins.

## Status

RDL: **PREVIEW / AWAITING HUMAN REVIEW**.
Barbell Row: **PREVIEW / AWAITING HUMAN REVIEW**.

No anatomy GLB, rig, pose, camera or production pipeline change was made by
WP1D.7 or WP1D.7.1.

## F1 implemented (WP1D.8)

`ThanhTamSW/fitness3D`, branch `wp1d6/visual-artifact-audit`.
Evidence: `review/wp1d8-skeleton-visibility/` in the code repository.

F1 — hide the skeleton mesh from production renders — is implemented.
**F2, F3 and F4 remain proposals; none is implemented.** Nothing here approves an
exercise.

What the audit established before the change: `skeleton` is a separate skinned
`MESH` (3,463 verts, 5,805 faces, 20 vertex groups, one armature modifier
pointing at `AnatomyRig`), parented to that armature. It is not the armature, so
hiding it cannot disturb animation. No exercise requires a visible skeleton; the
browser's skeleton mode is a viewer toggle, not a render output. The opt-in is
`show_skeleton` on a spec, a validated boolean, defaulting to `false`.

Measured on the production camera, 1920x1080, 32 samples, WP1D.7 reviewed
frames, two passes differing only in `hide_render`:

| Exercise | Frame | Skeleton-only coverage | Ivory px shown → hidden | Changed px > 8 | Noise floor |
|---|---:|---:|---|---:|---:|
| Romanian deadlift | 180 | 53,842 | 1,190 → 531 | 2,758 | 0 |
| Barbell row | 150 | 65,053 | 2,000 → 1,206 | 2,672 | 1 |

Hiding does not zero the ivory classifier: the remaining pixels are body
palette. 2,060 of the RDL's 2,758 changed pixels and 2,005 of the row's 2,672 lie
inside the skeleton's own silhouette, against a noise floor of 0 and 1. The rest
is the same object at the anti-aliased silhouette edge and in its cast shadow
(581 brightened / 43 darkened RDL, 597 / 37 row). The rig kept animating while
hidden: chest travel 0.203 m RDL, `upperarm.L` 0.183 m row.

The ray-cast 340/111 figures in this README are unchanged and remain correct:
`scene.ray_cast` ignores `hide_render` (it returns the mesh with the flag set,
and returns nothing only for `hide_viewport`/`hide_set`), so the count still
sees the mesh. It describes geometry; it does not describe what the render
draws. The proposed F1 test — "skeleton front-pixels = 0" — rested on that
mistake and was replaced by rendered-pixel checks.

The 69.5 mm protrusion, the muscle spikes, the shadow oscillation and the JPEG
ringing are all still present. F1 removes the pale patches the skeleton caused;
it does not fix the anatomy.

## Superseded figures — do not quote these

Kept so the earlier revision of this README stays auditable rather than being
silently rewritten. Every row below was replaced by a figure that has a
measurement file behind it.

| Where | Superseded value | Replaced by | Why |
|---|---|---|---|
| This README, B2 | tracer on differs by `14,215` px; tracer off by `1` px | 36,715 / 2 / 0 / 12,280 (RDL), 38,683 / 1 / 0 / 10,279 (row) | No measurement file contained the old figures; recomputing from the committed PNGs gives the new ones |
| This README, B2 | "B and C are deterministic" | counts reported as magnitude | Both cells differ by 1–2 px, so no cell has equal hashes |
| Report A1 | 7,159 unique / 34,840 duplicate vertices | 7,160 / 34,839 | The old values came from a grid approximation, not exact float32 |
| Report A2 | 457 spikes in the title, 453 in the measurement | 453 posed, 457 at rest | Title and field disagreed; both poses now stated |
| Report A3 | row views sampled 22,564 px | 27,159 px | The RDL count had been copied into the row column |
| Report A3 | row adds 4,761 warm pixels | 4,754 px | 4,761 appears in no measurement file |
| Report B4 | three close-ups reproduce bit-for-bit (`0 \| 0`) | rows withdrawn | The shots are in no measurement file; the two committed close-up runs differ |

Full text of each correction, with the file that now holds the source, is in §12
of `docs/production/WP1D7_ANATOMY_OVERLAY_RENDER_INVESTIGATION.md`.

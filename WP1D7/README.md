# WP1D.7 — Anatomy Overlay & Render Artifact Investigation

Status: **PREVIEW / AWAITING HUMAN REVIEW**

This folder holds the diagnostic evidence for WP1D.7. The findings, the numbers
and the proposed fixes are in the code repository:

`docs/production/WP1D7_ANATOMY_OVERLAY_RENDER_INVESTIGATION.md`

Nothing here approves an exercise. Both exercises remain
`PREVIEW / AWAITING HUMAN REVIEW`.

## Folder map

| Folder | What it isolates |
|---|---|
| `diagnostics/` | 7 renders per exercise, one variable each: body only, muscle only, body+muscle, +skeleton, neutral material, wireframe, normals as colour |
| `matrix/` | The required raytracing x denoise table, A/B/C/D, two renders per cell |
| `visibility/` | Ray-cast front-most surface maps: no shading, no materials, no denoiser |
| `skin_seams/` | Body shell only, shipping vs welded surface, each rendered twice |
| `shadow/` | Frames proving the shadow-pass brightness step, and one control per candidate switch |
| `measurements/` | Every JSON the report quotes, plus `anatomy_audit.json` and `cross_side.json` |
| `findings.json` | The same findings in machine-readable form, with evidence paths |

Each PNG has a `.jpg` beside it for inline viewing. The PNG is the authoritative
file; the JPEG is a preview encoded at quality 88 and is not used for any
measurement.

## How to read the evidence

Grain and seams were measured on the PNGs, never on the JPEGs. The reviewed
WP1D.6 JPEGs were encoded at quality 80, and that encode adds 8x8 block ringing
on its own (`measurements/published_grain.json`), so measuring a JPEG would mix
the renderer with the encoder.

## What the evidence shows

- The body shell ships as per-face split vertices: 41,999 vertices for 7,159
  unique positions. Welding it in memory changes 16.6% of the skin's pixels.
- `obliques` ships with 3,240 of 6,632 faces flat-shaded and 453 isolated spike
  vertices outside the skin.
- The `skeleton` mesh is opaque ivory, is never hidden in production renders,
  and protrudes up to 69.5 mm through the skin. Ray casting makes it front-most
  on 340 sampled pixels in RDL and 111 in the row.
- The shadow pass alternates whole-frame brightness by 9.4 levels on every
  render call. Turning shadows off is the only tested switch that removes it.
- The raytraced pass is non-deterministic: two renders of an unchanged scene
  differ by 14,215 pixels with the tracer on and 1 with it off.
- Ray tracing is **not** the cause of the grain in the reviewed stills: those
  were rendered with the tracer already off.

## Status

RDL: **PREVIEW / AWAITING HUMAN REVIEW**.
Barbell Row: **PREVIEW / AWAITING HUMAN REVIEW**.

No anatomy GLB, rig, pose, camera or production pipeline change was made.

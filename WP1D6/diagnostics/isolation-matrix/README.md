# Isolation matrix

Every image in this folder was rendered from the shipping renderer
(`render.configure_render`) with exactly one input group changed. They are the
evidence that each component was tested alone rather than inferred from the
final picture.

All of these are **after the fix**, so the absence of speckle is expected. The
value of the set is the geometry comparison, not the artifact count.

| Test | Body | Muscle meshes | Equipment | File |
|---|---|---|---|---|
| M0 | on | off | off | `rdl_m0_body_only.png` |
| M1 | on | on | off | `rdl_m1_body_plus_muscle.png` |
| M2 | off | on | off | `rdl_m2_muscle_only.png` |
| M3 | on | off | all | `rdl_m3_shell_and_equipment.png` |
| E0 | on | on | all | `rdl_e0_equipment_full.png` |
| E1 | on | on | all but plates | `rdl_e1_no_plates.png` |
| E2 | on | on | all but collars | `rdl_e2_no_collars.png` |
| E3 | on | on | shaft only | `rdl_e3_shaft_only.png` |
| E4 | off | off | plates only | `rdl_e4_plates_only.png` |
| D1 | on | on | all | `rdl_d1_no_shadow.png` |
| D2 | on | on | all | `rdl_d2_shadow_off.png` |
| D3 | on | on | all | `rdl_d3_samples_64.png` |

### Correction: the D1 image is not a no-shadow control

`12_matrix.py` rendered `d1_no_shadow` **before** setting
`scene.eevee.use_shadows = False`, so D1 is another shadowed baseline, not a
control. It is byte-identical to E0, which is how this was caught: both JPEGs
have SHA-256 `ff6efa58…` (row: `0b38d8e2…`) and the source PNGs differ only at
92.20 dB / 111.88 dB PSNR, i.e. visually the same picture.

`d2_shadow_off` **is** the real no-shadow render. The script and the audit
report are corrected; the published D1 image is left in place unaltered rather
than silently replaced. Do not read D1 as evidence about shadows.

`p` is `rdl` (frame 180) or `row` (frame 150).

## Controls that were run before the fix

These are documented in the audit report rather than shipped as images, because
they mattered only as counter-evidence:

- Repeating one unchanged static render in a single process: 389, 1277 and 1161
  saturated pixels. The scene did not change between renders.
- Raytracing off, same scene, three repeats: 2, 0 and 0 saturated pixels.
- Flat diffuse material on every surface, raytracing on: 0 saturated and 0
  out-of-palette pixels. The artifacts need specular reflection to exist.
- Workbench flat shading, raytracing irrelevant: 0 saturated pixels.
- Shadow off / on, 16 vs 64 samples, screen-trace quality 0.25 vs 1.0, and the
  three lights individually hidden: none reproduced the artifacts reliably;
  only the tracer switch did.

## Hash verification

See `publish_manifest.json` (`diagnostics/isolation-matrix` rows) for PNG and JPEG
hashes. Every chunk set was reassembled and hash-checked with the same procedure
as the final images.

## Status

**PREVIEW / AWAITING HUMAN REVIEW.**

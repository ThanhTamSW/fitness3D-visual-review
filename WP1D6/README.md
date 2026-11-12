# WP1D.6 - Visual Artifact Audit and Render Integrity

**Status: PREVIEW / AWAITING HUMAN REVIEW**

This folder is the visual evidence for WP1D.6. It does not approve the RDL or the
Barbell Row. Both remain `PREVIEW / AWAITING HUMAN REVIEW`.

Code branch: `wp1d6/visual-artifact-audit`
Code commit: `3049549e15d6e3130948e6b106ffb95fd7e533ca` on
`wp1d6/visual-artifact-audit` (docs sync; the fixes and tests are in its
ancestors `4206ca8` and `39943cc`)
Report: `docs/production/WP1D6_VISUAL_ARTIFACT_AUDIT.md`

## What was wrong

Two findings were reported after looking at the WP1D.5 stills.

**F1 - plate face artifacts.** White, magenta and blue speckle on the plate
faces, plus a hard-edged pure-white block on bare skin. Root cause:
`render.configure_render` enabled EEVEE screen-space raytracing, and that pass
with its temporal denoiser is not deterministic on this scene. Three renders of
the *same unchanged static frame* in one process produced 389, 1277 and 1161
saturated pixels. With the tracer disabled, every repeat produced zero.

**F2 - muscle overlay artifacts.** The coloured speckle is the same raytracing
defect; it appears on skin and on every muscle mesh, and it disappears when the
tracer is off. The remaining muscle geometry outside the skin is real
(measured: up to 9.5 mm on `back`, 6.6 mm on `chest`) but it never changes a
pixel's muscle role: 0 of 760,077 classified pixels changed role with the muscle
meshes removed. It is left untouched, because the anatomical content is correct
and only the renderer was at fault.

**F3 - duplicated plate cap.** `equipment_lib.disc_with_bore` emitted both
annular cap faces twice. `mesh.validate()` silently discarded the copies, so this
never reached a pixel, but every plate generated 32 redundant faces. Fixed at
the source.

## Folder map

| Folder | What it isolates |
|---|---|
| `diagnostics/before-fix-wp1d5/` | the WP1D.5 stills that show the artifacts |
| `diagnostics/rdl-body-only/` | RDL body shell, no muscle meshes, no equipment |
| `diagnostics/rdl-body-muscles/` | RDL shell plus the separate muscle meshes |
| `diagnostics/rdl-muscle-only/` | RDL muscle meshes alone |
| `diagnostics/rdl-plate-only/` | RDL equipment with no body |
| `diagnostics/rdl-equipment-full/` | RDL full scene |
| `diagnostics/row-*` | the same five tests for the Barbell Row |
| `diagnostics/isolation-matrix/` | M0-M3, E0-E4 and the shadow/sample controls |

> **Correction: the D1 image is not a no-shadow control.** `12_matrix.py`
> rendered `d1_no_shadow` before setting `use_shadows = False`, so it is a second
> shadowed baseline. It is byte-identical to E0 (same SHA-256 `ff6efa58…`, row
> `0b38d8e2…`; source PNGs differ only at 92.20 dB / 111.88 dB). `d2_shadow_off`
> is the real control. Detail in `diagnostics/isolation-matrix/README.md`.


| `diagnostics/plate-face-closeups/` | plate faces at 32 and 64 samples |
| `diagnostics/overlay-closeups/` | the torso, back and shoulder overlays |
| `final/rdl-side/`, `final/rdl-bottom/`, `final/rdl-front45/` | RDL final stills |
| `final/row-side/`, `final/row-front45/`, `final/row-top/` | Row final stills |

Every folder holds the lossless PNG, a JPEG that opens directly on GitHub, and
`part-NNN.txt` base64 chunks of that JPEG.

## Verification

Each chunk set was reassembled in this order after encoding, then checked:

1. base64-decoded to bytes;
2. first three bytes are `FF D8 FF`;
3. SHA-256 of the decoded bytes equals the SHA-256 of the JPEG before chunking;
4. byte length equals the JPEG's length;
5. the decoded image opens and passes `Image.verify()`.

All **49** chunk sets passed: 3 before-fix stills, 24 isolation-matrix renders,
10 named diagnostics, 6 close-ups and 6 final stills. No image needed more than
3 chunks (limit 18) or more than 24,000 characters per chunk.

### File count is not view count

This folder holds **98 image files** (49 PNG + 49 JPEG) and **96 unique hashes**.
Each render ships as a lossless PNG, a JPEG for direct viewing, and one chunk set
derived from that JPEG, so 49 distinct renders produce 98 files. That is not 98
independent views. The two duplicate pairs come from the D1 mislabel described
above, so 47 of the 49 renders are visually distinct.

## Images and hashes

Full PNG hashes, JPEG hashes and per-image metadata are in
`publish_manifest.json` and `isolation_matrix_manifest.json`.

| Image | Folder | JPEG q | Chunks | JPEG SHA-256 (first 16) |
|---|---|---|---|---|
| `rdl_body_only` | `diagnostics/rdl-body-only` | 78 | 2 | `dc0f18c7d8ebade7...` |
| `rdl_body_plus_muscle` | `diagnostics/rdl-body-muscles` | 78 | 2 | `4318322e724906ff...` |
| `rdl_muscle_only` | `diagnostics/rdl-muscle-only` | 78 | 2 | `d0c2644ed5bb1510...` |
| `rdl_plate_only` | `diagnostics/rdl-plate-only` | 78 | 2 | `83240170abc99656...` |
| `rdl_equipment_full` | `diagnostics/rdl-equipment-full` | 78 | 2 | `76c68b53aed8ce5d...` |
| `rdl_closeup_plate_face` | `diagnostics/plate-face-closeups` | 82 | 2 | `b07cb8953bed12de...` |
| `rdl_closeup_overlay` | `diagnostics/overlay-closeups` | 82 | 3 | `9da0d6dac4a50d9b...` |
| `rdl_closeup_plate_64spp` | `diagnostics/plate-face-closeups` | 82 | 2 | `88f4dfc23af41217...` |
| `rdl_side_final` | `final/rdl-side` | 80 | 2 | `6385603c74a2b5dc...` |
| `rdl_bottom_final` | `final/rdl-bottom` | 80 | 2 | `2da7cd010b308a6e...` |
| `rdl_front45_final` | `final/rdl-front45` | 80 | 2 | `6c98b6ab18b62375...` |
| `row_body_only` | `diagnostics/row-body-only` | 78 | 2 | `8cd217d327c89da9...` |
| `row_body_plus_muscle` | `diagnostics/row-body-muscles` | 78 | 2 | `be076bb654c15ae9...` |
| `row_muscle_only` | `diagnostics/row-muscle-only` | 78 | 2 | `be945ba11269771c...` |
| `row_plate_only` | `diagnostics/row-plate-only` | 78 | 2 | `f29746dc0db260a0...` |
| `row_equipment_full` | `diagnostics/row-equipment-full` | 78 | 2 | `b88927b2d490f905...` |
| `row_closeup_plate_face` | `diagnostics/plate-face-closeups` | 82 | 2 | `53e4c3b08a1234a7...` |
| `row_closeup_overlay` | `diagnostics/overlay-closeups` | 82 | 3 | `034baa7fdf022221...` |
| `row_closeup_plate_64spp` | `diagnostics/plate-face-closeups` | 82 | 2 | `fb83f18c0030ac74...` |
| `row_side_final` | `final/row-side` | 80 | 2 | `055303e16f28fb95...` |
| `row_front45_final` | `final/row-front45` | 80 | 2 | `7ff9b45f5e7106ed...` |
| `row_top_final` | `final/row-top` | 80 | 2 | `28d82e283cb5c5e8...` |

## Render configuration

- Engine: `BLENDER_EEVEE_NEXT`, EEVEE Next.
- Raytracing: **off**. This is the fix.
- View transform: Standard, look None (unchanged from WP1D.5).
- Side camera: orthographic, azimuth 0.0 (sagittal, unchanged from WP1D.5).
- Front-45 camera: azimuth 45.0.
- Resolution: 900 x 1200 for finals and diagnostics.
- Samples: 16 for finals, 32 for close-ups, 64 for the aliasing control.
- Blender: 4.2.23 LTS.

## Caveats

- **The before/after pair is not resolution-matched.** The WP1D.5 stills are
  760x1040; the WP1D.6 finals are 900x1200, so the artefact counts in that pair
  differ by more than the tracer switch alone. The controlled comparison is
  `diagnostics/isolation-matrix/` at a constant 760x1040: rdl body+muscle with
  the tracer on carries 3,393 saturated pixels, and with it off, 0. Same frame,
  same camera, same resolution, one variable.
- The muscle meshes at partial role boundaries still show a thin shading step
  where muscle geometry sits just outside the skin. It is visible as a subtle
  edge, changes no muscle role, and is not fixed here because the task forbids
  changing the shared anatomy GLB without a proven requirement.
- The RDL plate stack is partly out of frame at the bottom still, exactly as in
  WP1D.5. That is framing, not a regression. Fixing it would mean changing the
  camera, which this milestone must not do, so it is left for a human decision.
- `diagnostics/isolation-matrix/` exists because the task requires proof that
  each input group was tested alone. It is extra evidence, not a replacement for
  the named folders above.

## Status

**PREVIEW / AWAITING HUMAN REVIEW.** No exercise is approved here, and nothing in
this folder should be read as an approval.

Four images need a person to look at them:

| Image | Folder |
|---|---|
| RDL side | `final/rdl-side/` |
| RDL bottom | `final/rdl-bottom/` |
| Row side | `final/row-side/` |
| Row front-45 | `final/row-front45/` |

Two open questions belong with that review: whether the cosmetic muscle/skin
shading seam is acceptable, and whether the plate crop on the RDL bottom still is
acceptable. Neither is settled by the numbers above.

Tracking issue: [#1](https://github.com/ThanhTamSW/fitness3D/issues/1) — open.

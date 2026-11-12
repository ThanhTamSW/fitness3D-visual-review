# fitness3D visual review

Rendered stills for human review of the Fitness3D exercise previews.

This repository holds images only. The exercise code, specs, poses and QC live in
the code repository. Nothing here approves an exercise: every exercise stays
`PREVIEW / AWAITING HUMAN REVIEW` until a person signs it off.

## Milestones

| Milestone | Folder | State |
|---|---|---|
| WP1D.4 | `WP1D4/` | superseded camera; two folders marked SUPERSEDED |
| WP1D.6 | `WP1D6/` | current: visual artifact audit and render integrity |

### Current: WP1D.6

`WP1D6/README.md` has the findings, the folder map, the hash verification and the
render configuration.

Two pre-fix folders remain deliberately in place and must not be reused:

- `WP1D4/preview/rdl-side-parts/` - **SUPERSEDED / NOT FOR REVIEW**
- `WP1D4/preview/rdl-side-small-parts/` - **SUPERSEDED / NOT FOR REVIEW**

Both were rendered with the side camera at azimuth 90, which looks down the
anterior axis. They are posterior views whose anterior/posterior labels are
meaningless. `WP1D6/diagnostics/before-fix-wp1d5/` is a different thing: it is
the WP1D.5 sagittal render, kept as the artifact reference.

## How to read an image

Each image folder contains:

- `.png` - the lossless original, the authoritative file;
- `.jpg` - a preview that opens directly on GitHub;
- `part-NNN.txt` - base64 chunks of the JPEG, at most 24,000 characters each;
- `README.md` - what the image isolates and its hashes.

Reassemble the chunks in filename order, base64-decode, and the result must match
the JPEG's SHA-256. Every set was verified that way before publishing.

## Status

RDL: **PREVIEW / AWAITING HUMAN REVIEW**.
Barbell Row: **PREVIEW / AWAITING HUMAN REVIEW**.

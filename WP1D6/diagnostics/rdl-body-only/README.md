# RDL body shell only

The body shell alone, at frame 180 (bottom position). Muscle meshes and all equipment are hidden from the render. This is the reference for what the baked muscle-role vertex colour looks like without any separate muscle geometry.

- Exercise: `romanian_deadlift`
- Frame: 180
- Camera: side
- Resolution: 900 x 1200
- Samples: 16
- Raytracing: off (the WP1D.6 fix)
- Material mode: production
- Milestone: WP1D.6, after the fix

## Files

| File | Purpose | SHA-256 |
|---|---|---|
| `rdl_body_only.png` | lossless original | `b9a4e664b05f748a1024c6e2942d08e3a4f2f6f96084674ee7f3e49e51c38f44` |
| `rdl_body_only.jpg` | preview, quality 78 | `dc0f18c7d8ebade7bb1b79e3f169c0e402e7c718901411345793a9deeba5a1dd` |
| `rdl_body_only-b64/part-*.txt` | 2 chunk(s), max 24,000 chars each | reassembles to the JPEG hash |

Chunk verification: reassembled, decoded, magic bytes `FF D8 FF` present,
SHA-256 matches the JPEG, image opens and verifies.

## Status

**PREVIEW / AWAITING HUMAN REVIEW.** This image does not approve the exercise.

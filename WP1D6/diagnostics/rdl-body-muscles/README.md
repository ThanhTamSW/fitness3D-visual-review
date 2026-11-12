# RDL body shell plus muscle meshes

The shell and the eleven separate muscle meshes, no equipment. Compare against `rdl-body-only`: the difference is the contribution of the outer muscle meshes.

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
| `rdl_body_plus_muscle.png` | lossless original | `1e3adafd1abd459be386ea1309b61c65aa22b83fce23d1c54b19aa5f0a1fe16d` |
| `rdl_body_plus_muscle.jpg` | preview, quality 78 | `4318322e724906fff67df7eed91d5ff203780e2439a31d50fa68f8976ebf18bc` |
| `rdl_body_plus_muscle-b64/part-*.txt` | 2 chunk(s), max 24,000 chars each | reassembles to the JPEG hash |

Chunk verification: reassembled, decoded, magic bytes `FF D8 FF` present,
SHA-256 matches the JPEG, image opens and verifies.

## Status

**PREVIEW / AWAITING HUMAN REVIEW.** This image does not approve the exercise.

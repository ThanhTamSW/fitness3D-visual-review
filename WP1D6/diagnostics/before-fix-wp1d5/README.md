# Before-fix evidence (WP1D.5 stills)

These are the WP1D.5 images that showed the artifacts. They are included so the
defect can be inspected directly instead of taken on trust.

Do not review these for pose or camera quality. They are here only as the
before half of the before/after pair. The WP1D.5 files themselves are unchanged
in `review/wp1d4-forward-hinge/` in the code repository.

| File | White px | Magenta px | Blue px | Chunks | JPEG SHA-256 |
|---|---|---|---|---|---|
| `rdl_side_f180_before` | 5088 | 4904 | 5247 | 4 | `db31538814076705...` |
| `row_side_f150_before` | 2344 | 4698 | 5656 | 5 | `c476f69fba02200f...` |
| `row_front45_f150_before` | 2976 | 0 | 0 | 4 | `c8eebc85ab08225f...` |

White counts use the threshold min(R,G,B) > 235; magenta and blue use a 40-level
channel separation. `row_front45_f150_before` has no magenta, which is why the
front-45 still looked clean: it is rendered after the temporal filter has
settled, not because its geometry differs.

## Status

**SUPERSEDED / NOT FOR REVIEW** as images. Kept as the artifact reference.

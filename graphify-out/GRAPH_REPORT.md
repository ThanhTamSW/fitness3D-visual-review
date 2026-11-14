# Graph Report - fitness3D-visual-review  (2026-11-14)

## Corpus Check
- 81 files · ~67,309 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 132 nodes · 207 edges · 7 communities
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- WP1D.7 measurement corpus
- WP1D.6 diagnostic evidence
- WP1D.9 shadow stability findings
- WP1D.7 anatomy and render findings
- Milestones, previews and superseded evidence
- WP1D.9.1 shadow scale validation
- WP1D.6 artifacts and fixes

## God Nodes (most connected - your core abstractions)
1. `WP1D7 README` - 44 edges
2. `WP1D.6 Visual Artifact Audit` - 25 edges
3. `Isolation matrix M0-M3 E0-E4 D1-D3` - 14 edges
4. `WP1D9 findings.json` - 14 edges
5. `WP1D.7 Anatomy Overlay Investigation` - 13 edges
6. `WP1D.9.1 Shadow Scale Validation` - 12 edges
7. `WP1D.9 Shadow Temporal Stability` - 11 edges
8. `WP1D9.1 README` - 11 edges
9. `WP1D7 findings.json` - 10 edges
10. `WP1D.4 Visual Preview` - 9 edges

## Surprising Connections (you probably didn't know these)
- `B1 shadow pass alternates brightness by ~9.4 levels` --conceptually_related_to--> `F1 plate face artifacts from EEVEE screen-space raytracing`  [INFERRED]
  WP1D7/findings.json → WP1D6/README.md
- `R1 partially validated: clears row, not RDL` --conceptually_related_to--> `C1 9.4-level step is a diluted body-level shadow flip`  [EXTRACTED]
  WP1D9.1/README.md → WP1D9/findings.json
- `R1 partially validated: clears row, not RDL` --conceptually_related_to--> `C6 reducing shadow resolution scale removes the defect`  [EXTRACTED]
  WP1D9.1/README.md → WP1D9/findings.json
- `R1 partially validated: clears row, not RDL` --conceptually_related_to--> `R1 reduce shadow resolution scale to 0.5`  [EXTRACTED]
  WP1D9.1/README.md → WP1D9/findings.json
- `fitness3D visual review README` --references--> `WP1D.4 Visual Preview`  [EXTRACTED]
  README.md → WP1D4/preview/manifest-v2.json

## Hyperedges (group relationships)
- **All WP1D milestones remain PREVIEW / AWAITING HUMAN REVIEW** — wp1d4_preview_manifest_v2_wp1d4, wp1d6_readme_wp1d6, wp1d7_readme_wp1d7, wp1d7_readme_wp1d8, wp1d9_readme_wp1d9, readme_preview_awaiting_human_review [EXTRACTED 1.00]

## Communities (7 total, 0 thin omitted)

### Community 0 - "WP1D.7 measurement corpus"
Cohesion: 0.06
Nodes (14): WP1D7 measurements chunk_manifest.json, WP1D7 measurements cross_side.json, WP1D7 measurements frame_parity.json, WP1D7 measurements grain.json, WP1D7 measurements matrix_rdl.json, WP1D7 measurements matrix_row.json, WP1D7 measurements matrix.json, WP1D7 measurements pixel_analysis.json (+6 more)

### Community 1 - "WP1D.6 diagnostic evidence"
Cohesion: 0.14
Nodes (22): WP1D6 diagnostics before-fix-wp1d5, Isolation matrix M0-M3 E0-E4 D1-D3, Isolation matrix README, WP1D6 diagnostics overlay-closeups, WP1D6 diagnostics plate-face-closeups, WP1D6 diagnostics rdl-body-muscles, WP1D6 diagnostics rdl-body-only, WP1D6 diagnostics rdl-equipment-full (+14 more)

### Community 2 - "WP1D.9 shadow stability findings"
Cohesion: 0.16
Nodes (22): B1 shadow pass alternates brightness by ~9.4 levels, WP1D7 measurements shadow_state.json, C1 9.4-level step is a diluted body-level shadow flip, C2 defect is nondeterministic render-call state, C3 shadow pass owns the defect, C4 large cast shadow on the torso from equipment, C5 defect is not universal: barbell row stable, C6 reducing shadow resolution scale removes the defect (+14 more)

### Community 3 - "WP1D.7 anatomy and render findings"
Cohesion: 0.18
Nodes (17): A1 body shell split into per-face vertices, A2 obliques mesh arrives shattered, A3 muscle meshes and skeleton sit outside the skin, A4 skin weights are not the root cause, B2 raytraced pass is non-deterministic, B3 raytracing is not the cause of grain in reviewed stills, B4 published WP1D.6 stills cannot be reproduced, B5 reviewer saw geometry and shadow state plus JPEG ringing (+9 more)

### Community 4 - "Milestones, previews and superseded evidence"
Cohesion: 0.18
Nodes (15): /AGENTS.md, PREVIEW / AWAITING HUMAN REVIEW, fitness3D visual review README, WP1D.4 Visual Preview, WP1D4 preview manifest v2, WP1D4 preview rdl-bottom-v2-small-parts, Superseded azimuth-90 posterior side camera, WP1D4 preview rdl-side-parts (+7 more)

### Community 5 - "WP1D.9.1 shadow scale validation"
Cohesion: 0.30
Nodes (12): WP1D9.1 evidence manifest, First pass invalid: GPU contention darkened frames, R1 not implemented in production, R1 partially validated: clears row, not RDL, RDL max step 32.94 to 21.83 under R1, Row max step 23.79 to 0.06 under R1, Shadow darkness unchanged; coverage falls ~4%, WP1D.9.1 Shadow Scale Validation (+4 more)

### Community 6 - "WP1D.6 artifacts and fixes"
Cohesion: 0.25
Nodes (8): Correction: D1 image is not a no-shadow control, WP1D6 isolation matrix manifest, WP1D6 publish manifest, F1 plate face artifacts from EEVEE screen-space raytracing, F2 muscle overlay artifacts share the raytracing cause, F3 duplicated plate cap faces in disc_with_bore, Raytracing disabled in render.configure_render, WP1D6 README

## Knowledge Gaps
- **31 isolated node(s):** `WP1D4 preview manifest v2`, `WP1D4 preview rdl-bottom-v2-small-parts`, `WP1D4 preview row-front45-v2-small-parts`, `WP1D4 preview row-side-v2-small-parts`, `WP1D6 publish manifest` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 54 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WP1D7 README` connect `WP1D.7 measurement corpus` to `WP1D.9 shadow stability findings`, `WP1D.7 anatomy and render findings`, `Milestones, previews and superseded evidence`, `WP1D.6 artifacts and fixes`?**
  _High betweenness centrality (0.508) - this node is a cross-community bridge._
- **Why does `WP1D.6 Visual Artifact Audit` connect `WP1D.6 diagnostic evidence` to `Milestones, previews and superseded evidence`, `WP1D.6 artifacts and fixes`?**
  _High betweenness centrality (0.332) - this node is a cross-community bridge._
- **Why does `fitness3D visual review README` connect `Milestones, previews and superseded evidence` to `WP1D.6 diagnostic evidence`, `WP1D.9 shadow stability findings`, `WP1D.7 anatomy and render findings`, `WP1D.9.1 shadow scale validation`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `Isolation matrix M0-M3 E0-E4 D1-D3` (e.g. with `WP1D6 diagnostics before-fix-wp1d5` and `WP1D6 diagnostics overlay-closeups`) actually correct?**
  _`Isolation matrix M0-M3 E0-E4 D1-D3` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `WP1D4 preview manifest v2`, `WP1D4 preview rdl-bottom-v2-small-parts`, `WP1D4 preview row-front45-v2-small-parts` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WP1D.7 measurement corpus` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `WP1D.6 diagnostic evidence` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
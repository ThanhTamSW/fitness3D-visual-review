# Evidence graph maintenance

WP-GRAPHIFY-02. This document covers only the knowledge graph in
`graphify-out/` of this repository. It does not change any finding, measurement,
render or approval state.

Companion documents in the main code repository:

- `docs/production/GRAPHIFY.md` — operation, limits, Windows behaviour.
- `docs/GRAPHIFY_COMMUNITIES.md` — measured community-label accuracy method.

## What this graph is

132 nodes, 207 links, 7 communities: 83 document, 38 concept, 11 rationale.
**No code nodes.**

It exists because a semantic extraction pass ran over the markdown reports,
`findings.json` files and measurement JSON. Graphify's AST pass cannot produce
it: there is no code in this repository to index.

## Why an AST-only refresh is destructive here

`graphify extract --code-only` on this tree finds no code and produces a graph
with no provenance. Replacing `graph.json` with that result would erase the
record of which report cites which finding — the main value of the graph.

Protection is layered:

1. `tools/graphify/refresh-graph.js` refuses any evidence-repository refresh
   without `semantic: true`.
2. The CLI refuses `refresh` on this checkout without `--semantic`.
3. Even with the flag, validation rejects the candidate if it loses document
   or concept nodes, or if any required provenance node disappears:
   - `wp1d7_findings_b1`
   - `wp1d9_findings_c1`
   - `wp1d6_readme_f1`
   - `wp1d7_measurements_chunk_manifest_wp1d7_meas_chunk_manifest`
   - `readme_preview_awaiting_human_review`

If the semantic pass cannot run, the refresh stops and the existing graph
stays. There is no degraded fallback.

## Refreshing

```powershell
$env:PYTHONHASHSEED = "0"                     # graphify 0.9.66 re-exec workaround
$env:GRAPHIFY_REVIEW_ROOT = (Get-Location).Path
node tools/graphify/graphify.js refresh --semantic

node tools/graphify/graphify.js audit
graphify export html --graph graphify-out/graph.json
```

`refresh` copies the current graph to `graphify-out/backups/` (with a sibling
`.sha256`) before extraction, extracts into a temp directory, validates, and only
then swaps. On failure the installed graph is byte-identical.

After a successful refresh, re-measure the communities, because Louvain
membership moves:

```powershell
node tools/graphify/graphify.js community --out ../fitness3D/docs/GRAPHIFY_COMMUNITIES_review.md
```

That output path assumes a sibling checkout; any path is fine as long as the
report lands somewhere tracked.

## Restoring

```powershell
node tools/graphify/graphify.js backups
node tools/graphify/graphify.js restore --backup graphify-out/backups/<file>.json
```

`restore` refuses a backup whose recorded hash does not match.

## Measurements recorded by WP-GRAPHIFY-02

| Check | Result |
|---|---|
| Graph SHA-256 at start | `45ba54528ec40ba8fca95fa82fdf271fc43a60d222168379704bac9739720a1c` |
| Nodes / links / communities | 132 / 207 / 7 |
| EXTRACTED / INFERRED | 192 / 15 |
| Distinct `source_file` | 81 |
| Dangling endpoints | 0 |
| Self-loops | 0 |
| Absolute `source_file` / node ids | 0 / 0 |
| Media, base64 or secret content | none |
| Community labels covering ≤ half their members | 0 of 7 |
| AST-only candidate accepted | no — rejected, graph unchanged |
| Refresh without `--semantic` | refused before any work |

The graph file was not modified by this work package. It is byte-identical to
the WP-GRAPHIFY-01 baseline; its HTML was not regenerated either.

## Graph HTML

`graph.html` loads vis-network from `https://unpkg.com`, so it needs Internet.
There is no supported offline export. Browser inspection of the main graph's
HTML (same exporter, same CDN) confirmed the canvas renders with network access
and renders nothing when the CDN is blocked.

## What not to do

- Do not run `graphify extract --code-only` here.
- Do not hand-edit `graph.json`; the next extraction discards it.
- Do not regenerate the graph just to tidy it. Findings and their
  classifications are the record; the graph is an index of that record.
- Do not merge this graph into the main repository's graph.
- Do not install Graphify Git hooks or watchers.

## Staleness after WP1D.9.1 republish (2026-11-14)

The graph is **stale** and deliberately not refreshed.

WP1D.9.1 was re-run over 20 serial full-length renders and its result changed
from "partially validated" to "R1 rejected". That rewrote
`WP1D9.1/README.md`, `WP1D9.1/WP1D9_1_SHADOW_SCALE_VALIDATION.md` and
`WP1D9.1/manifest.json`, and added 20 evidence images. 110 files have changed
since this graph was built at `95d876c`.

The graph still describes the four-run version. Concretely, it does not know
that:

- `barbell_squat`, `bicep_curl`, `hip_thrust` and `pallof_press` are part of the
  validation at all; it indexes only RDL and row evidence.
- The decision is `R1 REJECTED`, not `PARTIALLY VALIDATED`.
- The dark-frame confound has a corrected conclusion: serial runs drop lighting
  passes too, so the earlier "serial is clean" claim is superseded.

**Why it was not refreshed:** the review graph is 100% semantic content (83
document, 38 concept, 11 rationale nodes, zero code). A refresh needs a semantic
pass and no LLM backend is configured. Running `graphify update` here would
re-extract code — of which there is none — and cannot add the new documents.

**What a reader should do:** treat `WP1D9.1/README.md` and the report as the
record, and this graph as an index of the pre-2026-11-14 state. Do not cite the
graph for the current WP1D.9.1 decision.

**To clear it:** run a semantic re-extraction with a configured backend, then
validate with `tools/graphify/refresh-graph.js --semantic` before replacing the
graph. The refresh tool refuses an evidence-repository refresh without the
semantic flag precisely so this cannot be done by accident.
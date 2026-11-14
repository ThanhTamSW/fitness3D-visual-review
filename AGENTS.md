# Project instructions

## Knowledge graph (Graphify)

This repository is the visual-review evidence store for fitness3D. It has its own
prebuilt knowledge graph in `graphify-out/`, separate from the main code
repository's graph. **Query it before scanning the evidence tree.**

The graph is a map of the evidence, not the evidence. Read the file a node names.

### Order of operations

1. Check that `graphify-out/graph.json` exists.
2. Ask the graph first:
   - `graphify query "<question>" --graph graphify-out/graph.json --budget 800`
   - `graphify explain "<FindingId or Report>" --graph graphify-out/graph.json`
   - `graphify path "<A>" "<B>" --undirected --graph graphify-out/graph.json`
     (this graph is undirected, so add `--undirected` for path queries)
3. Open the file the node names. Findings, measurements and their provenance are
   the point of this repository: read the source JSON, do not paraphrase the
   graph.
4. Only if the graph has no answer, search the tree directly.

### Before changing evidence or reports

1. Query the review graph for the affected finding or measurement.
2. `graphify explain` on the finding node to see what cites it.
3. `graphify path` to the report and manifest that depend on it.
4. Read the source JSON and the report text.
5. Preserve the classification the finding already carries.

Preserve the distinction between confirmed measurements, inferred relationships,
corrected historical findings, unresolved hypotheses, implemented changes,
proposed fixes and human-review requirements. A node in this graph proves that a
document exists and is linked; it proves nothing about whether the finding is
correct.

Never infer `APPROVED` from a graph node or a report summary.

### Evidence rules

- Never treat `PREVIEW` as `APPROVED`. Every milestone in this repository is
  preview evidence awaiting human review.
- Findings carry their own classification in `WP1D*/findings.json`
  (`CONFIRMED`, `LIKELY`, `NOT ROOT CAUSE`, `UNCONFIRMED`). Preserve that word
  when you cite a finding; do not upgrade it.
- Superseded evidence is kept deliberately (for example the WP1D.4
  `rdl-side-parts` folders superseded by `rdl-side-v2-small-parts`). Do not
  delete it, and do not present a superseded figure as current.
- A measurement JSON is evidence of what was measured, not proof of what caused
  it. `INFERRED` edges in the graph are hypotheses.

### Trust levels

- This graph has **no code nodes**. It contains 83 document, 38 concept and 11
  rationale nodes, all produced by semantic extraction.
- `EXTRACTED` edges mean a literal reference in the source document.
  `INFERRED` edges are the extractor's interpretation.
- Community names are heuristic: Graphify names a community after one
  high-degree node, so a name is not a statement about what a milestone means or
  who owns it. See `docs/GRAPHIFY_COMMUNITIES.md` in the main repository for the
  measured label accuracy method, and re-measure with
  `node tools/graphify/graphify.js community --repo review --out docs/GRAPHIFY_COMMUNITIES.md`.

### Scope

Indexed: markdown reports and READMEs, findings JSON, measurement JSON, evidence
manifests, diagnostic scripts.

Not indexed: images, video, playback recordings, base64 image chunk dumps. The
manifests and measurements that cite them are indexed, so a graph node tells you
which image to open.

### Rebuilding

This repository is almost entirely documentation and data JSON, which Graphify's
AST pass does not index. **Rebuilding requires a semantic pass.** An AST-only
`graphify extract --code-only` produces a near-empty graph — it would delete the
provenance nodes listed below.

The only supported update path validates a candidate before it touches the
committed graph:

```powershell
$env:PYTHONHASHSEED = "0"      # graphify's Windows re-exec is broken without it
$env:GRAPHIFY_REVIEW_ROOT = (Get-Location).Path
node tools/graphify/graphify.js refresh --repo review --semantic
```

`--semantic` is mandatory: the tool refuses to run without it. The semantic
pass itself is the host agent's job (see `docs/production/GRAPHIFY.md` in the
main repository); this command runs the extraction and then validates it.

The refresh rejects the candidate, leaving the existing graph untouched, when:

- it drops below the node/link floors in `tools/graphify/policy.json`;
- it loses document or concept nodes;
- any of the required provenance nodes disappear
  (`wp1d7_findings_b1`, `wp1d9_findings_c1`, `wp1d6_readme_f1`,
  `wp1d7_measurements_chunk_manifest_…`,
  `readme_preview_awaiting_human_review`);
- any edge endpoint or `source_file` does not resolve;
- any node id encodes an absolute path.

A backup of the previous graph is written to `graphify-out/backups/` first.

```powershell
node tools/graphify/graphify.js audit --repo review
node tools/graphify/graphify.js restore --repo review --backup graphify-out/backups/<file>.json
```

If the semantic pass cannot run, **stop**. Keep the existing graph and say what
is missing. Never replace it with an AST-only result.

Then regenerate the HTML (it needs Internet; vis-network comes from unpkg):

```powershell
graphify export html --graph graphify-out/graph.json
```

### Do not

- Do not modify findings, classifications, or historical evidence to make the
  graph tidier.
- Do not commit images or raw payloads into the graph output.
- Do not merge this graph into the main code repository's graph.
- Do not run `graphify extract --code-only` here.
- Do not hand-edit `graph.json`; the next extraction will discard it.
- Do not install Graphify Git hooks or background watchers for this project.

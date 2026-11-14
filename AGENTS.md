# Project instructions

## Knowledge graph (Graphify)

This repository is the visual-review evidence store for fitness3D. It has its own
prebuilt knowledge graph in `graphify-out/`, separate from the main code
repository's graph. **Query it before scanning the evidence tree.**

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

### Scope

Indexed: markdown reports and READMEs, findings JSON, measurement JSON, evidence
manifests, diagnostic scripts.

Not indexed: images, video, playback recordings, base64 image chunk dumps. The
manifests and measurements that cite them are indexed, so a graph node tells you
which image to open.

### Rebuilding

This repository is almost entirely documentation and data JSON, which Graphify's
AST pass does not index. Rebuilding therefore needs a semantic pass. With no
semantic backend configured, the host agent performs that pass and writes the
extraction JSON itself; see the `.graphifyignore` comments for the scope.

```powershell
$env:PYTHONHASHSEED = "0"
graphify export html --graph graphify-out/graph.json
```

### Do not

- Do not modify findings, classifications, or historical evidence to make the
  graph tidier.
- Do not commit images or raw payloads into the graph output.
- Do not merge this graph into the main code repository's graph.

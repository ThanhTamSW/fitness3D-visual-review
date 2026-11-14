'use strict';

/**
 * Read-only analysis helpers for Graphify `graph.json` files.
 *
 * Used by the validation scripts and by tools/graphify/refresh-graph.js.
 * Nothing here writes to disk; the committed graphs stay read-only.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const MEDIA_FILE_TYPES = new Set(['image', 'video', 'audio', 'media', 'binary']);
const MEDIA_EXTENSIONS = /\.(png|jpe?g|webp|gif|bmp|tiff?|mp4|mov|avi|webm|glb|gltf|fbx|obj|stl|blend|wav|mp3|pdf|zip)$/i;
const BASE64_MARKER = /data:[a-z]+\/[a-z0-9.+-]+;base64,/i;
const SECRET_MARKERS = [
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
const ABSOLUTE_PATH = /^(?:[A-Za-z]:[\\/]|\\\\|\/(?:home|Users|mnt|opt|var)\/)/;

function loadGraph(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read graph file ${file}: ${err.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Graph file ${file} is not valid JSON: ${err.message}`);
  }
  if (!data || !Array.isArray(data.nodes)) {
    throw new Error(`Graph file ${file} has no nodes array`);
  }
  if (!Array.isArray(data.links)) data.links = [];
  return data;
}

function graphStats(graph) {
  const nodes = graph.nodes || [];
  const links = graph.links || [];
  const ids = new Set();
  const sources = new Set();
  const fileTypes = {};
  const communities = new Set();
  let selfLoops = 0;

  for (const node of nodes) {
    ids.add(node.id);
    if (node.source_file) sources.add(node.source_file);
    if (node.file_type) fileTypes[node.file_type] = (fileTypes[node.file_type] || 0) + 1;
    if (node.community !== undefined && node.community !== null) {
      communities.add(String(node.community));
    }
  }

  let dangling = 0;
  let extracted = 0;
  let inferred = 0;
  for (const link of links) {
    if (link.source === link.target) selfLoops += 1;
    if (!ids.has(link.source) || !ids.has(link.target)) dangling += 1;
    if (link.confidence === 'EXTRACTED') extracted += 1;
    else if (link.confidence === 'INFERRED') inferred += 1;
  }

  return {
    nodes: nodes.length,
    links: links.length,
    extracted,
    inferred,
    communities: communities.size,
    sources: sources.size,
    dangling,
    selfLoops,
    fileTypes
  };
}

function findDanglingLinks(graph) {
  const ids = new Set((graph.nodes || []).map((n) => n.id));
  return (graph.links || [])
    .filter((link) => !ids.has(link.source) || !ids.has(link.target))
    .map((link) => ({ source: link.source, target: link.target }));
}

function findAbsoluteSources(graph) {
  return (graph.nodes || [])
    .filter((n) => n.source_file && ABSOLUTE_PATH.test(n.source_file))
    .map((n) => ({ id: n.id, source_file: n.source_file }));
}

/**
 * Absolute paths and source_file references that do not resolve on disk.
 * `root` is optional: without it only the absolute-path check runs.
 */
function findSourceProblems(graph, root) {
  const absolute = findAbsoluteSources(graph);
  const absoluteIds = new Set(absolute.map((a) => a.id));
  const missing = [];
  if (root) {
    for (const node of graph.nodes || []) {
      const file = node.source_file;
      if (!file || absoluteIds.has(node.id)) continue;
      // Semantic/document nodes may cite a path inside a JSON container; only
      // check real filesystem references that look like repo paths.
      if (!/\//.test(file)) continue;
      if (!fs.existsSync(path.join(root, file))) {
        missing.push({ id: node.id, source_file: file });
      }
    }
  }
  return { absolute, missing };
}

function findForbiddenContent(graph) {
  const problems = [];
  for (const node of graph.nodes || []) {
    if (MEDIA_FILE_TYPES.has(node.file_type)) {
      problems.push(`media node file_type="${node.file_type}" (id=${node.id})`);
    }
    if (node.source_file && MEDIA_EXTENSIONS.test(node.source_file)) {
      problems.push(`media source_file (id=${node.id}): ${node.source_file}`);
    }
    const text = [node.label, node.text, node.description, node.summary]
      .filter((v) => typeof v === 'string')
      .join('\n');
    if (BASE64_MARKER.test(text)) {
      problems.push(`base64 payload (id=${node.id})`);
    }
    if (SECRET_MARKERS.some((re) => re.test(text))) {
      problems.push(`secret-shaped string (id=${node.id})`);
    }
  }
  return problems;
}

/**
 * Structural fingerprint: sorted node ids plus sorted, normalized edges.
 * Metadata (community names, commit hash, ordering, weights) is excluded so
 * structural reproducibility and byte reproducibility cannot be confused.
 */
function canonicalFingerprint(graph) {
  const nodeIds = (graph.nodes || []).map((n) => String(n.id)).sort();
  const edges = (graph.links || [])
    .map((l) => [String(l.source), String(l.relation || ''), String(l.target)].join('\u0000'))
    .sort();
  const hash = crypto.createHash('sha256');
  hash.update('nodes\n');
  for (const id of nodeIds) hash.update(id + '\n');
  hash.update('edges\n');
  for (const edge of edges) hash.update(edge + '\n');
  return hash.digest('hex');
}

/**
 * Node ids that encode an absolute filesystem path.
 *
 * Graphify slugifies an unresolvable import target into the node id. When the
 * import is written as an absolute path (a machine-specific path slipped into
 * source, or a resolution bug), the id itself becomes machine-specific — so
 * two runs on two checkouts produce structurally different graphs. Measured
 * on 0.9.66 during the WP-GRAPHIFY-02 reproducibility test.
 */
function findAbsoluteIds(graph) {
  return (graph.nodes || [])
    .filter((n) => /^[a-z]_(users|home|mnt|opt|var|tmp|appdata|documents|desktop)_/.test(String(n.id)))
    .map((n) => n.id);
}

function basenameOf(file) {
  return file ? path.posix.basename(String(file).replace(/\\/g, '/')) : '';
}

/**
 * Per-community source distribution, and whether the community name points at
 * a source file that is not the community's dominant source.
 *
 * Graphify names a community after its highest-degree member (the hub). That
 * hub is one node, so a hub imported by many call sites in one test file can
 * name an entire community whose bulk lives in another file.
 */
function communityQuality(graph) {
  const byCommunity = new Map();
  for (const node of graph.nodes || []) {
    const key = node.community === undefined ? '(unassigned)' : String(node.community);
    if (!byCommunity.has(key)) byCommunity.set(key, []);
    byCommunity.get(key).push(node);
  }

  const communities = [];
  for (const [key, members] of byCommunity) {
    const counts = new Map();
    for (const node of members) {
      const src = node.source_file || '(none)';
      counts.set(src, (counts.get(src) || 0) + 1);
    }
    const sorted = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))
    );
    const [dominantSource, dominantCount] = sorted[0];

    const name = members.find((n) => n.community_name)?.community_name || '';
    // The label can name a file ('batch2.test'), a symbol ('loadServer') or a
    // human concept ('Equipment attachment system'). Only the first two are
    // checkable against source_file / member labels.
    const labelSource = sorted.find(([src]) => {
      const base = basenameOf(src);
      if (!base || src === '(none)') return false;
      const stem = base.replace(/\.[^.]+$/, '');
      return name === base || name === stem || name === stem.replace(/\.(test|spec)$/, '');
    });
    const labelHub = members.find(
      (n) => String(n.label || '') === name || String(n.label || '') === `${name}()`
    );

    // Graphify's no-LLM labeler names a community after its highest-degree
    // member, so a symbol label points at exactly one node's file. That label
    // says nothing about the rest of the community.
    //
    // Two hub kinds are not checkable this way, and reporting them as
    // "misleading" would be a fabricated accuracy claim:
    //   - a document hub, whose label is the report/story title it carries;
    //   - a hub with no source_file (an external symbol such as `os`).
    const hubIsCode = labelHub && labelHub.file_type === 'code' && labelHub.source_file;
    const labelKind = labelSource ? 'file' : hubIsCode ? 'hub' : 'descriptive';
    const labelHubSource = hubIsCode ? labelHub.source_file : null;
    const labelledSource = labelSource ? labelSource[0] : labelHubSource;
    const labelledCount = labelSource
      ? labelSource[1]
      : labelledSource
        ? counts.get(labelledSource) || 0
        : 0;

    const offTarget = labelledSource ? members.length - labelledCount : null;
    // A descriptive label ('WP1D.1 geometry audit') names no member and no
    // file, so there is nothing to prove wrong. Report it as unverifiable
    // instead of inventing an accuracy number for it.
    //
    // The measured question is the one WP-GRAPHIFY-01 asked: does the label
    // name the majority of the community? A file/symbol label covering half
    // the members or less does not describe the community.
    const misleading = Boolean(
      labelKind !== 'descriptive' && labelledSource && labelledCount * 2 <= members.length
    );

    communities.push({
      community: Number.isFinite(Number(key)) ? Number(key) : key,
      size: members.length,
      label: name,
      labelKind,
      labelHubSource,
      labelCount: labelledCount,
      hubLabel: members
        .slice()
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))[0]?.label,
      distinctSources: sorted.length,
      dominantSource,
      dominantCount,
      dominantShare: members.length ? dominantCount / members.length : 0,
      labelSource: labelSource ? labelSource[0] : null,
      offTarget,
      misleading,
      distribution: sorted.slice(0, 5).map(([source, count]) => ({ source, count }))
    });
  }

  communities.sort((a, b) => b.size - a.size || String(a.community).localeCompare(String(b.community)));

  const shares = communities.map((c) => c.dominantShare).sort((a, b) => a - b);
  const median = shares.length
    ? shares[Math.floor(shares.length / 2)]
    : 0;

  return {
    communities,
    summary: {
      communities: communities.length,
      misleading: communities.filter((c) => c.misleading).length,
      singleSource: communities.filter((c) => c.distinctSources === 1).length,
      dominantShareMedian: Number(median.toFixed(3))
    }
  };
}

/**
 * Validates a candidate graph against thresholds and the current baseline.
 * Returns { ok, errors, warnings, detail }. Never writes anything.
 */
function validateCandidate(graph, { root, baseline, policy }) {
  const errors = [];
  const warnings = [];
  const stats = graphStats(graph);
  const baselineStats = baseline ? graphStats(baseline) : null;
  const detail = { stats, baselineStats, dangling: [], missingSources: [], absoluteSources: [] };

  if (stats.nodes < policy.minNodes) {
    errors.push(
      `node count ${stats.nodes} is below the ${policy.minNodes}-node floor for a ${policy.repoType} repository`
    );
  }
  if (stats.links < policy.minLinks) {
    errors.push(
      `link count ${stats.links} is below the ${policy.minLinks}-link floor for a ${policy.repoType} repository`
    );
  }

  if (baselineStats) {
    const tolerance = policy.shrinkTolerance ?? 0.1;
    const allowedNodes = Math.floor(baselineStats.nodes * (1 - tolerance));
    const allowedLinks = Math.floor(baselineStats.links * (1 - tolerance));
    if (stats.nodes < allowedNodes) {
      errors.push(
        `suspicious shrink: ${stats.nodes} nodes vs ${baselineStats.nodes} in the current graph ` +
          `(tolerance ${(tolerance * 100).toFixed(0)}%)`
      );
    }
    if (baselineStats.links > 0 && stats.links < allowedLinks) {
      errors.push(
        `suspicious shrink: ${stats.links} links vs ${baselineStats.links} in the current graph ` +
          `(tolerance ${(tolerance * 100).toFixed(0)}%)`
      );
    }
  }

  detail.dangling = findDanglingLinks(graph);
  if (detail.dangling.length) {
    errors.push(
      `dangling edge endpoints: ${detail.dangling
        .slice(0, 5)
        .map((d) => `${d.source}->${d.target}`)
        .join(', ')}${detail.dangling.length > 5 ? ' …' : ''}`
    );
  }

  detail.absoluteIds = findAbsoluteIds(graph);
  if (detail.absoluteIds.length) {
    errors.push(
      `machine-specific node ids derived from absolute paths: ${detail.absoluteIds
        .slice(0, 3)
        .join(', ')} — the candidate graph is not portable`
    );
  }

  for (const id of policy.requiredNodeIds || []) {
    if (!graph.nodes.some((n) => n.id === id)) {
      errors.push(`required node missing: ${id}`);
    }
  }

  for (const type of policy.requiredFileTypes || []) {
    if (!stats.fileTypes[type]) {
      errors.push(
        `required file_type missing: no "${type}" nodes (found: ${Object.keys(stats.fileTypes).join(', ') || 'none'})`
      );
    }
  }

  if (policy.requireSemanticNodes) {
    const semantic = (stats.fileTypes.document || 0) + (stats.fileTypes.concept || 0);
    if (semantic < (policy.minSemanticNodes ?? 1)) {
      errors.push(
        `semantic extraction appears absent: ${semantic} document/concept nodes ` +
          `(need at least ${policy.minSemanticNodes ?? 1}); an AST-only refresh must not replace this graph`
      );
    }
  }

  // A code-only extraction on the main repository also drops its semantic
  // content: measured 308 document + 35 concept nodes lost while the node
  // total stayed inside a 15% tolerance. Compare per semantic file_type
  // against the baseline so a "healthy-looking" shrink cannot hide it.
  if (policy.preserveSemanticShare && baselineStats) {
    for (const type of ['document', 'concept', 'rationale']) {
      const before = baselineStats.fileTypes[type] || 0;
      if (!before) continue;
      const after = stats.fileTypes[type] || 0;
      const tolerance = policy.semanticShrinkTolerance ?? 0.05;
      // Ratio, not floor(): a category of 1 node that disappears is a 100%
      // loss, and flooring would forgive it on small graphs.
      const lost = before > after ? (before - after) / before : 0;
      if (lost > tolerance) {
        errors.push(
          `semantic content lost: ${type} nodes fell from ${before} to ${after} ` +
            `(${Math.round(lost * 100)}% lost, tolerance ${(tolerance * 100).toFixed(0)}%). ` +
            'A code-only extraction drops documentation; run the semantic extraction or ' +
            'approve a deliberate restructuring.'
        );
      }
    }
  }

  if (root) {
    const problems = findSourceProblems(graph, root);
    detail.absoluteSources = problems.absolute;
    detail.missingSources = problems.missing.map((m) => m.source_file);
    if (problems.missing.length) {
      errors.push(
        `source file does not resolve: ${problems.missing
          .slice(0, 3)
          .map((p) => p.source_file)
          .join(', ')}${problems.missing.length > 3 ? ` (+${problems.missing.length - 3} more)` : ''}`
      );
    }
  } else {
    detail.absoluteSources = findAbsoluteSources(graph);
  }
  if (detail.absoluteSources.length) {
    errors.push(
      `absolute machine-specific source paths: ${detail.absoluteSources
        .slice(0, 3)
        .map((p) => p.source_file)
        .join(', ')}`
    );
  }

  const forbidden = findForbiddenContent(graph);
  if (forbidden.length) {
    errors.push(`forbidden content: ${forbidden.slice(0, 5).join('; ')}`);
  }
  detail.forbidden = forbidden;

  if (stats.selfLoops) {
    warnings.push(`${stats.selfLoops} self-loop edges (informational)`);
  }

  return { ok: errors.length === 0, errors, warnings, detail };
}

module.exports = {
  loadGraph,
  graphStats,
  findDanglingLinks,
  findSourceProblems,
  findAbsoluteIds,
  findForbiddenContent,
  canonicalFingerprint,
  communityQuality,
  validateCandidate
};

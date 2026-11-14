'use strict';

/**
 * Graphify maintenance CLI for the fitness3D main repository.
 *
 *   node tools/graphify/graphify.js audit       [--repo main|review] [--json]
 *   node tools/graphify/graphify.js baseline    [--repo main|review]
 *   node tools/graphify/graphify.js community   [--repo main|review] [--json]
 *   node tools/graphify/graphify.js refresh     [--repo main|review] [--semantic]
 *   node tools/graphify/graphify.js restore     --backup <path> [--repo ...]
 *   node tools/graphify/graphify.js compare <a.json> <b.json>
 *
 * `refresh` never writes graphify-out/graph.json until a candidate passes
 * validation. Extraction runs into a temp directory, so the installed graph is
 * only touched by the swap at the end.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const lib = require('./graph-lib.js');
const {
  refreshGraph,
  restoreGraph,
  listBackups,
  describeExtractionFailure,
  sha256File,
  detectRepoType
} = require('./refresh-graph.js');

const MAIN_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Picks the repository this checkout is. The same tooling file is copied into
 * both repositories, so the default cannot be a literal "main": in the review
 * checkout, main and review would resolve to the same graph and a code-only
 * refresh would be attempted on an evidence repo.
 */
function defaultRepo(root = MAIN_ROOT) {
  try {
    return detectRepoType(root) === 'evidence' ? 'review' : 'main';
  } catch {
    return 'main';
  }
}

/**
 * Resolves a repository root. The tooling is copied into both checkouts, so
 * "main" means this checkout and "review" is either the checkout itself (when
 * this is the evidence repo) or the path in GRAPHIFY_REVIEW_ROOT.
 */
function repoRoot(repo, env = process.env) {
  const mainRoot = env.GRAPHIFY_MAIN_ROOT || MAIN_ROOT;
  let hereType;
  try {
    hereType = detectRepoType(mainRoot);
  } catch {
    hereType = null;
  }

  if (repo === 'main') {
    if (hereType === 'evidence') {
      throw new Error(
        `${mainRoot} is the evidence repository; use --repo review. This tooling never treats an evidence checkout as a code repository.`
      );
    }
    return mainRoot;
  }
  if (repo === 'review') {
    const root = env.GRAPHIFY_REVIEW_ROOT || (hereType === 'evidence' ? mainRoot : null);
    if (!root) {
      throw new Error(
        'Review repository location is unknown. Set GRAPHIFY_REVIEW_ROOT to the fitness3D-visual-review checkout.'
      );
    }
    if (!fs.existsSync(path.join(root, 'graphify-out', 'graph.json'))) {
      throw new Error(
        `No graph at ${path.join(root, 'graphify-out', 'graph.json')}. Point GRAPHIFY_REVIEW_ROOT at the fitness3D-visual-review checkout.`
      );
    }
    return root;
  }
  throw new Error(`Unknown repository: ${repo} (expected main or review)`);
}

function policyFor(repo) {
  const file = path.join(__dirname, 'policy.json');
  const all = JSON.parse(fs.readFileSync(file, 'utf8'));
  const policy = all[repo];
  if (!policy) throw new Error(`No policy entry for "${repo}" in ${file}`);
  return policy;
}

function graphPath(root) {
  return path.join(root, 'graphify-out', 'graph.json');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--semantic') args.semantic = true;
    else if (a === '--allow-semantic-loss') args.allowSemanticLoss = true;
    else if (a === '--json') args.json = true;
    else if (a === '--backup') args.backup = argv[++i];
    else if (a === '--repo') args.repo = argv[++i];
    else if (a === '--graph') args.graph = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else args._.push(a);
  }
  args.repo = args.repo || defaultRepo();
  return args;
}

function describe(root) {
  const file = graphPath(root);
  const graph = lib.loadGraph(file);
  const stats = lib.graphStats(graph);
  const sources = lib.findSourceProblems(graph, root);
  const forbidden = lib.findForbiddenContent(graph);
  return {
    root,
    graphPath: file,
    repoType: detectRepoType(root),
    sha256: sha256File(file),
    bytes: fs.statSync(file).size,
    stats,
    dangling: lib.findDanglingLinks(graph),
    absoluteSources: sources.absolute,
    missingSources: sources.missing,
    forbidden,
    fingerprint: lib.canonicalFingerprint(graph)
  };
}

function audit(repo, json) {
  const root = repoRoot(repo);
  const report = describe(root);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }
  const s = report.stats;
  console.log(`graph:        ${report.graphPath}`);
  console.log(`repo type:    ${report.repoType}`);
  console.log(`sha256:       ${report.sha256}`);
  console.log(`size:         ${report.bytes} bytes`);
  console.log(`nodes:        ${s.nodes}  links: ${s.links}  communities: ${s.communities}`);
  console.log(`confidence:   ${s.extracted} EXTRACTED, ${s.inferred} INFERRED`);
  console.log(`sources:      ${s.sources} distinct source_file`);
  console.log(`file types:   ${JSON.stringify(s.fileTypes)}`);
  console.log(`dangling:     ${report.dangling.length}`);
  console.log(`self-loops:   ${s.selfLoops}`);
  console.log(`absolute src: ${report.absoluteSources.length}`);
  console.log(`missing src:  ${report.missingSources.length}`);
  console.log(`forbidden:    ${report.forbidden.length}`);
  const problems =
    report.dangling.length + report.absoluteSources.length + report.missingSources.length + report.forbidden.length;
  console.log(problems === 0 ? 'integrity:    OK' : 'integrity:    PROBLEMS FOUND');
  return report;
}

function communityReport(report, repo, graphFile) {
  const { summary } = report;
  // Committed docs must not carry this machine's path, so describe the graph
  // relative to its own repository root.
  const root = repoRoot(repo);
  const rel = path.relative(root, graphFile).split(path.sep).join('/');
  const shownGraph = rel && !rel.startsWith('..') && !/^[A-Za-z]:/.test(rel)
    ? rel
    : 'graphify-out/graph.json';
  const lines = [
    '# Graphify community-label quality',
    '',
    'Generated by `node tools/graphify/graphify.js community --out <file>`.',
    'Re-run it after a graph refresh; every number below is measured from',
    `\`${shownGraph}\` in the ${repo} repository.`,
    '',
    '## How labels are produced',
    '',
    'Graphify clusters the graph with Louvain and then names each community.',
    'When no LLM backend is configured, the no-backend labeler',
    '(`label_communities_by_hub` in graphify `cluster.py`) names a community after',
    'its **highest-degree single node** — a symbol such as `loadServer`, a file such',
    'as `batch2.test`, or, for an evidence cluster, the report node that cites it.',
    '',
    'Degree is a property of one node. A test helper called from many places, or a',
    'file that imports a popular module, can therefore name a community whose',
    'membership is mostly spread over unrelated files.',
    '',
    '**Community names are heuristic clusters. They are not module ownership,',
    'architecture boundaries, manifest-transition ownership, or production',
    'pipeline responsibility.** Use `graphify explain` and `graphify path` on the',
    'nodes themselves, then read the source.',
    '',
    '## Measurement',
    '',
    'For each community the report records: size, distinct source files, the',
    'dominant source file and its count, whether the label names a file or a single',
    'node (the "hub"), and how many members that label actually covers.',
    '',
    'A label is **misleading** when it names a file or hub but that name covers half',
    'the members or fewer. Labels that name no member at all (a report title such as',
    '`WP1D.1 geometry audit`) are **unverifiable**, not misleading: there is no',
    'membership claim to test, so none is invented.',
    '',
    '## Summary',
    '',
    `| Measure | Value |`,
    `|---|---|`,
    `| Communities | ${summary.communities} |`,
    `| Misleading labels | ${summary.misleading} |`,
    `| Single-source communities | ${summary.singleSource} |`,
    `| Median dominant-source share | ${summary.dominantShareMedian} |`,
    '',
    '## Misleading communities',
    ''
  ];

  const bad = report.communities.filter((c) => c.misleading);
  if (bad.length === 0) {
    lines.push('None measured in this graph.', '');
  } else {
    lines.push('| Community | Label | Size | Off-target | Dominant source | Label names |');
    lines.push('|---|---|---|---|---|---|');
    for (const c of bad) {
      const named = c.labelSource || c.labelHubSource || '—';
      lines.push(
        `| #${c.community} | \`${c.label}\` | ${c.size} | ${c.offTarget} | ` +
          `\`${c.dominantSource}\` (${c.dominantCount}) | \`${named}\` |`
      );
    }
    lines.push('', '### Source distribution of each misleading community', '');
    for (const c of bad) {
      lines.push(`**#${c.community} \`${c.label}\`** — ${c.size} nodes across ${c.distinctSources} files`, '');
      for (const d of c.distribution) {
        lines.push(`- \`${d.source}\`: ${d.count}`);
      }
      lines.push('');
    }
  }

  lines.push(
    '## What is not done',
    '',
    '- Labels are **not** renamed in `graph.json`. Graphify has no supported',
    '  community-label override that survives a refresh, and hand-editing the',
    '  generated file would be silently discarded. The original community ids and',
    '  names are preserved exactly as Graphify produced them.',
    '- No architectural names were invented to make the graph look tidier.',
    '- This report measures label coverage only. It says nothing about whether a',
    '  community is a good module boundary.',
    ''
  );

  return lines.join('\n');
}

function community(repo, json, outFile, graphFile) {
  const file = graphFile || graphPath(repoRoot(repo));
  const report = lib.communityQuality(lib.loadGraph(file));
  if (outFile) {
    fs.writeFileSync(outFile, communityReport(report, repo, file), 'utf8');
    console.log(`Wrote ${outFile}`);
    return report;
  }
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }
  const { summary } = report;
  console.log(
    `communities: ${summary.communities}  misleading labels: ${summary.misleading}  ` +
      `single-source: ${summary.singleSource}  median dominant share: ${summary.dominantShareMedian}`
  );
  for (const c of report.communities) {
    if (!c.misleading) continue;
    console.log(
      `  #${c.community} "${c.label}" — ${c.size} nodes, ${c.offTarget} off-target; ` +
        `dominant ${c.dominantSource} (${c.dominantCount}), label names ${c.labelSource}`
    );
  }
  return report;
}

/* ------------------------------------------------------------------ */
/* baseline report                                                    */
/* ------------------------------------------------------------------ */

const BASELINE_DOC = path.join(MAIN_ROOT, 'docs', 'GRAPHIFY_BASELINE.md');

function baseline(repo, outFile) {
  const target = outFile || BASELINE_DOC;
  if (fs.existsSync(target)) {
    console.log(`${target} already exists — refusing to overwrite the recorded baseline.`);
    return;
  }
  const root = repoRoot(repo);
  const d = describe(root);
  const s = d.stats;
  const commit = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout?.trim();
  const branch = spawnSync('git', ['-C', root, 'rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8'
  }).stdout?.trim();
  const status = spawnSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).stdout?.trim();
  const htmlFile = path.join(root, 'graphify-out', 'graph.html');
  const lines = [
    '# Graphify baseline — WP-GRAPHIFY-02',
    '',
    'Recorded before any WP-GRAPHIFY-02 change. Do not overwrite this file: a later',
    'baseline is a new dated section appended below, so the original values stay',
    'comparable.',
    '',
    `Captured: ${new Date().toISOString()}`,
    `Repository: ${repo === 'main' ? 'main' : 'review'} repository at \`${branch}\``,
    `Branch: \`${branch}\` @ \`${commit}\``,
    status ? `Working tree at capture: uncommitted changes present\n\n\`\`\`\n${status}\n\`\`\`` : 'Working tree at capture: clean',
    '',
    '| Measure | Value |',
    '|---|---|',
    `| \`graphify-out/graph.json\` SHA-256 | \`${d.sha256}\` |`,
    `| \`graph.json\` size | ${d.bytes} bytes |`,
    `| \`graph.html\` size | ${fs.existsSync(htmlFile) ? fs.statSync(htmlFile).size + ' bytes' : 'absent'} |`,
    `| Nodes | ${s.nodes} |`,
    `| Links | ${s.links} |`,
    `| Communities | ${s.communities} |`,
    `| EXTRACTED edges | ${s.extracted} |`,
    `| INFERRED edges | ${s.inferred} |`,
    `| Distinct \`source_file\` | ${s.sources} |`,
    `| Self-loops | ${s.selfLoops} |`,
    `| Dangling endpoints | ${d.dangling.length} |`,
    `| Unresolvable source files | ${d.missingSources.length} |`,
    `| Absolute machine paths | ${d.absoluteSources.length} |`,
    `| Forbidden content (media/base64/secret) | ${d.forbidden.length} |`,
    `| Structural fingerprint | \`${d.fingerprint}\` |`,
    '',
    `File types: \`${JSON.stringify(s.fileTypes)}\``,
    '',
    'The graph is committed, so this table can be re-measured at any time with:',
    '',
    '```powershell',
    'node tools/graphify/graphify.js audit',
    '```',
    ''
  ];
  fs.writeFileSync(target, lines.join('\n'), 'utf8');
  console.log(`Wrote ${target}`);
}

/* ------------------------------------------------------------------ */
/* refresh                                                            */
/* ------------------------------------------------------------------ */

function runGraphifyExtract({ root, outDir, codeOnly, semantic }) {
  const args = ['extract', root, '--out', outDir];
  // code-only keeps the local AST path; a semantic run needs a configured
  // backend, which is the operator's decision, not this script's.
  if (codeOnly) args.push('--code-only');
  args.push('--max-workers', '1');
  // graphify 0.9.66 re-execs itself for extract unless PYTHONHASHSEED is
  // already set, and that re-exec is broken on Windows. Setting it up front
  // also pins Louvain's iteration order, so clustering stays reproducible.
  const env = { ...process.env, PYTHONHASHSEED: process.env.PYTHONHASHSEED || '0' };
  const run = spawnSync('graphify', args, { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  const out = `${run.stdout || ''}${run.stderr || ''}`.trim();
  if (run.status !== 0) {
    throw new Error(
      `graphify extract exited ${run.status}:\n${describeExtractionFailure({
        status: run.status,
        output: out.slice(-2000)
      })}`
    );
  }
  if (!semantic) {
    const detectFile = path.join(outDir, 'graphify-out', '.graphify_detect.json');
    if (fs.existsSync(detectFile)) {
      const detect = JSON.parse(fs.readFileSync(detectFile, 'utf8'));
      const semanticFiles = ['document', 'paper', 'image'].reduce(
        (sum, k) => sum + (detect.files?.[k]?.length || 0),
        0
      );
      if (semanticFiles > 0) {
        throw new Error(
          `Detection found ${semanticFiles} document/paper/image files, but this is the code-only path. ` +
            'A code-only candidate would drop the semantic nodes. Re-run with --semantic.'
        );
      }
    }
  }
  return path.join(outDir, 'graphify-out', 'graph.json');
}

function refresh(repo, semantic, allowSemanticLoss) {
  const root = repoRoot(repo);
  const policy = policyFor(repo);
  const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'graphify-refresh-'));
  try {
    const result = refreshGraph({
      root,
      policy,
      semantic,
      allowSemanticLoss,
      produce: ({ outPath }) => {
        runGraphifyExtract({ root, outDir: tmpOut, codeOnly: !semantic, semantic });
        return path.join(tmpOut, 'graphify-out', 'graph.json');
      }
    });
    printRefreshResult(result);
    if (!result.ok) process.exitCode = 1;
    return result;
  } finally {
    fs.rmSync(tmpOut, { recursive: true, force: true });
  }
}

function printRefreshResult(result) {
  console.log(`candidate: ${result.ok ? 'ACCEPTED' : 'REJECTED'}`);
  const s = result.stats || {};
  console.log(
    `  baseline ${result.baselineStats.nodes} nodes / ${result.baselineStats.links} links ` +
      `→ candidate ${s.nodes ?? '?'} nodes / ${s.links ?? '?'} links`
  );
  console.log(`  baseline sha256 ${result.baselineHash}`);
  console.log(`  installed sha256 ${result.installedHash}${result.unchanged ? ' (unchanged)' : ''}`);
  console.log(`  backup ${result.backup}`);
  for (const w of result.warnings || []) console.log(`  warning: ${w}`);
  for (const e of result.errors) console.log(`  error: ${e}`);
  if (!result.ok) {
    console.log(
      '  The installed graph was not modified. Fix the extraction or (with explicit' +
        ' approval) adjust the regression thresholds in tools/graphify/policy.json.'
    );
  }
}

/* ------------------------------------------------------------------ */

function compare(aPath, bPath) {
  const a = lib.loadGraph(aPath);
  const b = lib.loadGraph(bPath);
  const out = {
    a: { path: aPath, sha256: sha256File(aPath), fingerprint: lib.canonicalFingerprint(a), stats: lib.graphStats(a) },
    b: { path: bPath, sha256: sha256File(bPath), fingerprint: lib.canonicalFingerprint(b), stats: lib.graphStats(b) }
  };
  out.byteIdentical = out.a.sha256 === out.b.sha256;
  // Structural reproducibility is identical nodes and edges after canonical
  // normalization; it is NOT the same claim as byte-identical output.
  out.structurallyIdentical = out.a.fingerprint === out.b.fingerprint;
  console.log(JSON.stringify(out, null, 2));
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  switch (cmd) {
    case 'audit':
      audit(args.repo, args.json);
      break;
    case 'baseline':
      baseline(args.repo, args.out);
      break;
    case 'community':
      community(args.repo, args.json, args.out, args.graph);
      break;
    case 'refresh':
      refresh(args.repo, Boolean(args.semantic), Boolean(args.allowSemanticLoss));
      break;
    case 'restore': {
      if (!args.backup) throw new Error('restore requires --backup <path>');
      const root = repoRoot(args.repo);
      const result = restoreGraph(root, args.backup);
      console.log(`restored ${result.restored} (sha256 ${result.hash})`);
      break;
    }
    case 'backups':
      for (const p of listBackups(repoRoot(args.repo))) console.log(p);
      break;
    case 'compare':
      compare(args._[1], args._[2]);
      break;
    default:
      console.log(
        'usage: node tools/graphify/graphify.js <audit|baseline|community|refresh|restore|backups|compare> ' +
          '[--repo main|review] [--semantic] [--allow-semantic-loss] [--json] [--backup <path>]'
      );
      process.exitCode = 2;
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  audit,
  community,
  refresh,
  compare,
  describe,
  repoRoot,
  defaultRepo,
  policyFor
};

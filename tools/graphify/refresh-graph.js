'use strict';

/**
 * Safe Graphify refresh for fitness3D.
 *
 * Contract: a candidate graph is extracted to a temp path, validated against
 * the installed graph plus per-repository thresholds, and only then swapped in.
 * Every failure leaves `graphify-out/graph.json` byte-identical.
 *
 * The extraction itself is injected (`produce`) so tests can drive failure
 * modes without invoking Graphify, and so a caller can pick a code-only or a
 * semantic extraction.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  loadGraph,
  graphStats,
  validateCandidate,
  canonicalFingerprint
} = require('./graph-lib.js');

const BACKUP_DIR = path.join('graphify-out', 'backups');
const GRAPH_PATH = path.join('graphify-out', 'graph.json');

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * Code repositories have package.json and source/test trees. The review
 * repository is documentation and evidence JSON with no package manifest.
 */
function detectRepoType(root) {
  const has = (rel) => fs.existsSync(path.join(root, rel));
  if (has('package.json') || has('src') || has('production')) return 'code';
  const evidenceDirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^WP1D/i.test(d.name));
  if (has('README.md') && evidenceDirs.length) return 'evidence';
  throw new Error(
    `Cannot classify ${root} as a code or evidence repository: no package.json/src/production and no WP1D*/ evidence tree`
  );
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

function backupGraph(root, graphPath) {
  const dir = path.join(root, BACKUP_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `graph-${timestamp()}.json`);
  fs.copyFileSync(graphPath, target);
  const hash = sha256File(target);
  fs.writeFileSync(
    target.replace(/\.json$/, '.sha256'),
    `${hash}  graph.json\n`,
    'utf8'
  );
  return { path: target, hash };
}

function listBackups(root) {
  const dir = path.join(root, BACKUP_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .reverse()
    .map((name) => path.join(dir, name));
}

/**
 * Turns a failed `graphify` run into an actionable message.
 *
 * graphify 0.9.66 re-execs itself with PYTHONHASHSEED=0 for extract/update/
 * cluster-only. On Windows it passes sys.argv[0] — the uv launcher path
 * without `.exe` — as the script, so the child python cannot open it and dies
 * with 0xC0000005 (3221225477) or errno 2, leaving the graph untouched. The
 * workaround is to set the variable before the process starts.
 */
function describeExtractionFailure({ status, output }) {
  const text = String(output || '').trim();
  const windowsReexec =
    status === 3221225477 ||
    /can't open file .*[\\/]graphify'?: \[Errno 2\]/.test(text);
  const hint = windowsReexec
    ? 'Windows re-exec bug in graphify (verified on 0.9.66): it restarts itself with ' +
      'PYTHONHASHSEED=0 and passes the launcher path without .exe as the script, so the ' +
      "child dies with 0xC0000005 / \"can't open file ...graphify\". " +
      'Fix: set PYTHONHASHSEED=0 (or any value) in the parent shell before running graphify. ' +
      'That variable makes graphify skip the re-exec and run in-process.'
    : '';
  return [text, hint].filter(Boolean).join('\n\n');
}

/**
 * @param {object} options
 * @param {string} options.root        repository root (graph is written here)
 * @param {string} [options.sourceRoot] root used to resolve source_file; defaults to root
 * @param {object} options.policy      thresholds (see tools/graphify/policy.json)
 * @param {boolean} [options.semantic] evidence repos must set this explicitly
 * @param {boolean} [options.allowSemanticLoss] accept a deliberate semantic drop
 * @param {function} options.produce   ({outPath}) => graph path; runs extraction
 */
function refreshGraph({ root, sourceRoot, policy, semantic = false, allowSemanticLoss = false, produce }) {
  if (typeof produce !== 'function') throw new Error('refreshGraph requires a produce() function');

  const graphPath = path.join(root, GRAPH_PATH);
  if (!fs.existsSync(graphPath)) {
    throw new Error(
      `No existing graph at ${graphPath}. A first build is not a refresh: run graphify extract deliberately and commit the result.`
    );
  }

  const repoType = policy.repoType || detectRepoType(root);
  if (repoType === 'evidence' && !semantic) {
    throw new Error(
      'Evidence repository refresh requires semantic extraction. Pass semantic: true and run the host-agent semantic pass; an AST-only graph would delete the provenance nodes.'
    );
  }

  const baselineRaw = fs.readFileSync(graphPath);
  const baselineHash = sha256File(graphPath);
  const baseline = loadGraph(graphPath);
  const backup = backupGraph(root, graphPath);

  const tmpPath = path.join(root, 'graphify-out', '.candidate-graph.json');
  let candidate;
  const errors = [];
  try {
    const produced = produce({ outPath: tmpPath, root, policy });
    const candidateFile = produced && fs.existsSync(produced) ? produced : tmpPath;
    candidate = loadGraph(candidateFile);
  } catch (err) {
    errors.push(err.message);
  }

  let validation = { ok: false, errors: ['no candidate'], warnings: [], detail: {} };
  if (candidate && errors.length === 0) {
    validation = validateCandidate(candidate, { root: sourceRoot || root, baseline, policy });
    if (allowSemanticLoss) {
      const kept = [];
      for (const error of validation.errors) {
        if (!/^semantic content lost:/.test(error)) kept.push(error);
        else validation.warnings.push(`semantic loss approved: ${error}`);
      }
      validation.errors = kept;
      validation.ok = kept.length === 0;
    }
    errors.push(...validation.errors);
  }

  const ok = errors.length === 0;
  if (ok) {
    const tmp = graphPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(candidate));
    fs.renameSync(tmp, graphPath);
  }

  fs.rmSync(tmpPath, { force: true });

  return {
    ok,
    errors,
    warnings: validation.warnings,
    repoType,
    backup: backup.path,
    backupHash: backup.hash,
    baselineHash,
    installedHash: ok ? sha256File(graphPath) : baselineHash,
    unchanged: !ok,
    stats: validation.detail.stats || null,
    baselineStats: validation.detail.baselineStats || graphStats(baseline),
    fingerprint: candidate ? canonicalFingerprint(candidate) : null,
    baselineFingerprint: canonicalFingerprint(baseline),
    baselineBytes: baselineRaw.length,
    detail: validation.detail
  };
}

function restoreGraph(root, backupPath, { expectedHash } = {}) {
  if (!fs.existsSync(backupPath)) throw new Error(`No backup at ${backupPath}`);
  if (expectedHash) {
    const actual = sha256File(backupPath);
    if (actual !== expectedHash) {
      throw new Error(
        `Backup hash mismatch: ${backupPath} is ${actual}, expected ${expectedHash}. Refusing to restore.`
      );
    }
  }
  const graphPath = path.join(root, GRAPH_PATH);
  fs.copyFileSync(backupPath, graphPath);
  return { restored: graphPath, hash: sha256File(graphPath) };
}

module.exports = {
  detectRepoType,
  refreshGraph,
  restoreGraph,
  listBackups,
  describeExtractionFailure,
  sha256File,
  BACKUP_DIR,
  GRAPH_PATH
};

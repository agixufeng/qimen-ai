import { checkStudyData } from './check-study-data.mjs';
import { STUDY_FILES } from './study-data-files.mjs';
import { verifyReleaseFiles, assertArchiveMetadataFree } from './release-lib.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const dir = resolve(root, process.argv[2] || `.local/releases/v${version}`);
const manifest = verifyReleaseFiles(dir, version);
for (const path of manifest.assets.filter((asset) => /\.(?:tar\.gz|tgz)$/.test(asset.path)))
  assertArchiveMetadataFree(readFileSync(join(dir, path.path)));
mkdirSync(join(root, '.local'), { recursive: true });
const temp = mkdtempSync(join(root, '.local', 'package-smoke-'));
writeFileSync(join(temp, 'package.json'), '{"private":true,"type":"module"}\n');
const packages = manifest.assets
  .filter((a) => a.path.endsWith('.tgz'))
  .map((a) => join(dir, a.path));
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...packages], {
  cwd: temp,
  stdio: 'pipe',
});
const invoke = (args) =>
  execFileSync(process.execPath, [join(temp, 'node_modules/@qimen/cli/dist/bin.js'), ...args], {
    cwd: temp,
    encoding: 'utf8',
  });
assert.equal(invoke(['--version']).trim(), version);
const doc = JSON.parse(invoke(['chart', '--datetime', '2026-10-28T12:00:00']));
assert.equal(doc.chart.pillars.day, '乙亥');
assert.equal(doc.annotations.pillars.hour.horseBranch, '申');
assert.match(invoke(['chart', '--datetime', '2026-10-28T12:00:00', '--format', 'svg']), /^<svg /);
const { importChart } = await import(
  new URL(`file://${join(temp, 'node_modules/@qimen/core/dist/index.js')}`)
);
assert.equal(importChart(JSON.stringify(doc)).matches, true);
const { CLASSICS } = await import(
  new URL(`file://${join(temp, 'node_modules/@qimen/knowledge/dist/index.js')}`)
);
assert.equal(CLASSICS.length, 3);

const { replayStudyCase } = await import(
  new URL(`file://${join(temp, 'node_modules/@qimen/cases/dist/index.js')}`)
);
const generated = JSON.parse(
  readFileSync(join(root, 'apps/web/public/cases/chunks/000.json'), 'utf8'),
).find((r) => r.kind === 'generated');
assert.equal(replayStudyCase(generated).baseMatches, true);
console.log('Release checksums, isolated packages, CLI JSON/SVG and case replay: PASS');

const studyTemp = mkdtempSync(join(root, '.local', 'study-smoke-'));
const archiveEntries = execFileSync('tar', ['-tzf', join(dir, 'study-v1.tar.gz')], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .map((p) => p.replace(/^\.\//, ''));
const archiveFiles = archiveEntries.filter((p) => p && p !== 'chunks/');
assert.deepEqual(archiveFiles.sort(), [...STUDY_FILES].sort());
execFileSync('tar', ['-xzf', join(dir, 'study-v1.tar.gz'), '-C', studyTemp]);
const study = checkStudyData(studyTemp);
assert.equal(study.records, 10000);
console.log('Downloaded study archive inventory, checksums, 10000 records and replay: PASS');

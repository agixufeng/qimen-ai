import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  verifyReleaseFiles,
  validatePublicPaths,
  assertArchiveMetadataFree,
} from './release-lib.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const dir = resolve(root, process.argv[2] || `.local/releases/v${version}`);
verifyReleaseFiles(dir, version);
assertArchiveMetadataFree(readFileSync(join(dir, 'source.tar.gz')));
const run = (cmd, args, cwd = root) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe' });
const entries = run('tar', ['-tzf', join(dir, 'source.tar.gz')])
  .trim()
  .split('\n');
validatePublicPaths(entries);
assert.deepEqual(
  [...entries].sort(),
  JSON.parse(readFileSync(join(dir, 'public-files.json'), 'utf8')).sort(),
);
mkdirSync(join(root, '.local'), { recursive: true });
const temp = mkdtempSync(join(root, '.local', 'source-smoke-'));
run('tar', ['-xzf', join(dir, 'source.tar.gz'), '-C', temp]);
run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], temp);
run('npm', ['run', 'typecheck'], temp);
run('npm', ['test'], temp);
run('npm', ['run', 'build'], temp);
run('npm', ['run', 'data:check'], temp);
const raw = run(
  process.execPath,
  ['packages/cli/dist/bin.js', 'chart', '--datetime', '2026-10-28T12:00:00'],
  temp,
);
assert.equal(JSON.parse(raw).chart.pillars.day, '乙亥');
console.log(
  'Source archive inventory, clean npm ci, typecheck, full unit tests, production build and CLI: PASS',
);

import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicPaths, assertPublicText } from '../scripts/release-lib.mjs';
import * as releaseChecks from '../scripts/release-lib.mjs';
import { gzipSync } from 'node:zlib';

test('archive checks see AppleDouble and xattr records independently of platform tar listings', () => {
  assert.equal(typeof releaseChecks.assertArchiveMetadataFree, 'function');
  const archive = (name: string, body = '', type = '0') => {
    const header = Buffer.alloc(512);
    header.write(name, 0, 100);
    header.write(Buffer.byteLength(body).toString(8).padStart(11, '0') + '\0', 124, 12);
    header.write(type, 156, 1);
    return gzipSync(
      Buffer.concat([
        header,
        Buffer.from(body),
        Buffer.alloc(((512 - (Buffer.byteLength(body) % 512)) % 512) + 1024),
      ]),
    );
  };
  assert.doesNotThrow(() =>
    releaseChecks.assertArchiveMetadataFree(archive('README.md', 'public')),
  );
  assert.throws(
    () => releaseChecks.assertArchiveMetadataFree(archive('docs/._README.md', 'private metadata')),
    /metadata/i,
  );
  assert.throws(
    () =>
      releaseChecks.assertArchiveMetadataFree(
        archive('PaxHeader/README.md', '40 SCHILY.xattr.user.example=private\n', 'x'),
      ),
    /metadata/i,
  );
});

test('source archive rejects private, generated, traversal and unexpected root files', () => {
  assert.doesNotThrow(() =>
    validatePublicPaths([
      'README.md',
      '.gitignore',
      'packages/core/src/index.ts',
      '.github/workflows/ci.yml',
    ]),
  );
  for (const path of [
    '.env',
    'packages/core/.env.local',
    'packages/core/dist/index.js',
    'node_modules/x',
    '/tmp/file',
    '../README.md',
    'docs/../secret',
    'docs/link/../../x',
    '.local/report.json',
    'apps/web/public/cases/index.json',
    'personal-notes.md',
  ]) {
    assert.throws(() => validatePublicPaths([path]), path);
  }
});
test('release text scan rejects credentials and machine paths without echoing contents', () => {
  assert.doesNotThrow(() =>
    assertPublicText('README.md', 'Public example 2026-10-28, no account configuration.'),
  );
  for (const value of [
    'gh' + 'p_' + 'a'.repeat(36),
    'sk' + '-proj-' + 'a'.repeat(40),
    'sk' + '-svcacct-' + 'a'.repeat(40),
    '-----BEGIN ' + 'PRIVATE KEY-----',
    '/Users/' + 'xf/private',
  ]) {
    assert.throws(() => assertPublicText('docs/example.md', value), /docs\/example\.md/);
  }
});

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { verifyReleaseFiles } from '../scripts/release-lib.mjs';
function releaseFixture(version = '0.3.0') {
  const dir = mkdtempSync(join(tmpdir(), 'qimen-release-check-'));
  mkdirSync(join(dir, 'packages'));
  const paths = [
    'source.tar.gz',
    'website.tar.gz',
    'public-files.json',
    'RELEASE_NOTES.md',
    ...(version === '0.3.0'
      ? ['core', 'knowledge', 'cli']
      : ['core', 'knowledge', 'cases', 'cli']
    ).map((p) => `packages/qimen-${p}-${version}.tgz`),
    ...(version === '0.4.0' ? ['study-v1.tar.gz'] : []),
  ];
  for (const p of paths)
    writeFileSync(join(dir, p), p === 'public-files.json' ? '["README.md"]' : 'public fixture');
  const hash = (p: string) =>
    createHash('sha256')
      .update(readFileSync(join(dir, p)))
      .digest('hex');
  const manifest = {
    version,
    ...(version === '0.4.0' ? { datasetVersion: 'study-v1' } : {}),
    status: 'local-candidate-not-published',
    baseEngineVersion: '0.1.0',
    annotationProfile: 'shijia-common-annotations-v1/1.0.0',
    knowledgeVersion: 'shenqi-first-dual-v1',
    node: '>=22',
    publicFileCount: 1,
    assets: paths.map((path) => ({
      path,
      bytes: readFileSync(join(dir, path)).length,
      sha256: hash(path),
    })),
  };
  writeFileSync(join(dir, 'MANIFEST.json'), JSON.stringify(manifest));
  const sum = () =>
    writeFileSync(
      join(dir, 'SHA256SUMS'),
      [...paths, 'MANIFEST.json'].map((p) => `${hash(p)}  ${p}`).join('\n') + '\n',
    );
  sum();
  return { dir, manifest, sum };
}
test('release verification covers manifest metadata, checksum list and every required asset', () => {
  const { dir, manifest, sum } = releaseFixture();
  assert.doesNotThrow(() => verifyReleaseFiles(dir, '0.3.0'));
  writeFileSync(join(dir, 'SHA256SUMS'), 'corrupt');
  assert.throws(() => verifyReleaseFiles(dir, '0.3.0'));
  sum();
  manifest.version = '0.4.0';
  writeFileSync(join(dir, 'MANIFEST.json'), JSON.stringify(manifest));
  sum();
  assert.throws(() => verifyReleaseFiles(dir, '0.3.0'));
  manifest.version = '0.3.0';
  manifest.baseEngineVersion = '99';
  writeFileSync(join(dir, 'MANIFEST.json'), JSON.stringify(manifest));
  sum();
  assert.throws(() => verifyReleaseFiles(dir, '0.3.0'));
  manifest.baseEngineVersion = '0.1.0';
  manifest.assets.pop();
  writeFileSync(join(dir, 'MANIFEST.json'), JSON.stringify(manifest));
  sum();
  assert.throws(() => verifyReleaseFiles(dir, '0.3.0'));
});

test('v0.4 release requires its case SDK and independently downloadable dataset', () => {
  const { dir } = releaseFixture('0.4.0');
  assert.doesNotThrow(() => verifyReleaseFiles(dir, '0.4.0'));
});

test('candidate build status remains truthful after distribution', () => {
  const { dir, manifest, sum } = releaseFixture('0.4.0');
  manifest.status = 'release-candidate';
  writeFileSync(join(dir, 'MANIFEST.json'), JSON.stringify(manifest));
  sum();
  assert.doesNotThrow(() => verifyReleaseFiles(dir, '0.4.0'));
});

test('source inventory includes staged additions and excludes untracked research drafts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qimen-source-list-'));
  execFileSync('git', ['init', '--quiet'], { cwd: dir });
  mkdirSync(join(dir, 'docs'));
  writeFileSync(join(dir, 'README.md'), 'Public project');
  writeFileSync(join(dir, 'docs/staged.md'), 'Reviewed new documentation');
  execFileSync('git', ['add', '--', 'README.md', 'docs/staged.md'], { cwd: dir });
  writeFileSync(join(dir, 'docs/research-draft.md'), 'Unreviewed draft');
  assert.deepEqual(releaseChecks.collectPublicSourcePaths(dir), ['README.md', 'docs/staged.md']);
});

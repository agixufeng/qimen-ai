import { execFileSync } from 'node:child_process';

const ROOT_FILES = new Set([
  '.gitignore',
  'AGENTS.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'DATA-LICENSE',
  'LICENSE',
  'README.md',
  'README.en.md',
  'package.json',
  'package-lock.json',
  'playwright.config.ts',
  'tsconfig.json',
]);
const ROOT_DIRS = new Set([
  '.github',
  'apps',
  'packages',
  'tests',
  'docs',
  'fixtures',
  'scripts',
  'skills',
]);
export function validatePublicPaths(paths) {
  for (const path of paths) {
    const parts = path.split('/');
    if (
      !path ||
      path.includes('\\') ||
      path.startsWith('apps/web/public/cases/') ||
      parts.some(
        (p) =>
          !p ||
          p === '..' ||
          p === '.' ||
          ['node_modules', 'dist', '.local', '.git', 'test-results', 'playwright-report'].includes(
            p,
          ) ||
          p.startsWith('.env'),
      ) ||
      !(parts.length === 1 ? ROOT_FILES.has(path) : ROOT_DIRS.has(parts[0]))
    ) {
      throw new Error(`Not a public source file: ${path}`);
    }
  }
}
export function collectPublicSourcePaths(root) {
  const paths = [
    ...new Set(
      execFileSync('git', ['ls-files', '--cached', '-z'], {
        cwd: root,
        encoding: 'utf8',
      })
        .split('\0')
        .filter(Boolean),
    ),
  ].sort();
  validatePublicPaths(paths);
  return paths;
}

export function assertPublicText(path, text) {
  if (
    /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{22,}|sk-[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|\/Users\/xf(?:\/|\b))/.test(
      text,
    )
  )
    throw new Error(`Public-source scan requires review: ${path}`);
}

import { readFileSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

// Read raw headers: macOS tar's normal listing can hide AppleDouble entries.
export function assertArchiveMetadataFree(bytes) {
  const tar = gunzipSync(bytes);
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const field = (start, length) =>
      header
        .subarray(start, start + length)
        .toString('utf8')
        .split('\0')[0];
    const name = [field(345, 155), field(0, 100)].filter(Boolean).join('/');
    const rawSize = field(124, 12).trim();
    if (!/^[0-7]+$/.test(rawSize)) throw new Error('Invalid archive size header.');
    const size = Number.parseInt(rawSize, 8);
    const end = offset + 512 + size;
    if (!Number.isSafeInteger(size) || end > tar.length) throw new Error('Truncated archive.');
    const type = field(156, 1);
    const metadata = ['x', 'g', 'L'].includes(type)
      ? tar.subarray(offset + 512, end).toString('utf8')
      : '';
    if (
      name.split('/').some((part) => part.startsWith('._')) ||
      /(?:SCHILY|LIBARCHIVE)\.xattr\.|(?:^|\n)\d+ path=(?:[^\n]*\/)?\._/.test(metadata) ||
      (type === 'L' && /(^|\/)\._/.test(metadata))
    ) {
      throw new Error('Archive contains platform metadata.');
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
}
export function verifyReleaseFiles(dir, version) {
  const manifest = JSON.parse(readFileSync(join(dir, 'MANIFEST.json'), 'utf8'));
  const expected = [
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
  if (
    !['0.3.0', '0.4.0'].includes(version) ||
    (version === '0.4.0' && manifest.datasetVersion !== 'study-v1') ||
    manifest.version !== version ||
    manifest.baseEngineVersion !== '0.1.0' ||
    manifest.annotationProfile !== 'shijia-common-annotations-v1/1.0.0' ||
    manifest.knowledgeVersion !== 'shenqi-first-dual-v1' ||
    manifest.node !== '>=22' ||
    !['release-candidate', 'local-candidate-not-published'].includes(manifest.status)
  )
    throw new Error('Release version/profile metadata mismatch.');
  if (
    !Array.isArray(manifest.assets) ||
    manifest.assets.length !== expected.length ||
    new Set(manifest.assets.map((a) => a.path)).size !== expected.length ||
    manifest.assets.some((a) => !expected.includes(a.path))
  )
    throw new Error('Release asset inventory mismatch.');
  const lines = readFileSync(join(dir, 'SHA256SUMS'), 'utf8').trimEnd().split('\n');
  const sums = new Map();
  for (const line of lines) {
    const m = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!m || ![...expected, 'MANIFEST.json'].includes(m[2]) || sums.has(m[2]))
      throw new Error('Invalid checksum inventory.');
    sums.set(m[2], m[1]);
  }
  if (sums.size !== expected.length + 1) throw new Error('Incomplete checksum inventory.');
  for (const path of [...expected, 'MANIFEST.json']) {
    const file = join(dir, path);
    if (!lstatSync(file).isFile()) throw new Error(`Non-regular release asset: ${path}`);
    const bytes = readFileSync(file),
      hash = createHash('sha256').update(bytes).digest('hex');
    if (hash !== sums.get(path)) throw new Error(`Release checksum mismatch: ${path}`);
    const declared = manifest.assets.find((a) => a.path === path);
    if (declared && (declared.sha256 !== hash || declared.bytes !== bytes.length))
      throw new Error(`Manifest asset mismatch: ${path}`);
  }
  const files = JSON.parse(readFileSync(join(dir, 'public-files.json'), 'utf8'));
  if (
    !Array.isArray(files) ||
    files.some((p) => typeof p !== 'string') ||
    files.length !== manifest.publicFileCount ||
    new Set(files).size !== files.length
  )
    throw new Error('Public source inventory mismatch.');
  validatePublicPaths(files);
  return manifest;
}

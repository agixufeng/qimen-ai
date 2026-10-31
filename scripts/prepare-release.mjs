import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, lstatSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  validatePublicPaths,
  assertPublicText,
  assertArchiveMetadataFree,
} from './release-lib.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const out = resolve(root, process.argv[2] || `.local/releases/v${pkg.version}`);
if (!out.startsWith(join(root, '.local') + '/') || existsSync(out))
  throw new Error('Choose a new, non-existing output directory under .local/.');
const files = [
  ...new Set(
    execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean),
  ),
].sort();
validatePublicPaths(files);
for (const path of files) {
  if (!lstatSync(join(root, path)).isFile())
    throw new Error(`Non-regular public source requires review: ${path}`);
  assertPublicText(path, readFileSync(join(root, path), 'utf8'));
}
if (!existsSync(join(root, 'apps/web/dist/index.html')))
  throw new Error('Build the website first.');
mkdirSync(join(out, 'packages'), { recursive: true });
const run = (cmd, args, cwd = root) =>
  execFileSync(cmd, cmd === 'tar' ? ['--no-xattrs', ...args] : args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...(cmd === 'tar' ? { COPYFILE_DISABLE: '1' } : {}) },
  });
const assets = [];
for (const name of ['core', 'knowledge', 'cases', 'cli']) {
  const packed = JSON.parse(
    run('npm', [
      'pack',
      '--workspace',
      `@qimen/${name}`,
      '--json',
      '--pack-destination',
      join(out, 'packages'),
    ]),
  );
  assets.push(join('packages', packed[0].filename));
}
run('tar', ['-czf', join(out, 'source.tar.gz'), '--', ...files]);
run('tar', ['-czf', join(out, 'website.tar.gz'), '-C', join(root, 'apps/web/dist'), '.']);
assets.push('source.tar.gz', 'website.tar.gz');
run('npm', ['run', 'data:check']);
run('tar', ['-czf', join(out, 'study-v1.tar.gz'), '-C', join(root, 'apps/web/public/cases'), '.']);
assets.push('study-v1.tar.gz');
for (const path of ['source.tar.gz', 'website.tar.gz', 'study-v1.tar.gz'])
  assertArchiveMetadataFree(readFileSync(join(out, path)));
writeFileSync(join(out, 'public-files.json'), JSON.stringify(files, null, 2) + '\n');
writeFileSync(join(out, 'RELEASE_NOTES.md'), readFileSync(join(root, 'docs/release-notes.md')));
assets.push('public-files.json', 'RELEASE_NOTES.md');
const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const manifest = {
  version: pkg.version,
  datasetVersion: 'study-v1',
  status: 'release-candidate',
  baseEngineVersion: '0.1.0',
  annotationProfile: 'shijia-common-annotations-v1/1.0.0',
  knowledgeVersion: 'shenqi-first-dual-v1',
  node: '>=22',
  publicFileCount: files.length,
  assets: assets.map((path) => ({
    path,
    bytes: lstatSync(join(out, path)).size,
    sha256: digest(join(out, path)),
  })),
};
writeFileSync(join(out, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
assets.push('MANIFEST.json');
writeFileSync(
  join(out, 'SHA256SUMS'),
  assets.map((path) => `${digest(join(out, path))}  ${path}`).join('\n') + '\n',
);
console.log(
  JSON.stringify(
    {
      output: relative(root, out),
      files: files.length,
      assets: assets.length,
      publication: 'not-executed',
    },
    null,
    2,
  ),
);

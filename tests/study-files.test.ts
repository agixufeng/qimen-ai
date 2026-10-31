import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertStudyDirectory, STUDY_FILES } from '../scripts/study-data-files.mjs';
test('generated study folder refuses unexpected files and links before build or packaging', () => {
  const root = mkdtempSync(join(tmpdir(), 'qimen-study-files-'));
  mkdirSync(join(root, 'chunks'));
  assert.doesNotThrow(() => assertStudyDirectory(root, false));
  assert.throws(() => assertStudyDirectory(root, true));
  for (const f of STUDY_FILES) writeFileSync(join(root, f), 'fixture');
  assert.doesNotThrow(() => assertStudyDirectory(root, true));
  writeFileSync(join(root, 'unexpected.txt'), 'unlisted');
  assert.throws(() => assertStudyDirectory(root, false));
  const syms = mkdtempSync(join(tmpdir(), 'qimen-study-link-'));
  symlinkSync(root, join(syms, 'chunks'), 'dir');
  assert.throws(() => assertStudyDirectory(syms, false));
});

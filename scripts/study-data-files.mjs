import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
export const STUDY_FILES = [
  'index.json',
  'manifest.json',
  'SHA256SUMS',
  'study-v1.jsonl.gz',
  ...Array.from({ length: 100 }, (_, n) => `chunks/${String(n).padStart(3, '0')}.json`),
];
export function assertStudyDirectory(dir, requireComplete = true) {
  if (!existsSync(dir)) {
    if (requireComplete) throw new Error('Dataset directory missing.');
    return;
  }
  if (!lstatSync(dir).isDirectory() || lstatSync(dir).isSymbolicLink())
    throw new Error('Dataset output must be a regular directory.');
  const found = new Set();
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry),
      stat = lstatSync(full);
    if (stat.isSymbolicLink()) throw new Error('Dataset symbolic links are not permitted.');
    if (entry === 'chunks' && stat.isDirectory()) {
      for (const file of readdirSync(full)) {
        const path = 'chunks/' + file,
          s = lstatSync(join(full, file));
        if (!s.isFile() || s.isSymbolicLink() || !STUDY_FILES.includes(path))
          throw new Error(`Unexpected dataset asset: ${path}`);
        found.add(path);
      }
    } else {
      if (!stat.isFile() || !STUDY_FILES.includes(entry))
        throw new Error(`Unexpected dataset asset: ${entry}`);
      found.add(entry);
    }
  }
  if (
    requireComplete &&
    (found.size !== STUDY_FILES.length || STUDY_FILES.some((f) => !found.has(f)))
  )
    throw new Error('Dataset file inventory incomplete.');
}

import fs from 'node:fs';
import path from 'node:path';

import { comparePaths, normalizePath } from './changed-files.js';

const EXCLUDED_SUFFIXES = ['.mock.ts', '.spec.ts', '.type.ts'] as const;

export const isMutableSource = (filePath: string): boolean => {
  const normalized = normalizePath(filePath);
  return (
    normalized.endsWith('.ts') &&
    EXCLUDED_SUFFIXES.every((suffix) => !normalized.endsWith(suffix))
  );
};

const directoryOf = (filePath: string): string => {
  const normalized = normalizePath(filePath);
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? '' : normalized.slice(0, slash);
};

const isCandidateDiffTarget = (
  filePath: string,
  touchedDirectories: ReadonlySet<string>
): boolean => {
  const isExcluded =
    filePath === 'src/index.ts' ||
    filePath.endsWith('/index.ts') ||
    (!filePath.startsWith('src/') && filePath !== 'src');
  return (
    !isExcluded &&
    isMutableSource(filePath) &&
    touchedDirectories.has(directoryOf(filePath))
  );
};

export const selectMutationTargets = (
  changedPaths: readonly string[],
  presentFiles: readonly string[]
): readonly string[] => {
  const present = new Set(presentFiles.map((file) => normalizePath(file)));
  const touchedDirectories = new Set<string>();
  for (const changedPath of changedPaths) {
    const normalized = normalizePath(changedPath);
    if (
      (normalized === 'src' || normalized.startsWith('src/')) &&
      present.has(normalized)
    ) {
      touchedDirectories.add(directoryOf(normalized));
    }
  }
  const targets: string[] = [];
  for (const candidate of present) {
    if (isCandidateDiffTarget(candidate, touchedDirectories)) {
      targets.push(candidate);
    }
  }
  targets.sort(comparePaths);
  return targets;
};

const scanDirectory = (
  directory: string,
  root: string,
  collected: string[]
): void => {
  if (!fs.existsSync(directory)) return;
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(full, root, collected);
    } else {
      const relative = path.relative(root, full).replaceAll('\\', '/');
      if (isMutableSource(relative)) {
        collected.push(relative);
      }
    }
  }
};

export const listAllMutableSources = (
  rootDirectory = process.cwd()
): readonly string[] => {
  const collected: string[] = [];
  scanDirectory(path.join(rootDirectory, 'src'), rootDirectory, collected);
  collected.sort(comparePaths);
  return collected;
};

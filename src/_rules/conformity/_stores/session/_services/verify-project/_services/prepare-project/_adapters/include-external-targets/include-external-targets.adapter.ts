import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import {
  CONFIG_FILE_NAME,
  LINTABLE_EXTENSIONS,
} from '../../../../../../../../../../_src@shared/_constants/faf.constant.js';
import { toPosixPath } from '../../../../../../_session@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function includeExternalTargets(
  inventory: TInventory,
  config: TFAFConfig,
  baseDirectory: string,
  origins?: readonly string[]
): TInventory {
  const skippedDirectoryNames: ReadonlySet<string> = new Set([
    'build',
    'coverage',
    'dist',
    'node_modules',
    'out',
    'reports',
    'tmp',
  ]);

  const items = [...inventory.items];
  const pathToId = new Map(inventory.pathToId);
  const realPathToId = new Map(inventory.realPathToId);

  const resolveTargetKind = (
    target: string
  ): null | {
    readonly absolute: string;
    readonly kind: 'directory' | 'file';
    readonly normalized: string;
  } => {
    const normalized = toPosixPath(target);
    if (pathToId.has(normalized)) {
      return null;
    }
    const absolute = nodePath.resolve(baseDirectory, normalized);
    const stats = nodeFs.statSync(absolute, { throwIfNoEntry: false });
    if (stats?.isDirectory() === true) {
      return { absolute, kind: 'directory', normalized };
    }
    if (stats?.isFile() === true) {
      return { absolute, kind: 'file', normalized };
    }
    return null;
  };

  const declaredOriginList =
    origins ??
    config.faf.locals.flatMap((local) => [
      ...(local.rootLayers ?? []),
      ...(local.rootFragments?.map((rootFragment) => rootFragment.path) ?? []),
    ]);

  const declaredOrigins = new Set(
    declaredOriginList.map((origin) => toPosixPath(origin))
  );

  const collectExternalCandidates = (): readonly string[] => {
    if (declaredOrigins.has('.') || !nodeFs.existsSync(baseDirectory)) {
      return [];
    }

    const readDirectory = (directory: string): readonly nodeFs.Dirent[] => {
      try {
        return nodeFs.readdirSync(directory, {
          withFileTypes: true,
        });
      } catch {
        return [];
      }
    };

    const candidates: string[] = [];
    const directoryQueue: string[] = [baseDirectory];

    const processDirent = (
      dirent: nodeFs.Dirent,
      currentDirectory: string
    ): void => {
      if (dirent.name.startsWith('.') || dirent.isSymbolicLink()) {
        return;
      }
      const fullPath = nodePath.join(currentDirectory, dirent.name);
      const relativePath = toPosixPath(
        nodePath.relative(baseDirectory, fullPath)
      );

      if (
        dirent.isDirectory() &&
        !skippedDirectoryNames.has(dirent.name) &&
        !declaredOrigins.has(relativePath)
      ) {
        directoryQueue.push(fullPath);
      }

      if (
        relativePath !== CONFIG_FILE_NAME &&
        dirent.isFile() &&
        LINTABLE_EXTENSIONS.some((extension) => dirent.name.endsWith(extension))
      ) {
        candidates.push(relativePath);
      }
    };

    for (const currentDirectory of directoryQueue) {
      for (const dirent of readDirectory(currentDirectory)) {
        processDirent(dirent, currentDirectory);
      }
    }

    candidates.sort(compareOrdinal);
    return candidates;
  };

  const sections = [
    config.faf.common?.externalDependencies,
    ...config.faf.locals.map((local) => local.externalDependencies),
  ];
  const targets = [
    ...sections.flatMap((section) => section ?? []).flatMap((edge) => edge.to),
    ...Object.values(config.faf.common?.aliases ?? {}),
    ...collectExternalCandidates(),
  ];

  for (const target of targets) {
    const resolved = resolveTargetKind(target);
    if (resolved === null) {
      continue;
    }
    const id = items.length;
    const isSymlink = nodeFs.lstatSync(resolved.absolute).isSymbolicLink();
    const item: TInventoryItem = {
      depth: 0,
      id,
      isSymlink,
      kind: resolved.kind,
      parentId: null,
      path: resolved.normalized,
      preorderEnd: id,
      preorderStart: id,
      realPath: nodeFs.realpathSync(resolved.absolute),
      treeOrigin: null,
    };
    items.push(item);
    pathToId.set(item.path, id);
    realPathToId.set(item.realPath, id);
  }

  return { items, pathToId, realPathToId };
}

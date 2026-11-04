import type { ICruiseResult } from 'dependency-cruiser';

import { cruise } from 'dependency-cruiser';

export type TCollectRelativeImportsResult =
  | {
      readonly collection: TRelativeImportCollection;
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    };

export type TRelativeImportCollection = {
  readonly edges: readonly TRelativeImportEdge[];
  readonly fragmentDirectories: readonly string[];
  readonly sources: readonly string[];
};

export type TRelativeImportEdge = {
  readonly from: string;
  readonly to: string;
};

const INDEX_FILE_NAME = 'index.ts';

const isCruiseResult = (output: unknown): output is ICruiseResult =>
  typeof output === 'object' &&
  output !== null &&
  'modules' in output &&
  Array.isArray(output.modules);

const toRelativePosix = (filePath: string, repositoryRoot: string): string => {
  const normalized = filePath.replaceAll('\\', '/');
  const normalizedRoot = repositoryRoot.replaceAll('\\', '/');
  const prefix = `${normalizedRoot}/`;
  return normalized.startsWith(prefix)
    ? normalized.slice(prefix.length)
    : normalized;
};

const fragmentDirectory = (source: string): string | undefined => {
  const suffix = `/${INDEX_FILE_NAME}`;
  return source.endsWith(suffix) ? source.slice(0, -suffix.length) : undefined;
};

export async function collectRelativeImports(
  repositoryRoot: string
): Promise<TCollectRelativeImportsResult> {
  const result = await cruise(['src'], {
    baseDir: repositoryRoot,
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '[.]d[.]ts$',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,
  });

  if (!isCruiseResult(result.output)) {
    return {
      ok: false,
      reason: 'dependency-cruiser did not return a module graph',
    };
  }

  const edges: TRelativeImportEdge[] = [];
  const fragmentDirectories: string[] = [];
  const sources: string[] = [];

  for (const sourceModule of result.output.modules) {
    const from = toRelativePosix(sourceModule.source, repositoryRoot);
    sources.push(from);
    const directory = fragmentDirectory(from);
    if (directory !== undefined) {
      fragmentDirectories.push(directory);
    }
    for (const dependency of sourceModule.dependencies) {
      if (!dependency.module.startsWith('.') || dependency.couldNotResolve) {
        continue;
      }
      edges.push({
        from,
        to: toRelativePosix(dependency.resolved, repositoryRoot),
      });
    }
  }

  return {
    collection: {
      edges,
      fragmentDirectories,
      sources,
    },
    ok: true,
  };
}

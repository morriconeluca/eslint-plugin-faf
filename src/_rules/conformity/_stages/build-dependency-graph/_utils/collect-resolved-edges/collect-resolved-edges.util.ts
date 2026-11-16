import type {
  TImportResolution,
  TLibraryImport,
  TModuleImport,
  TModuleRecord,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { TPendingEdge } from '../../_build-dependency-graph@shared/_types/pending-edge.type.js';

export function collectResolvedEdges(
  records: ReadonlyMap<string, TModuleRecord>,
  resolutions: ReadonlyMap<string, readonly TImportResolution[]>,
  paths: readonly string[],
  pathToVertex: ReadonlyMap<string, number>
): {
  readonly edges: readonly TPendingEdge[];
  readonly libraryImports: readonly TLibraryImport[];
} {
  const edges: TPendingEdge[] = [];
  const libraryImports: TLibraryImport[] = [];

  const appendResolvedImport = (
    sourcePath: string,
    sourceVertex: number,
    importIndex: number,
    importItem: TModuleImport,
    resolution: TImportResolution
  ): void => {
    if (importItem.specifier === null) {
      return;
    }
    const specifier = importItem.specifier;
    const shared = {
      aliasAlternatives: resolution.aliasAlternatives,
      aliasUsed: resolution.aliasUsed,
      importIndex,
      isTypeOnly: importItem.isTypeOnly,
      position: importItem.position,
      sourcePath,
      specifier,
      syntaxKind: importItem.kind,
    };
    if (resolution.target.type === 'external-library') {
      libraryImports.push({
        ...shared,
        packageName: resolution.target.packageName,
      });
      return;
    }
    if (resolution.target.type !== 'local-file') {
      return;
    }
    const destinationVertex = pathToVertex.get(resolution.target.path);
    if (destinationVertex === undefined) {
      return;
    }
    edges.push({
      destinationVertex,
      metadata: {
        ...shared,
        destinationPath: resolution.target.path,
      },
      sourceVertex,
    });
  };

  for (const [sourceVertex, sourcePath] of paths.entries()) {
    const record = records.get(sourcePath);
    const sourceResolutions = resolutions.get(sourcePath);
    if (record === undefined || sourceResolutions === undefined) {
      continue;
    }
    const resolutionsByIndex = new Map<number, TImportResolution>();
    for (const resolution of sourceResolutions) {
      resolutionsByIndex.set(resolution.importIndex, resolution);
    }
    for (const [importIndex, importItem] of record.imports.entries()) {
      const resolution = resolutionsByIndex.get(importIndex);
      if (resolution === undefined) {
        continue;
      }
      appendResolvedImport(
        sourcePath,
        sourceVertex,
        importIndex,
        importItem,
        resolution
      );
    }
  }

  return { edges, libraryImports };
}

import type {
  TModuleImport,
  TModuleRecord,
} from '../../../../../../_session@shared/_types/module-record.type.js';
import type {
  TImportResolution,
  TLibraryNote,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TPendingEdge } from '../../_build-dependency-graph@shared/_types/pending-edge.type.js';

export function collectResolvedArcs(
  records: ReadonlyMap<string, TModuleRecord>,
  resolutions: ReadonlyMap<string, readonly TImportResolution[]>,
  paths: readonly string[],
  pathToVertex: ReadonlyMap<string, number>
): {
  readonly edges: readonly TPendingEdge[];
  readonly libraryNotes: readonly TLibraryNote[];
} {
  const edges: TPendingEdge[] = [];
  const libraryNotes: TLibraryNote[] = [];

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
      libraryNotes.push({
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

  return { edges, libraryNotes };
}

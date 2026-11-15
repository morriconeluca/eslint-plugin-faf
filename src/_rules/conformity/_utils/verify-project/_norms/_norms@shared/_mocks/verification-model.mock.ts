import type {
  TImportResolution,
  TItemClassification,
  TModuleRecord,
  TVerificationModel,
} from '../../../_verify-project@shared/_types/verification-model.type.js';

export function verificationModel(): TVerificationModel {
  return {
    basis: {
      aliases: [],
      baseDirectory: '/project',
      configPath: '/project/faf.config.ts',
      declarations: {
        aliases: [],
        baseDirectory: '/project',
        trees: [],
      },
      inventory: {
        items: [],
        pathToId: new Map<string, number>(),
        realPathToId: new Map<string, number>(),
      },
      inventoryOutcomes: [],
      kind: 'ready',
      loadedFiles: [],
    },
    crossings: [],
    graph: {
      columnTargets: new Int32Array(0),
      edgeCount: 0,
      edgeMetadata: [],
      edgesBySourcePath: new Map<string, readonly number[]>(),
      libraryImports: [],
      libraryImportsBySourcePath: new Map<string, readonly number[]>(),
      pathToVertex: new Map<string, number>(),
      rowOffsets: new Int32Array([0]),
      vertexCount: 0,
      vertexNatures: [],
      vertexToPath: [],
    },
    hierarchies: { conflicts: [], sets: [] },
    modules: {
      records: new Map<string, TModuleRecord>(),
      resolutions: new Map<string, readonly TImportResolution[]>(),
      unverifiedOutcomes: [],
    },
    surface: { trees: [] },
    taxonomy: {
      byItemId: new Map<number, TItemClassification>(),
      byPath: new Map<string, TItemClassification>(),
      classifications: [],
    },
  };
}

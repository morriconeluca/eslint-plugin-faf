import type { TModuleRecord } from '../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../_types/_compounds/classification.type.js';
import type { TImportResolution } from '../_types/_compounds/dependency-graph.type.js';
import type { TVerificationModel } from '../_types/_systems/verification-model.type.js';

export function verificationModel(): TVerificationModel {
  return {
    basis: {
      aliases: [],
      baseDirectory: '/project',
      configPath: '/project/fafconfig.ts',
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
    graph: {
      columnTargets: new Int32Array(0),
      edgeCount: 0,
      edgeMetadata: [],
      pathToVertex: new Map<string, number>(),
      rowOffsets: new Int32Array([0]),
      vertexCount: 0,
      vertexToPath: [],
    },
    hierarchies: { sets: [] },
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

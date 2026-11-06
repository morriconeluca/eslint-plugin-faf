import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleRecord,
  TRootSymbol,
} from '../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { checkMasterExport } from './check-master-export.util.js';

const makeClassification = (path: string): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 1,
  nodeKind: 'access-node',
  path,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'absent', roleName: null },
});

const makeRecord = (
  symbols: readonly TRootSymbol[],
  exports: readonly TModuleExport[],
  language: 'binary' | 'script' | 'style' = 'script'
): TModuleRecord => ({
  exports,
  imports: [],
  language,
  symbols,
  unsupportedSyntaxes: [],
});

const makeGraph = (
  edges: readonly TEdgeMetadata[],
  sourcePath: string
): TDependencyGraph => ({
  columnTargets: new Int32Array(0),
  edgeCount: edges.length,
  edgeMetadata: edges,
  edgesBySourcePath: new Map([[sourcePath, edges.map((_, index) => index)]]),
  libraryNotes: [],
  libraryNotesBySourcePath: new Map(),
  pathToVertex: new Map(),
  rowOffsets: new Int32Array([0]),
  vertexCount: 0,
  vertexNatures: [],
  vertexToPath: [],
});

describe('checkMasterExport', () => {
  const accessClass = makeClassification('src/_components/button/index.ts');
  const masterClass = makeClassification(
    'src/_components/button/button.component.ts'
  );

  it('returns undefined when master classification or master record is missing or non-script', () => {
    const accessRec = makeRecord([], []);
    const graph = makeGraph([], accessClass.path);

    const validMaster = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      []
    );
    expect(
      checkMasterExport(accessClass, accessRec, undefined, validMaster, graph)
    ).toBeUndefined();

    expect(
      checkMasterExport(accessClass, accessRec, masterClass, undefined, graph)
    ).toBeUndefined();

    const binaryMaster = makeRecord([], [], 'binary');
    expect(
      checkMasterExport(
        accessClass,
        accessRec,
        masterClass,
        binaryMaster,
        graph
      )
    ).toBeUndefined();

    const styleMaster = makeRecord([], [], 'style');
    expect(
      checkMasterExport(accessClass, accessRec, masterClass, styleMaster, graph)
    ).toBeUndefined();
  });

  it('returns outcome when Master is not re-exported', () => {
    const accessRec = makeRecord([], []);
    const masterRec = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'Button',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );
    const graph = makeGraph([], accessClass.path);

    const outcome = checkMasterExport(
      accessClass,
      accessRec,
      masterClass,
      masterRec,
      graph
    );
    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('symbol/access-node-master-export');

    const edge: TEdgeMetadata = {
      aliasAlternatives: [],
      aliasUsed: null,
      destinationPath: masterClass.path,
      importIndex: 0,
      isTypeOnly: false,
      position: { column: 1, line: 1 },
      sourcePath: accessClass.path,
      specifier: './button.component.js',
      syntaxKind: 'export-all-from',
    };
    const accessRecWithReExport = makeRecord(
      [],
      [
        {
          exportedName: '*',
          isTypeOnly: false,
          origin: { specifier: './button.component.js', type: 'export-all' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const graphWithoutPath = makeGraph([edge], 'other-source');
    const outcomeWithoutEdges = checkMasterExport(
      accessClass,
      accessRecWithReExport,
      masterClass,
      masterRec,
      graphWithoutPath
    );
    expect(outcomeWithoutEdges?.constraint).toBe(
      'symbol/access-node-master-export'
    );

    const graphWithInvalidEdge: TDependencyGraph = {
      ...graph,
      edgesBySourcePath: new Map([[accessClass.path, [999]]]),
    };
    const outcomeWithInvalidEdge = checkMasterExport(
      accessClass,
      accessRec,
      masterClass,
      masterRec,
      graphWithInvalidEdge
    );
    expect(outcomeWithInvalidEdge?.constraint).toBe(
      'symbol/access-node-master-export'
    );
  });
});

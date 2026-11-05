import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../_session@shared/_types/module-record.type.js';
import type { TModuleCollection } from '../../_verify-project@shared/_types/_aggregates/module-collection.type.js';
import type { TProjectBasis } from '../../_verify-project@shared/_types/_aggregates/project-basis.type.js';
import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TImportResolution } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { buildDependencyGraph } from './index.js';

const TREE_SOURCE = 'src/app.ts';
const TREE_TARGET = 'src/widget.util.ts';
const EXTERNAL_TARGET = 'legacy/outside.ts';
const ISOLATED = 'src/alone.ts';
const SPECIFIER = './widget.util.js';
const ALIAS_SPECIFIER = '#src/widget.util.js';

const emptyRecord = (): TModuleRecord => ({
  exports: [],
  imports: [],
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
});

const fileItem = (
  path: string,
  id: number,
  treeOrigin: null | string
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'file',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin,
});

const basisOf = (items: readonly TInventoryItem[]): TProjectBasis => {
  const indexed: TInventoryItem[] = [];
  for (const item of items) {
    indexed[item.id] = item;
  }
  const inventory: TInventory = {
    items: indexed,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  };
  return {
    ...verificationModel().basis,
    inventory,
  };
};

const taxonomy = (): TTaxonomyModel => ({
  byItemId: new Map<number, TItemClassification>(),
  byPath: new Map<string, TItemClassification>(),
  classifications: [],
});

const resolution = (
  sourcePath: string,
  importIndex: number,
  target: TImportResolution['target'],
  aliasUsed: null | string = null
): TImportResolution => ({
  aliasAlternatives: aliasUsed === null ? [] : ['src', 'alt'],
  aliasUsed,
  importIndex,
  sourcePath,
  target,
});

const reverseEntries = <T>(
  entries: readonly (readonly [string, T])[]
): (readonly [string, T])[] => {
  const reversed: (readonly [string, T])[] = [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry !== undefined) {
      reversed.push(entry);
    }
  }
  return reversed;
};

const collection = (
  records: ReadonlyMap<string, TModuleRecord>,
  resolutions: ReadonlyMap<string, readonly TImportResolution[]>
): TModuleCollection => ({
  records,
  resolutions,
  unverifiedOutcomes: [],
});

describe('buildDependencyGraph', () => {
  it('returns no outcomes and an empty graph when nothing was analyzed', () => {
    const model = verificationModel();
    const result = buildDependencyGraph(
      model.basis,
      model.taxonomy,
      model.modules
    );

    expect(result.outcomes).toEqual([]);
    expect(result.graph.vertexCount).toBe(0);
    expect(result.graph.edgeCount).toBe(0);
    expect([...result.graph.rowOffsets]).toEqual([0]);
    expect(result.graph.libraryNotes).toEqual([]);
  });

  it('records tree edges, external-file edges, type-only imports, aliases, and isolated vertices', () => {
    const sourceRecord: TModuleRecord = {
      ...emptyRecord(),
      imports: [
        {
          isTypeOnly: false,
          kind: 'named-import',
          position: { column: 1, line: 2 },
          specifier: SPECIFIER,
        },
        {
          isTypeOnly: false,
          kind: 'named-import',
          position: { column: 1, line: 3 },
          specifier: SPECIFIER,
        },
        {
          isTypeOnly: true,
          kind: 'type-only-import',
          position: { column: 5, line: 4 },
          specifier: ALIAS_SPECIFIER,
        },
        {
          isTypeOnly: false,
          kind: 'side-effect-import',
          position: { column: 1, line: 5 },
          specifier: 'react',
        },
        {
          isTypeOnly: false,
          kind: 'named-import',
          position: { column: 1, line: 6 },
          specifier: './missing.js',
        },
        {
          isTypeOnly: false,
          kind: 'css-url',
          position: { column: 2, line: 7 },
          specifier: './outside.css',
        },
      ],
    };
    const records = new Map<string, TModuleRecord>([
      [ISOLATED, emptyRecord()],
      [TREE_SOURCE, sourceRecord],
    ]);
    const resolutions = new Map<string, readonly TImportResolution[]>([
      [
        TREE_SOURCE,
        [
          resolution(TREE_SOURCE, 0, {
            path: TREE_TARGET,
            type: 'local-file',
          }),
          resolution(TREE_SOURCE, 1, {
            path: TREE_TARGET,
            type: 'local-file',
          }),
          resolution(
            TREE_SOURCE,
            2,
            { path: TREE_TARGET, type: 'local-file' },
            '#src'
          ),
          resolution(TREE_SOURCE, 3, {
            packageName: 'react',
            type: 'external-library',
          }),
          resolution(TREE_SOURCE, 4, {
            reason: 'missing',
            type: 'unresolved',
          }),
          resolution(TREE_SOURCE, 5, {
            path: EXTERNAL_TARGET,
            type: 'local-file',
          }),
        ],
      ],
    ]);
    const basis = basisOf([
      fileItem(TREE_SOURCE, 3, 'src'),
      fileItem(TREE_TARGET, 8, 'src'),
      fileItem(ISOLATED, 1, 'src'),
      fileItem(EXTERNAL_TARGET, 11, null),
    ]);

    const result = buildDependencyGraph(
      basis,
      taxonomy(),
      collection(records, resolutions)
    );
    const { graph } = result;
    const sourceVertex = graph.pathToVertex.get(TREE_SOURCE);
    const targetVertex = graph.pathToVertex.get(TREE_TARGET);
    const externalVertex = graph.pathToVertex.get(EXTERNAL_TARGET);
    const isolatedVertex = graph.pathToVertex.get(ISOLATED);

    expect(result.outcomes).toEqual([]);
    expect(graph.vertexToPath).toEqual([
      EXTERNAL_TARGET,
      ISOLATED,
      TREE_SOURCE,
      TREE_TARGET,
    ]);
    expect(
      graph.vertexNatures[graph.pathToVertex.get(TREE_TARGET) ?? -1]
    ).toEqual({ inventoryId: 8, kind: 'tree-node' });
    expect(graph.vertexNatures[externalVertex ?? -1]).toEqual({
      kind: 'external-local-file',
    });
    expect(graph.pathToVertex.has('react')).toBe(false);
    expect(sourceVertex).toBe(2);
    expect(targetVertex).toBe(3);
    expect(isolatedVertex).toBe(1);
    expect(graph.edgesBySourcePath.get(ISOLATED)).toEqual([]);
    expect(graph.edgesBySourcePath.get(TREE_SOURCE)).toEqual([0, 1, 2, 3]);
    expect(
      graph.edgesBySourcePath.get(TREE_SOURCE)?.map((index) => {
        const metadata = graph.edgeMetadata[index];
        return {
          destination: graph.columnTargets[index],
          isTypeOnly: metadata?.isTypeOnly,
          specifier: metadata?.specifier,
          syntaxKind: metadata?.syntaxKind,
        };
      })
    ).toEqual([
      {
        destination: targetVertex,
        isTypeOnly: false,
        specifier: SPECIFIER,
        syntaxKind: 'named-import',
      },
      {
        destination: targetVertex,
        isTypeOnly: false,
        specifier: SPECIFIER,
        syntaxKind: 'named-import',
      },
      {
        destination: targetVertex,
        isTypeOnly: true,
        specifier: ALIAS_SPECIFIER,
        syntaxKind: 'type-only-import',
      },
      {
        destination: externalVertex,
        isTypeOnly: false,
        specifier: './outside.css',
        syntaxKind: 'css-url',
      },
    ]);
    expect(graph.edgeMetadata[2]?.aliasUsed).toBe('#src');
    expect(graph.edgeMetadata[2]?.aliasAlternatives).toEqual(['src', 'alt']);
    expect(graph.edgeMetadata[0]?.position).toEqual({ column: 1, line: 2 });
    expect(graph.edgeMetadata[1]?.position).toEqual({ column: 1, line: 3 });
    expect(graph.libraryNotes).toEqual([
      {
        aliasAlternatives: [],
        aliasUsed: null,
        importIndex: 3,
        isTypeOnly: false,
        packageName: 'react',
        position: { column: 1, line: 5 },
        sourcePath: TREE_SOURCE,
        specifier: 'react',
        syntaxKind: 'side-effect-import',
      },
    ]);
    expect(graph.libraryNotesBySourcePath.get(TREE_SOURCE)).toEqual([0]);
    expect([...graph.rowOffsets]).toEqual([0, 0, 0, 4, 4]);
  });

  it('is deterministic with respect to record and resolution insertion order', () => {
    const sourceRecord: TModuleRecord = {
      ...emptyRecord(),
      imports: [
        {
          isTypeOnly: false,
          kind: 'require-call',
          position: { column: 1, line: 1 },
          specifier: 'left-pad',
        },
      ],
    };
    const targetRecord: TModuleRecord = {
      ...emptyRecord(),
      imports: [
        {
          isTypeOnly: false,
          kind: 'named-import',
          position: { column: 2, line: 9 },
          specifier: './app.js',
        },
      ],
    };
    const recordPairs: readonly (readonly [string, TModuleRecord])[] = [
      [TREE_SOURCE, sourceRecord],
      [TREE_TARGET, targetRecord],
    ];
    const targetResolution = resolution(TREE_TARGET, 0, {
      path: TREE_SOURCE,
      type: 'local-file',
    });
    const sourceResolution = resolution(TREE_SOURCE, 0, {
      packageName: 'left-pad',
      type: 'external-library',
    });
    const resolutionPairs: readonly (readonly [
      string,
      readonly TImportResolution[],
    ])[] = [
      [TREE_SOURCE, [sourceResolution]],
      [TREE_TARGET, [targetResolution]],
    ];
    const forwardRecords = new Map(recordPairs);
    const reverseRecords = new Map(reverseEntries(recordPairs));
    const forwardResolutions = new Map(resolutionPairs);
    const reverseResolutions = new Map(reverseEntries(resolutionPairs));
    const basis = basisOf([
      fileItem(TREE_SOURCE, 2, 'src'),
      fileItem(TREE_TARGET, 5, 'src'),
    ]);
    const forward = buildDependencyGraph(
      basis,
      taxonomy(),
      collection(forwardRecords, forwardResolutions)
    );
    const reverse = buildDependencyGraph(
      basis,
      taxonomy(),
      collection(reverseRecords, reverseResolutions)
    );

    expect(forward.graph).toEqual(reverse.graph);
    expect(forward.outcomes).toEqual(reverse.outcomes);
  });
});

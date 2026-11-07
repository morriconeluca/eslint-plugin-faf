import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
  TLibraryNote,
} from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyForeignNodeIsolation } from './foreign-node-isolation.norm.js';

const buildClassification = (
  path: string,
  nodeKind: null | TNodeKind
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 1,
  nodeKind,
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

const buildTaxonomy = (
  entries: readonly (readonly [string, null | TNodeKind])[]
): TTaxonomyModel => {
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  for (const [path, nodeKind] of entries) {
    const classification = buildClassification(path, nodeKind);
    byPath.set(path, classification);
    classifications.push(classification);
  }

  return { byItemId, byPath, classifications };
};

const createEdge = (
  sourcePath: string,
  destinationPath: string,
  specifier = './target.js',
  importIndex = 0,
  syntaxKind: TEdgeMetadata['syntaxKind'] = 'side-effect-import'
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex,
  isTypeOnly: false,
  position: { column: 1, line: importIndex + 1 },
  sourcePath,
  specifier,
  syntaxKind,
});

const createLibraryNote = (
  packageName: string,
  specifier: string
): TLibraryNote => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex: 0,
  isTypeOnly: false,
  packageName,
  position: { column: 1, line: 1 },
  sourcePath: 'src/foreign.ts',
  specifier,
  syntaxKind: 'side-effect-import',
});

const buildModel = (
  taxonomyEntries: readonly (readonly [string, null | TNodeKind])[],
  edges: readonly TEdgeMetadata[],
  libraryNotes: readonly TLibraryNote[] = []
): TVerificationModel => {
  const base = verificationModel();
  const taxonomy = buildTaxonomy(taxonomyEntries);
  const graph: TDependencyGraph = {
    ...base.graph,
    edgeCount: edges.length,
    edgeMetadata: edges,
    libraryNotes,
  };

  return {
    ...base,
    graph,
    taxonomy,
  };
};

describe('verifyForeignNodeIsolation', () => {
  describe('table of prohibited import relations with codebase files', () => {
    it.each([
      [
        'Foreign Node imports Logical Node of same Tree',
        'src/foreign.ts',
        'src/main.ts',
        './main.js',
        'foreign-node' as const,
        'root-node' as const,
        'side-effect-import' as const,
      ],
      [
        'Foreign Node imports Logical Node exposed by another Tree',
        'src/foreign.ts',
        'other/main.ts',
        '../other/main.js',
        'foreign-node' as const,
        'root-node' as const,
        'side-effect-import' as const,
      ],
      [
        'Foreign Node imports another Foreign Node',
        'src/foreign.ts',
        'src/vitest-setup.ts',
        './vitest-setup.js',
        'foreign-node' as const,
        'foreign-node' as const,
        'side-effect-import' as const,
      ],
      [
        'Foreign Node imports local file external to all Trees',
        'src/foreign.ts',
        'external.ts',
        '../external.js',
        'foreign-node' as const,
        null,
        'side-effect-import' as const,
      ],
      [
        'Logical Node imports Foreign Node',
        'src/main.ts',
        'src/foreign.ts',
        './foreign.js',
        'root-node' as const,
        'foreign-node' as const,
        'side-effect-import' as const,
      ],
      [
        'Logical Node re-exports from Foreign Node',
        'src/main.ts',
        'src/foreign.ts',
        './foreign.js',
        'root-node' as const,
        'foreign-node' as const,
        'export-named-from' as const,
      ],
      [
        'Local file external to Trees imports Foreign Node',
        'external.ts',
        'src/foreign.ts',
        './src/foreign.js',
        null,
        'foreign-node' as const,
        'side-effect-import' as const,
      ],
      [
        'Foreign Node re-exports Symbol from codebase file',
        'src/foreign.ts',
        'src/main.ts',
        './main.js',
        'foreign-node' as const,
        'root-node' as const,
        'export-named-from' as const,
      ],
    ])(
      'reports violation for: %s',
      (
        _description,
        sourcePath,
        destinationPath,
        specifier,
        sourceKind,
        destinationKind,
        syntaxKind
      ) => {
        const taxonomyEntries = [
          [sourcePath, sourceKind],
          [destinationPath, destinationKind],
        ] as const;
        const edge = createEdge(
          sourcePath,
          destinationPath,
          specifier,
          0,
          syntaxKind
        );
        const model = buildModel(taxonomyEntries, [edge]);
        const outcomes = verifyForeignNodeIsolation(model);

        expect(outcomes).toHaveLength(1);
        expect(outcomes[0]).toEqual({
          constraint: 'dependency/foreign-node-isolation',
          element: sourcePath,
          family: 'dependency',
          from: sourcePath,
          importIndex: 0,
          message: `'${sourcePath}' imports '${destinationPath}' through '${specifier}': a Foreign Node has no import relation with codebase files`,
          normativeReference: 'FAF §4, §6.7',
          position: { column: 1, line: 1 },
          specifier,
          to: destinationPath,
        });
      }
    );
  });

  describe('allowed contents without codebase relations', () => {
    it('ignores edges between non-foreign codebase files', () => {
      const edge = createEdge('src/main.ts', 'src/widget.ts', './widget.js', 0);
      const model = buildModel(
        [
          ['src/main.ts', 'root-node'],
          ['src/widget.ts', 'master-node'],
        ],
        [edge]
      );
      expect(verifyForeignNodeIsolation(model)).toEqual([]);
    });

    it.each([
      ['ambient declarations', 'src/foreign.d.ts'],
      ['empty export', 'src/foreign.ts'],
      ['local Symbols', 'src/foreign.ts'],
    ] as const)(
      'emits no outcomes when Foreign Node contains %s',
      (_description, path) => {
        const model = buildModel([[path, 'foreign-node']], []);
        expect(verifyForeignNodeIsolation(model)).toEqual([]);
      }
    );

    it.each([
      ['importing external library package', 'node:fs'],
      ['re-exporting from external library package', 'node:path'],
    ] as const)(
      'emits no outcomes when Foreign Node connects to %s',
      (_description, target) => {
        const libraryNote = createLibraryNote(target, target);
        const model = buildModel(
          [['src/foreign.ts', 'foreign-node']],
          [],
          [libraryNote]
        );
        expect(verifyForeignNodeIsolation(model)).toEqual([]);
      }
    );
  });

  describe('example files designated Foreign', () => {
    it.each([
      'src/globals.d.ts',
      'src/vite-env.d.ts',
      'src/vitest-setup.ts',
    ] as const)(
      'reports violation when example file %s imports codebase file',
      (foreignFile) => {
        const destination = 'src/main.ts';
        const specifier = './main.js';
        const edge = createEdge(foreignFile, destination, specifier, 0);
        const model = buildModel(
          [
            [foreignFile, 'foreign-node'],
            [destination, 'root-node'],
          ],
          [edge]
        );
        const outcomes = verifyForeignNodeIsolation(model);

        expect(outcomes).toHaveLength(1);
        expect(outcomes[0]).toEqual({
          constraint: 'dependency/foreign-node-isolation',
          element: foreignFile,
          family: 'dependency',
          from: foreignFile,
          importIndex: 0,
          message: `'${foreignFile}' imports '${destination}' through '${specifier}': a Foreign Node has no import relation with codebase files`,
          normativeReference: 'FAF §4, §6.7',
          position: { column: 1, line: 1 },
          specifier,
          to: destination,
        });
      }
    );
  });

  describe('determinism and immutability', () => {
    it('produces identical outcome order regardless of input edge permutation', () => {
      const edgeA = createEdge(
        'src/a-foreign.ts',
        'src/main.ts',
        './main.js',
        0
      );
      const edgeB = createEdge(
        'src/z-foreign.ts',
        'src/main.ts',
        './main.js',
        0
      );
      const edgeC = createEdge('src/main.ts', 'src/a-foreign.ts', './a.js', 1);

      const taxonomy = [
        ['src/a-foreign.ts', 'foreign-node' as const],
        ['src/z-foreign.ts', 'foreign-node' as const],
        ['src/main.ts', 'root-node' as const],
      ] as const;

      const modelForward = buildModel(taxonomy, [edgeA, edgeB, edgeC]);
      const modelReverse = buildModel(taxonomy, [edgeC, edgeB, edgeA]);
      const modelShuffled = buildModel(taxonomy, [edgeB, edgeA, edgeC]);

      const outcomesForward = verifyForeignNodeIsolation(modelForward);
      const outcomesReverse = verifyForeignNodeIsolation(modelReverse);
      const outcomesShuffled = verifyForeignNodeIsolation(modelShuffled);

      expect(outcomesForward).toHaveLength(3);
      expect(outcomesReverse).toEqual(outcomesForward);
      expect(outcomesShuffled).toEqual(outcomesForward);
    });

    it('does not mutate the verification model', () => {
      const edge = createEdge('src/foreign.ts', 'src/main.ts', './main.js', 0);
      const model = buildModel(
        [
          ['src/foreign.ts', 'foreign-node'],
          ['src/main.ts', 'root-node'],
        ],
        [edge]
      );

      const edgesSnapshot = [...model.graph.edgeMetadata];
      const classificationsSnapshot = [...model.taxonomy.classifications];

      verifyForeignNodeIsolation(model);

      expect(model.graph.edgeMetadata).toEqual(edgesSnapshot);
      expect(model.taxonomy.classifications).toEqual(classificationsSnapshot);
    });
  });
});

import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { checkEdgeIsolation } from './index.js';

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
  importIndex = 0
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex,
  isTypeOnly: false,
  position: { column: 3, line: 2 },
  sourcePath,
  specifier,
  syntaxKind: 'side-effect-import',
});

describe('checkEdgeIsolation', () => {
  it('returns undefined when neither source nor destination is foreign', () => {
    const taxonomy = buildTaxonomy([
      ['src/main.ts', 'root-node'],
      ['src/widget.ts', 'master-node'],
    ]);
    const edge = createEdge('src/main.ts', 'src/widget.ts');
    expect(checkEdgeIsolation(edge, taxonomy)).toBeUndefined();
  });

  it('returns undefined when endpoints are absent from taxonomy', () => {
    const taxonomy = buildTaxonomy([]);
    const edge = createEdge('external.ts', 'other-external.ts');
    expect(checkEdgeIsolation(edge, taxonomy)).toBeUndefined();
  });

  it('returns an outcome when only source is a foreign node', () => {
    const taxonomy = buildTaxonomy([
      ['src/notes.md', 'foreign-node'],
      ['src/main.ts', 'root-node'],
    ]);
    const edge = createEdge('src/notes.md', 'src/main.ts', './main.js', 1);
    const result = checkEdgeIsolation(edge, taxonomy);

    expect(result).toEqual({
      constraint: 'dependency/foreign-node-isolation',
      element: 'src/notes.md',
      family: 'dependency',
      from: 'src/notes.md',
      importIndex: 1,
      message:
        "'src/notes.md' imports 'src/main.ts' through './main.js': a Foreign Node has no import relation with codebase files",
      normativeReference: 'FAF §4, §6.7',
      position: { column: 3, line: 2 },
      specifier: './main.js',
      to: 'src/main.ts',
    });
  });

  it('returns an outcome when only destination is a foreign node', () => {
    const taxonomy = buildTaxonomy([
      ['src/main.ts', 'root-node'],
      ['src/notes.md', 'foreign-node'],
    ]);
    const edge = createEdge('src/main.ts', 'src/notes.md', './notes.js', 0);
    const result = checkEdgeIsolation(edge, taxonomy);

    expect(result).toEqual({
      constraint: 'dependency/foreign-node-isolation',
      element: 'src/main.ts',
      family: 'dependency',
      from: 'src/main.ts',
      importIndex: 0,
      message:
        "'src/main.ts' imports 'src/notes.md' through './notes.js': a Foreign Node has no import relation with codebase files",
      normativeReference: 'FAF §4, §6.7',
      position: { column: 3, line: 2 },
      specifier: './notes.js',
      to: 'src/notes.md',
    });
  });

  it('returns an outcome when both source and destination are foreign nodes', () => {
    const taxonomy = buildTaxonomy([
      ['src/notes.md', 'foreign-node'],
      ['src/helpers.md', 'foreign-node'],
    ]);
    const edge = createEdge('src/notes.md', 'src/helpers.md', './helpers.js');
    const result = checkEdgeIsolation(edge, taxonomy);

    expect(result).toEqual({
      constraint: 'dependency/foreign-node-isolation',
      element: 'src/notes.md',
      family: 'dependency',
      from: 'src/notes.md',
      importIndex: 0,
      message:
        "'src/notes.md' imports 'src/helpers.md' through './helpers.js': a Foreign Node has no import relation with codebase files",
      normativeReference: 'FAF §4, §6.7',
      position: { column: 3, line: 2 },
      specifier: './helpers.js',
      to: 'src/helpers.md',
    });
  });
});

import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEdgeMetadata,
  TLibraryNote,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { collectSourceOutcomes } from './collect-source-outcomes.util.js';

const makeFileItem = (
  id: number,
  path: string,
  parentId: null | number
): TInventoryItem => ({
  depth: 2,
  id,
  isSymlink: false,
  kind: 'file',
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const makeDirectoryItem = (id: number, path: string): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const makeClassification = (
  itemId: number,
  path: string,
  nodeKind: null | TNodeKind
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId,
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

const makeEdge = (
  sourcePath: string,
  destinationPath: string,
  specifier: string,
  importIndex: number
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex,
  isTypeOnly: false,
  position: { column: 1, line: importIndex + 1 },
  sourcePath,
  specifier,
  syntaxKind: 'named-import',
});

const makeNote = (
  sourcePath: string,
  packageName: string,
  specifier: string,
  importIndex: number
): TLibraryNote => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex,
  isTypeOnly: false,
  packageName,
  position: { column: 1, line: importIndex + 1 },
  sourcePath,
  specifier,
  syntaxKind: 'named-import',
});

describe('collectSourceOutcomes', () => {
  it('returns empty array when model has no access nodes', () => {
    const model = verificationModel();
    expect(collectSourceOutcomes(model)).toEqual([]);
  });

  it('permits edges toward direct Master and Fragment nodes of the same Fragment', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const masterItem = makeFileItem(
      2,
      'src/_components/button/button.component.ts',
      0
    );
    const typeItem = makeFileItem(
      3,
      'src/_components/button/button.type.ts',
      0
    );

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const typeClass = makeClassification(3, typeItem.path, 'fragment-node');

    const edgeMaster = makeEdge(
      accessItem.path,
      masterItem.path,
      './button.component.js',
      0
    );
    const edgeType = makeEdge(
      accessItem.path,
      typeItem.path,
      './button.type.js',
      1
    );

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [fragmentDirectory, accessItem, masterItem, typeItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeMaster, edgeType],
      },
      taxonomy: {
        byItemId: new Map([
          [1, accessClass],
          [2, masterClass],
          [3, typeClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [masterItem.path, masterClass],
          [typeItem.path, typeClass],
        ]),
        classifications: [accessClass, masterClass, typeClass],
      },
    };

    expect(collectSourceOutcomes(model)).toEqual([]);
  });

  it('reports unauthorized local destinations and external library imports', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(10, 'src/_components/button');
    const otherDirectory = makeDirectoryItem(20, 'src/_components/other');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 10);
    const masterItem = makeFileItem(
      2,
      'src/_components/button/button.component.ts',
      10
    );
    const specItem = makeFileItem(
      3,
      'src/_components/button/button.spec.ts',
      10
    );
    const foreignFragmentItem = makeFileItem(
      4,
      'src/_components/other/index.ts',
      20
    );

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const specClass = makeClassification(3, specItem.path, 'sub-graph-node');
    const foreignClass = makeClassification(
      4,
      foreignFragmentItem.path,
      'access-node'
    );

    const edgeSpec = makeEdge(
      accessItem.path,
      specItem.path,
      './button.spec.js',
      0
    );
    const edgeForeign = makeEdge(
      accessItem.path,
      foreignFragmentItem.path,
      '../other/index.js',
      1
    );
    const noteLibrary = makeNote(accessItem.path, 'react', 'react', 2);

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [
            fragmentDirectory,
            otherDirectory,
            accessItem,
            masterItem,
            specItem,
            foreignFragmentItem,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeSpec, edgeForeign],
        libraryNotes: [noteLibrary],
      },
      taxonomy: {
        byItemId: new Map([
          [1, accessClass],
          [2, masterClass],
          [3, specClass],
          [4, foreignClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [foreignFragmentItem.path, foreignClass],
          [masterItem.path, masterClass],
          [specItem.path, specClass],
        ]),
        classifications: [accessClass, masterClass, specClass, foreignClass],
      },
    };

    const outcomes = collectSourceOutcomes(model);
    expect(outcomes).toHaveLength(3);
    expect(outcomes[0]?.to).toBe(specItem.path);
    expect(outcomes[1]?.to).toBe(foreignFragmentItem.path);
    expect(outcomes[2]?.to).toBe('react');
  });

  it('skips edge evaluation when source is not an access node or destination item is missing', () => {
    const base = verificationModel();
    const otherItem = makeFileItem(5, 'src/other.ts', null);
    const otherClass = makeClassification(5, otherItem.path, 'root-node');
    const edge = makeEdge(otherItem.path, 'src/dest.ts', './dest.js', 0);

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [otherItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edge],
      },
      taxonomy: {
        byItemId: new Map([[5, otherClass]]),
        byPath: new Map([[otherItem.path, otherClass]]),
        classifications: [otherClass],
      },
    };

    expect(collectSourceOutcomes(model)).toEqual([]);
  });
});

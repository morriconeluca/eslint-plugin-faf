import { describe, expect, it } from 'vitest';

import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { verifyMimeticPaths } from './verify-mimetic-paths.util.js';

const directory = (path: string): TItemClassification => ({
  domainKind: 'category',
  entryKind: 'directory',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 1,
  nodeKind: null,
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

const tree: TEffectiveTree = {
  catalog: {
    categoryToRole: new Map([
      [
        '_apis',
        {
          allowMultipleSymbols: false,
          category: '_apis',
          form: 'fragments',
          implicitExtensions: [],
          name: 'api',
          rank: 1,
        },
      ],
      [
        '_types',
        {
          allowMultipleSymbols: true,
          category: '_types',
          form: 'category-nodes',
          implicitExtensions: [],
          name: 'type',
          rank: 0,
        },
      ],
    ]),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 2,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
};

describe('verifyMimeticPaths', () => {
  it('emits the exact message when the path is not a fragments category', () => {
    const outcomes = verifyMimeticPaths(
      new Map([['src/_types', directory('src/_types')]]),
      tree,
      new Map([['src/_types', 'trees[0].mimeticPathStructures[0].paths[0]']])
    );
    expect(outcomes).toEqual([
      {
        constraint: 'configuration/incompatible-mimetic-designation',
        element: 'src/_types',
        family: 'configuration',
        message:
          "Mimetic path 'src/_types' does not identify a Category of Fragments.",
        normativeReference: '§6.3.5',
        propertyPath: 'trees[0].mimeticPathStructures[0].paths[0]',
      },
    ]);
  });

  it('emits nothing for a valid fragments category and skips a missing path', () => {
    const outcomes = verifyMimeticPaths(
      new Map([['src/_apis', directory('src/_apis')]]),
      tree,
      new Map([
        ['missing', 'trees[0].mimeticPathStructures[1].paths[0]'],
        ['src/_apis', 'trees[0].mimeticPathStructures[0].paths[0]'],
      ])
    );
    expect(outcomes).toEqual([]);
  });
});

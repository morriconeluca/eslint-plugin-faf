import { describe, expect, it } from 'vitest';

import type {
  TEffectiveTree,
  TItemClassification,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TTreeBuild } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { verifyClassificationReferences } from './verify-classification-references.util.js';

const classificationOf = (
  path: string,
  domainKind: TItemClassification['domainKind'],
  nodeKind: TItemClassification['nodeKind']
): TItemClassification => ({
  domainKind,
  entryKind: domainKind === null ? 'file' : 'directory',
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

const treeOf = (overrides: Partial<TEffectiveTree>): TEffectiveTree => ({
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
  horizontalHierarchyModels: [],
  mimeticPathStructures: [],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
  ...overrides,
});

const buildOf = (
  mimeticPropertyPaths: ReadonlyMap<string, string>
): TTreeBuild => ({
  context: {
    catalog: treeOf({}).catalog,
    foreignDomainPaths: new Set(),
    foreignNodePaths: new Set(),
    getRoleFromName: () => ({ kind: 'absent', roleName: null }),
    mimeticPaths: new Set(),
    originKind: 'root-layer',
    originPath: 'src',
    rootFragmentPaths: new Set(),
    rootNodePaths: new Set(),
  },
  mimeticPropertyPaths,
  outcomes: [],
  rootFragmentPropertyPaths: new Map(),
  rootNodePropertyPaths: new Map(),
});

describe('verifyClassificationReferences', () => {
  it('verifies mimetic paths, external dependency sources, and public root nodes', () => {
    const classifications = [
      classificationOf('src/_apis', 'category', null),
      classificationOf('src/_types', 'category', null),
      classificationOf('src/_apis/get-user/index.ts', null, 'access-node'),
      classificationOf('src/main.ts', null, 'root-node'),
    ];
    const tree = treeOf({
      externalDependencyPairs: [
        { from: 'src/_apis/get-user/index.ts', to: 'legacy.ts' },
        { from: 'src/main.ts', to: 'legacy.ts' },
        { from: 'src/missing.ts', to: 'legacy.ts' },
      ],
      publicRootNodes: [
        'src/main.ts',
        'src/_apis/get-user/index.ts',
        'src/absent.ts',
      ],
    });
    const outcomes = verifyClassificationReferences(
      classifications,
      tree,
      0,
      buildOf(
        new Map([
          ['missing', 'trees[0].mimeticPathStructures[1].paths[0]'],
          ['src/_apis', 'trees[0].mimeticPathStructures[0].paths[0]'],
          ['src/_types', 'trees[0].mimeticPathStructures[0].paths[1]'],
        ])
      )
    );
    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'configuration/incompatible-mimetic-designation',
      'configuration/invalid-external-dependency-source',
      'configuration/invalid-public-root-node',
    ]);
  });
});

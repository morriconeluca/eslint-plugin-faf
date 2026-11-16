import { describe, expect, it } from 'vitest';

import type { TFAFLocalConfig } from '../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventory } from '../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectLocalPublicRootNodes } from './reject-local-public-root-nodes.util.js';

const inventory: TInventory = {
  items: [
    {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'app',
      preorderEnd: 1,
      preorderStart: 0,
      realPath: '/project/app',
      treeOrigin: 'app',
    },
    {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'app/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: '/project/app/main.ts',
      treeOrigin: 'app',
    },
  ],
  pathToId: new Map([
    ['app', 0],
    ['app/main.ts', 1],
  ]),
  realPathToId: new Map(),
};

const context: TReferenceContext = {
  aliasPrefixes: [],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map([
    ['app/main.ts', { rootFragmentPath: 'app', treeOrigin: 'app' }],
  ]),
  inventory,
  ownedOrigins: new Map([
    ['app', { localIndex: 0, originKind: 'root-fragment' }],
    ['src', { localIndex: 0, originKind: 'root-layer' }],
  ]),
};

describe('rejectLocalPublicRootNodes', () => {
  it('rejects publicRootNodes when local declares only Root Layers', () => {
    const layersOnly: TFAFLocalConfig = {
      publicRootNodes: ['src/main.ts'],
      rootLayers: ['src'],
    };
    const emptyFragments: TFAFLocalConfig = {
      publicRootNodes: ['src/main.ts'],
      rootFragments: [],
      rootLayers: ['src'],
    };

    expect(
      rejectLocalPublicRootNodes(layersOnly, 0, context)[0]?.constraint
    ).toBe('configuration/public-root-nodes-in-root-layer-tree');
    expect(
      rejectLocalPublicRootNodes(emptyFragments, 0, context)[0]?.constraint
    ).toBe('configuration/public-root-nodes-in-root-layer-tree');
  });

  it('validates enumerated Root Nodes when local declares Root Fragments', () => {
    const both: TFAFLocalConfig = {
      publicRootNodes: ['app/main.ts'],
      rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }],
      rootLayers: ['src'],
    };
    expect(rejectLocalPublicRootNodes(both, 0, context)).toEqual([]);
  });
});

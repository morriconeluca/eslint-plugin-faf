import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveDeclarations,
  TInventory,
} from '../../../../_conformity@shared/_types/verification-model.type.js';

import { createReferenceContext } from './create-reference-context.util.js';

const emptyInventory: TInventory = {
  items: [],
  pathToId: new Map(),
  realPathToId: new Map(),
};

describe('createReferenceContext', () => {
  it('indexes config origins, declarations-only origins, aliases, and nested enumerated Root Nodes', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            rootFragments: [
              {
                path: '.',
                rootNodes: [['main.ts']],
                subRootFragments: [{ path: 'app', rootNodes: [['page.tsx']] }],
              },
            ],
            rootLayers: ['lib'],
          },
        ],
      },
    };
    const declarations: TEffectiveDeclarations = {
      aliases: [
        { prefix: '#shared', source: 'common.aliases', targets: ['lib'] },
      ],
      baseDirectory: '/project',
      trees: [
        {
          catalog: {
            categoryToRole: new Map(),
            extensionToRole: new Map(),
            roles: [],
            subGraphRoles: [],
            topRank: 1,
          },
          externalDependencyPairs: [],
          foreignDomains: [],
          foreignNodes: { families: [], individualPaths: [] },
          horizontalHierarchies: [],
          horizontalHierarchyModels: [],
          mimeticPathStructures: [],
          originKind: 'root-layer',
          originPath: 'lib',
          publicRootNodes: [],
          rootFragments: [],
          treeDependencyPairs: [],
        },
        {
          catalog: {
            categoryToRole: new Map(),
            extensionToRole: new Map(),
            roles: [],
            subGraphRoles: [],
            topRank: 1,
          },
          externalDependencyPairs: [],
          foreignDomains: [],
          foreignNodes: { families: [], individualPaths: [] },
          horizontalHierarchies: [],
          horizontalHierarchyModels: [],
          mimeticPathStructures: [],
          originKind: 'root-fragment',
          originPath: 'vendor',
          publicRootNodes: [],
          rootFragments: [],
          treeDependencyPairs: [],
        },
      ],
    };

    const context = createReferenceContext(
      config,
      declarations,
      emptyInventory
    );
    expect(context.aliasPrefixes).toEqual(['#shared']);
    expect(context.baseDirectory).toBe('/project');
    expect(context.ownedOrigins.get('lib')).toEqual({
      localIndex: 0,
      originKind: 'root-layer',
    });
    expect(context.ownedOrigins.get('.')).toEqual({
      localIndex: 0,
      originKind: 'root-fragment',
    });
    expect(context.ownedOrigins.get('vendor')).toEqual({
      localIndex: -1,
      originKind: 'root-fragment',
    });
    expect(context.enumeratedRootNodes.get('main.ts')).toEqual({
      rootFragmentPath: '.',
      treeOrigin: '.',
    });
    expect(context.enumeratedRootNodes.get('app/page.tsx')).toEqual({
      rootFragmentPath: 'app',
      treeOrigin: '.',
    });
  });
});

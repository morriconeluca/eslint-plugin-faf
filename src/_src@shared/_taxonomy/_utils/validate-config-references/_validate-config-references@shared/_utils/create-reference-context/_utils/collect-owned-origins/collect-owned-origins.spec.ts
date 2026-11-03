import { describe, expect, it } from 'vitest';

import type { TEffectiveDeclarations } from '../../../../../../../../_declarations/_types/declarations.type.js';
import type { TFAFConfig } from '../../../../../../../../_domain/_types/faf-config.type.js';

import { collectOwnedOrigins } from './collect-owned-origins.util.js';

describe('collectOwnedOrigins', () => {
  it('keeps a config origin and adds a declarations-only origin with the unassigned local index', () => {
    const config: TFAFConfig = {
      faf: { locals: [{ rootLayers: ['app'] }] },
    };
    const declarations = {
      aliases: [],
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
          localHorizontalHierarchies: [],
          mimeticPathStructures: [],
          originKind: 'root-layer',
          originPath: 'app',
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
          localHorizontalHierarchies: [],
          mimeticPathStructures: [],
          originKind: 'root-fragment',
          originPath: 'vendor',
          publicRootNodes: [],
          rootFragments: [],
          treeDependencyPairs: [],
        },
      ],
    } satisfies TEffectiveDeclarations;

    const owned = collectOwnedOrigins(config, declarations);
    expect(owned.get('app')?.localIndex).toBe(0);
    expect(owned.get('app')?.originKind).toBe('root-layer');
    expect(owned.size).toBe(2);
    expect(owned.get('vendor')?.localIndex).toBe(-1);
    expect(owned.get('vendor')?.originKind).toBe('root-fragment');
  });
});

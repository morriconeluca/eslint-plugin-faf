import { describe, expect, it } from 'vitest';

import type { TAcyclicityOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveRootFragment,
  TEffectiveTree,
  TVerificationModel,
} from '../../../../../../_conformity@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { verificationModel } from '../../../../../_norms@shared/_mocks/verification-model.mock.js';
import { checkRootAuthorizations } from './check-root-authorizations.util.js';

const createTreeDeclaration = (
  rootFragments: readonly TEffectiveRootFragment[]
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 0,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  horizontalHierarchyModels: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments,
  treeDependencyPairs: [],
});

describe('checkRootAuthorizations', () => {
  it('detects unexercised reciprocal root dependency edges', () => {
    const rootFragmentA: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
      path: 'src/a',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };
    const rootFragmentB: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/a/main.ts' }],
      path: 'src/b',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };

    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTreeDeclaration([rootFragmentA, rootFragmentB])],
        },
      },
    };

    const outcomes = checkRootAuthorizations(model, []);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe(
      'unverified/cyclic-root-authorization'
    );
    expect(outcomes[0]?.element).toBe('src/a');
  });

  it('suppresses outcome when root cycle is exercised in code', () => {
    const rootFragmentA: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
      path: 'src/a',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };
    const rootFragmentB: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/a/main.ts' }],
      path: 'src/b',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };

    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTreeDeclaration([rootFragmentA, rootFragmentB])],
        },
      },
    };

    const dependencyCycles: readonly TAcyclicityOutcome[] = [
      createOutcome.acyclicity('acyclicity/dependency-cycle', {
        cycle: [['src/a/main.ts', 'src/b/main.ts', 'src/a/main.ts']],
        element: 'src/a/main.ts',
      }),
    ];

    expect(checkRootAuthorizations(model, dependencyCycles)).toEqual([]);
  });

  it('returns empty array when root fragment authorizations are acyclic', () => {
    const rootFragmentA: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
      path: 'src/a',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };
    const rootFragmentB: TEffectiveRootFragment = {
      dependencyPairs: [],
      path: 'src/b',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };

    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTreeDeclaration([rootFragmentA, rootFragmentB])],
        },
      },
    };

    expect(checkRootAuthorizations(model, [])).toEqual([]);
  });

  it('returns empty array when there are fewer than 2 root fragments', () => {
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTreeDeclaration([])],
        },
      },
    };

    expect(checkRootAuthorizations(model, [])).toEqual([]);
  });
});

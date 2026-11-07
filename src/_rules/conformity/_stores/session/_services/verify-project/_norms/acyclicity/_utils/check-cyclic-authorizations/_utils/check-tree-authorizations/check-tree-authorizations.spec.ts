import { describe, expect, it } from 'vitest';

import type { TAcyclicityOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TEffectiveTree } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { verificationModel } from '../../../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { checkTreeAuthorizations } from './check-tree-authorizations.util.js';

const createTreeDeclaration = ({
  originPath,
  treeDependencyPairs = [],
}: {
  readonly originPath: string;
  readonly treeDependencyPairs?: readonly {
    readonly from: string;
    readonly to: string;
  }[];
}): TEffectiveTree => ({
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
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath,
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs,
});

describe('checkTreeAuthorizations', () => {
  it('detects unexercised reciprocal tree dependencies and skips external items', () => {
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [
            createTreeDeclaration({
              originPath: 'a',
              treeDependencyPairs: [{ from: 'a', to: 'b' }],
            }),
            createTreeDeclaration({
              originPath: 'b',
              treeDependencyPairs: [{ from: 'b', to: 'a' }],
            }),
          ],
        },
        inventory: {
          items: [
            {
              depth: 1,
              id: 0,
              isSymlink: false,
              kind: 'file',
              parentId: null,
              path: 'external.ts',
              preorderEnd: 0,
              preorderStart: 0,
              realPath: '/workspace/external.ts',
              treeOrigin: null,
            },
          ],
          pathToId: new Map([['external.ts', 0]]),
          realPathToId: new Map([['/workspace/external.ts', 0]]),
        },
      },
    };

    const outcomes = checkTreeAuthorizations(model, []);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe(
      'unverified/cyclic-tree-authorization'
    );
    expect(outcomes[0]?.element).toBe('a');
  });

  it('suppresses outcome when tree cycle is exercised in code', () => {
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [
            createTreeDeclaration({
              originPath: 'a',
              treeDependencyPairs: [{ from: 'a', to: 'b' }],
            }),
            createTreeDeclaration({
              originPath: 'b',
              treeDependencyPairs: [{ from: 'b', to: 'a' }],
            }),
          ],
        },
        inventory: {
          items: [
            {
              depth: 1,
              id: 0,
              isSymlink: false,
              kind: 'file',
              parentId: null,
              path: 'a/1.ts',
              preorderEnd: 0,
              preorderStart: 0,
              realPath: '/workspace/a/1.ts',
              treeOrigin: 'a',
            },
            {
              depth: 1,
              id: 1,
              isSymlink: false,
              kind: 'file',
              parentId: null,
              path: 'b/1.ts',
              preorderEnd: 1,
              preorderStart: 1,
              realPath: '/workspace/b/1.ts',
              treeOrigin: 'b',
            },
          ],
          pathToId: new Map([
            ['a/1.ts', 0],
            ['b/1.ts', 1],
          ]),
          realPathToId: new Map([
            ['/workspace/a/1.ts', 0],
            ['/workspace/b/1.ts', 1],
          ]),
        },
      },
    };

    const interTreeCycles: readonly TAcyclicityOutcome[] = [
      createOutcome('acyclicity/inter-tree-cycle', {
        cycle: [
          ['a/1.ts', 'b/1.ts'],
          ['b/1.ts', 'a/1.ts'],
        ],
        element: 'a/1.ts',
      }),
    ];

    expect(checkTreeAuthorizations(model, interTreeCycles)).toEqual([]);
  });

  it('returns empty array when tree authorizations are acyclic', () => {
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [
            createTreeDeclaration({
              originPath: 'a',
              treeDependencyPairs: [{ from: 'a', to: 'b' }],
            }),
            createTreeDeclaration({
              originPath: 'b',
            }),
          ],
        },
      },
    };

    expect(checkTreeAuthorizations(model, [])).toEqual([]);
  });

  it('returns empty array when there are fewer than 2 trees', () => {
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTreeDeclaration({ originPath: 'a' })],
        },
      },
    };

    expect(checkTreeAuthorizations(model, [])).toEqual([]);
  });
});

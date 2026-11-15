import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventory } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { validateForeignReferences } from './validate-foreign-references.util.js';

const inventory: TInventory = {
  items: [
    {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
      realPath: '/project/src',
      treeOrigin: 'src',
    },
    {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_tooling',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: '/project/src/_tooling',
      treeOrigin: 'src',
    },
    {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/README.md',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: '/project/src/README.md',
      treeOrigin: 'src',
    },
  ],
  pathToId: new Map([
    ['src', 0],
    ['src/_tooling', 1],
    ['src/README.md', 2],
  ]),
  realPathToId: new Map(),
};

const context: TReferenceContext = {
  aliasPrefixes: [],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map(),
  inventory,
  ownedOrigins: new Map([['src', { localIndex: 0, originKind: 'root-layer' }]]),
};

describe('validateForeignReferences', () => {
  it('accepts valid Foreign Domains, individual Foreign Nodes, and Foreign family scopes', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          foreignDomains: ['src/_tooling'],
          foreignNodes: ['src/README.md'],
        },
        locals: [
          {
            foreignNodes: [{ paths: ['src'], patterns: ['*.md'] }],
            rootLayers: ['src'],
          },
        ],
      },
    };
    expect(validateForeignReferences(config, context)).toEqual([]);
  });

  it('rejects origins designated as Foreign Domains and missing Foreign Node references', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            foreignDomains: ['src'],
            foreignNodes: [
              'src/missing.md',
              { paths: ['src/missing-dir'], patterns: ['*.md'] },
            ],
            rootLayers: ['src'],
          },
        ],
      },
    };
    const outcomes = validateForeignReferences(config, context);
    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'configuration/origin-designated-foreign-domain',
      'configuration/non-existent-path',
      'configuration/non-existent-path',
    ]);
  });
});

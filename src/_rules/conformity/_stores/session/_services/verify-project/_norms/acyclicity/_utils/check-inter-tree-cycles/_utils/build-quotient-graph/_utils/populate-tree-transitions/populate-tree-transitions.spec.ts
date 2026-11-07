import { describe, expect, it } from 'vitest';

import type { TTransition } from './populate-tree-transitions.type.js';

import { verificationModel } from '../../../../../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { populateTreeTransitions } from './populate-tree-transitions.util.js';

describe('populateTreeTransitions', () => {
  it('registers direct edges and crossings into transition matrix and ignores duplicate equal transitions', () => {
    const base = verificationModel();
    const fileToTreeIndex = new Map([
      ['a/source.ts', 0],
      ['a/target.ts', 0],
      ['b/source.ts', 1],
      ['b/target.ts', 1],
    ]);
    const transitions: (null | TTransition)[][] = [
      [null, null],
      [null, null],
    ];

    const model = {
      ...base,
      crossings: [
        {
          chain: ['b/source.ts', 'x.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/source.ts',
          specifier: './x.js',
        },
      ],
      graph: {
        ...base.graph,
        edgeMetadata: [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/target.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/source.ts',
            specifier: './b.js',
            syntaxKind: 'side-effect-import' as const,
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/target.ts',
            importIndex: 1,
            isTypeOnly: false,
            position: { column: 1, line: 99 },
            sourcePath: 'a/source.ts',
            specifier: './b.js',
            syntaxKind: 'side-effect-import' as const,
          },
        ],
      },
    };

    populateTreeTransitions(model, fileToTreeIndex, transitions);
    expect(transitions[0]?.[1]?.segment).toEqual([
      'a/source.ts',
      'b/target.ts',
    ]);
    expect(transitions[0]?.[1]?.position).toEqual({ column: 1, line: 1 });
    expect(transitions[1]?.[0]?.segment).toEqual([
      'b/source.ts',
      'x.ts',
      'a/target.ts',
    ]);
  });

  it('handles same-tree edges, worse transitions, and unmapped files', () => {
    const base = verificationModel();
    const fileToTreeIndex = new Map([
      ['a/0.ts', 0],
      ['a/1.ts', 0],
      ['a/2.ts', 0],
      ['a/oob.ts', 99],
      ['a/z.ts', 0],
      ['b/1.ts', 1],
    ]);
    const transitions: (null | TTransition)[][] = [
      [null, { segment: ['a/1.ts', 'b/1.ts'] }],
      [null, null],
    ];

    const model = {
      ...base,
      crossings: [
        {
          chain: ['a/1.ts', 'x.ts', 'a/2.ts'],
          destinationPath: 'a/2.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/1.ts',
          specifier: './x.js',
        },
        {
          chain: ['unmapped.ts', 'b/1.ts'],
          destinationPath: 'b/1.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'unmapped.ts',
          specifier: './b.js',
        },
        {
          chain: ['a/1.ts', 'unmapped.ts'],
          destinationPath: 'unmapped.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/1.ts',
          specifier: './unmapped.js',
        },
      ],
      graph: {
        ...base.graph,
        edgeMetadata: [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'a/2.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/1.ts',
            specifier: './2.js',
            syntaxKind: 'side-effect-import' as const,
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/1.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/z.ts',
            specifier: './b.js',
            syntaxKind: 'side-effect-import' as const,
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/1.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/0.ts',
            specifier: './b.js',
            syntaxKind: 'side-effect-import' as const,
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'unmapped.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/1.ts',
            specifier: './unmapped.js',
            syntaxKind: 'side-effect-import' as const,
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/1.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/oob.ts',
            specifier: './b.js',
            syntaxKind: 'side-effect-import' as const,
          },
        ],
      },
    };

    populateTreeTransitions(model, fileToTreeIndex, transitions);
    expect(transitions[0]?.[1]?.segment).toEqual(['a/0.ts', 'b/1.ts']);
    expect(transitions[0]?.[0]).toBeNull();
    expect(transitions[1]?.[1]).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../../../extract-traversal-entries.type.js';

import { visitChildren } from './index.js';

describe('visitChildren', () => {
  it('visits direct AST child nodes', () => {
    const parent: TAstNode = {
      childA: { type: 'ChildA' },
      primitive: 'ignored',
      type: 'Parent',
    };
    const visited: string[] = [];

    visitChildren(parent, (child) => {
      visited.push(child.type);
    });

    expect(visited).toEqual(['ChildA']);
  });

  it('visits AST child nodes inside array properties', () => {
    const parent: TAstNode = {
      elements: [{ type: 'First' }, 'primitive', { type: 'Second' }],
      type: 'Parent',
    };
    const visited: string[] = [];

    visitChildren(parent, (child) => {
      visited.push(child.type);
    });

    expect(visited).toEqual(['First', 'Second']);
  });
});

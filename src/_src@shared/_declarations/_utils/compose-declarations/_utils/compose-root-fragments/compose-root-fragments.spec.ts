import { describe, expect, it } from 'vitest';

import { composeRootFragments } from './compose-root-fragments.util.js';

describe('composeRootFragments', () => {
  it('returns empty array when given empty root fragments list', () => {
    expect(composeRootFragments([])).toEqual([]);
  });

  it('assigns positional rank to rootNodes across hierarchy levels', () => {
    const [result] = composeRootFragments([
      {
        path: 'src',
        rootNodes: [['main.css'], ['main.tsx', 'index.html']],
      },
    ]);

    expect(result).toBeDefined();
    if (result === undefined) {
      return;
    }

    expect(result.path).toBe('src');
    expect(result.rootNodes).toEqual([
      { name: 'main.css', rank: 0 },
      { name: 'main.tsx', rank: 1 },
      { name: 'index.html', rank: 1 },
    ]);
    expect(result.dependencyPairs).toEqual([]);
    expect(result.subRootFragments).toEqual([]);
  });

  it('expands dependencyEdges into Cartesian product with full from path and removes duplicates', () => {
    const [result] = composeRootFragments([
      {
        dependencyEdges: [
          {
            from: ['a.ts', 'b.ts'],
            to: ['dest/c.ts', 'dest/d.ts'],
          },
          {
            from: ['a.ts'],
            to: ['dest/c.ts'],
          },
        ],
        path: 'src/routes',
        rootNodes: [['a.ts'], ['b.ts']],
      },
    ]);

    expect(result).toBeDefined();
    if (result === undefined) {
      return;
    }

    expect(result.dependencyPairs).toEqual([
      { from: 'src/routes/a.ts', to: 'dest/c.ts' },
      { from: 'src/routes/a.ts', to: 'dest/d.ts' },
      { from: 'src/routes/b.ts', to: 'dest/c.ts' },
      { from: 'src/routes/b.ts', to: 'dest/d.ts' },
    ]);
  });

  it('recursively composes nested subRootFragments', () => {
    const [result] = composeRootFragments([
      {
        path: 'src',
        rootNodes: [['main.tsx']],
        subRootFragments: [
          {
            dependencyEdges: [
              {
                from: ['app.tsx'],
                to: ['src/shared/leaf.ts'],
              },
            ],
            path: 'src/app',
            rootNodes: [['app.tsx']],
          },
        ],
      },
    ]);

    expect(result).toBeDefined();
    if (result === undefined) {
      return;
    }

    expect(result.subRootFragments).toHaveLength(1);
    const sub = result.subRootFragments[0];
    expect(sub).toBeDefined();
    if (sub === undefined) {
      return;
    }

    expect(sub.path).toBe('src/app');
    expect(sub.rootNodes).toEqual([{ name: 'app.tsx', rank: 0 }]);
    expect(sub.dependencyPairs).toEqual([
      { from: 'src/app/app.tsx', to: 'src/shared/leaf.ts' },
    ]);
  });
});

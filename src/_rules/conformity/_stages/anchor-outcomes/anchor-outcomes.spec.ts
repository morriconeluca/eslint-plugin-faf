import { describe, expect, it } from 'vitest';

import type { TOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TAnchoredOutcome } from '../../_conformity@shared/_types/anchored-outcome.type.js';

import { anchorOutcomes } from './anchor-outcomes.stage.js';
import { compareAnchoredOutcomes } from './anchor-outcomes.util.js';

const outcome = (element: string, line: number): TOutcome => ({
  constraint: 'unverified/unresolved-import',
  element,
  family: 'unverified',
  message: `unverified/unresolved-import at ${element}`,
  normativeReference: '§5',
  position: { column: 1, line },
  reason: 'unresolved',
});

const anchored = (
  anchorPath: string,
  element: string,
  line: number
): TAnchoredOutcome => ({
  anchorPath,
  outcome: {
    constraint: 'unverified/unresolved-import',
    element,
    family: 'unverified',
    message: element,
    normativeReference: '§5',
    reason: 'missing',
  },
  position: { column: 1, line },
});

describe('anchorOutcomes', () => {
  it('orders outcomes stably and keeps the import position on the same file', () => {
    const later = outcome('src/b.ts', 4);
    const earlier = outcome('src/a.ts', 2);
    const result = anchorOutcomes({
      baseDirectory: '/repo',
      configPath: '/repo/faf.config.ts',
      outcomes: [later, earlier],
    });

    expect(result.outcomes.map((item) => item.outcome.element)).toEqual([
      'src/a.ts',
      'src/b.ts',
    ]);
    expect(result.outcomes[0]?.position).toEqual({ column: 1, line: 1 });
    expect(result.byFile.get('/repo/faf.config.ts')).toHaveLength(2);
  });

  it('uses the outcome position when the anchor is the element file', () => {
    const imported = outcome('src/a.ts', 3);
    const result = anchorOutcomes({
      baseDirectory: '/repo',
      configPath: '/repo/faf.config.ts',
      inventory: {
        items: [
          {
            depth: 1,
            id: 0,
            isSymlink: false,
            kind: 'file',
            parentId: null,
            path: 'src/a.ts',
            preorderEnd: 0,
            preorderStart: 0,
            realPath: 'src/a.ts',
            treeOrigin: 'src',
          },
        ],
        pathToId: new Map([['src/a.ts', 0]]),
        realPathToId: new Map([['src/a.ts', 0]]),
      },
      outcomes: [imported],
    });

    expect(result.outcomes[0]?.anchorPath).toBe('/repo/src/a.ts');
    const windows = anchorOutcomes({
      baseDirectory: '/repo',
      configPath: '/repo/faf.config.ts',
      inventory: {
        items: [
          {
            depth: 1,
            id: 0,
            isSymlink: false,
            kind: 'file',
            parentId: null,
            path: 'src/a.ts',
            preorderEnd: 0,
            preorderStart: 0,
            realPath: 'src/a.ts',
            treeOrigin: 'src',
          },
        ],
        pathToId: new Map([['src/a.ts', 0]]),
        realPathToId: new Map([['src/a.ts', 0]]),
      },
      outcomes: [outcome('src\\a.ts', 4)],
    });
    expect(windows.outcomes[0]?.anchorPath).toBe('/repo/src/a.ts');
    expect(windows.outcomes[0]?.position).toEqual({ column: 1, line: 4 });
    const absolute = anchorOutcomes({
      baseDirectory: '/repo',
      configPath: '/repo/faf.config.ts',
      inventory: {
        items: [
          {
            depth: 1,
            id: 0,
            isSymlink: false,
            kind: 'file',
            parentId: null,
            path: 'src/a.ts',
            preorderEnd: 0,
            preorderStart: 0,
            realPath: 'src/a.ts',
            treeOrigin: 'src',
          },
        ],
        pathToId: new Map([['src/a.ts', 0]]),
        realPathToId: new Map([['src/a.ts', 0]]),
      },
      outcomes: [outcome('/repo/src/a.ts', 5)],
    });
    expect(absolute.outcomes[0]?.anchorPath).toBe('/repo/src/a.ts');
    expect(absolute.outcomes[0]?.position).toEqual({ column: 1, line: 5 });
    expect(result.outcomes[0]?.position).toEqual({ column: 1, line: 3 });
    expect(result.byFile.get('/repo/src/a.ts')).toHaveLength(1);
  });

  it('orders anchored outcomes by anchor path, constraint, element, position, and message', () => {
    const later = anchored('/repo/b.ts', 'src/b.ts', 1);
    const earlier = anchored('/repo/a.ts', 'src/a.ts', 4);
    expect(compareAnchoredOutcomes(later, earlier)).toBeGreaterThan(0);
    expect(compareAnchoredOutcomes(earlier, later)).toBeLessThan(0);
    const onlyPath = anchored('/repo/b.ts', 'src/a.ts', 4);
    expect(compareAnchoredOutcomes(earlier, onlyPath)).toBeLessThan(0);
    const onlyElement = {
      ...earlier,
      outcome: { ...earlier.outcome, element: 'src/z.ts' },
    };
    expect(compareAnchoredOutcomes(earlier, onlyElement)).not.toBe(0);
    expect(compareAnchoredOutcomes(earlier, earlier)).toBe(0);
    const same = anchored('/repo/a.ts', 'src/a.ts', 4);
    const renamed = {
      ...same,
      outcome: { ...same.outcome, message: 'other' },
    };
    expect(compareAnchoredOutcomes(same, renamed)).not.toBe(0);
    expect(
      compareAnchoredOutcomes(
        anchored('/repo/a.ts', 'src/a.ts', 1),
        anchored('/repo/a.ts', 'src/a.ts', 2)
      )
    ).not.toBe(0);
  });
});

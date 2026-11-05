import { describe, expect, it } from 'vitest';

import type { TImportResolution } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { collectUnvisitedLocalPaths } from './index.js';

const resolution = (
  target: TImportResolution['target']
): TImportResolution => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex: 0,
  sourcePath: 'src/app.ts',
  target,
});

describe('collectUnvisitedLocalPaths', () => {
  it('returns each unvisited local file once and ignores libraries and unresolved targets', () => {
    const resolutions = [
      resolution({ path: 'outside\\a.ts', type: 'local-file' }),
      resolution({ path: 'outside/a.ts', type: 'local-file' }),
      resolution({ path: 'src/app.ts', type: 'local-file' }),
      resolution({ packageName: 'left-pad', type: 'external-library' }),
      resolution({ reason: 'missing', type: 'unresolved' }),
      resolution({ path: 'outside/b.ts', type: 'local-file' }),
    ];

    expect(
      collectUnvisitedLocalPaths(resolutions, new Set(['src/app.ts']))
    ).toEqual(['outside/a.ts', 'outside/b.ts']);
  });
});

import { cruise } from 'dependency-cruiser';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { formatViolation, isCruiseResult } from './dependencies-graph.util.js';

describe('Fitness Function: Dependencies Graph', () => {
  const srcPath = path.resolve(import.meta.dirname, '../../src');

  // We use tsconfig.json because it contains the correct workspace configurations
  const tsConfigPath = path.resolve(import.meta.dirname, '../../tsconfig.json');

  it('should not have any cycles between modules and orphan modules', async () => {
    const result = await cruise([srcPath], {
      exclude: {
        path: '[.](test|spec)[.](ts)$',
      },
      includeOnly: {
        path: '^src/',
      },
      ruleSet: {
        forbidden: [
          {
            comment: 'This dependency is part of a circular relationship.',
            from: {},
            name: 'no-circular',
            severity: 'error',
            to: {
              circular: true,
            },
          },
          {
            comment:
              'This module is not used by any other module and does not use any other module.',
            from: {
              orphan: true,
            },
            name: 'no-orphans',
            severity: 'error',
            to: {},
          },
          {
            comment:
              'Importing from the compiled dist folder is forbidden. Import from source files directly.',
            from: {},
            name: 'no-dist-imports',
            severity: 'error',
            to: {
              path: '^dist/',
            },
          },
        ],
      },
      tsConfig: {
        fileName: tsConfigPath,
      },
      tsPreCompilationDeps: true,
      validate: true,
    });

    if (!isCruiseResult(result.output)) {
      throw new Error(
        'The output from dependency-cruiser is not a valid ICruiseResult object'
      );
    }

    const violations = result.output.summary?.violations || [];
    const errors = result.output.summary?.error || 0;

    expect(errors, violations.map(formatViolation).join('\n')).toBe(0);
  });
});

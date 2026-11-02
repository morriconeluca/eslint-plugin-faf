import type {
  ICruiseResult,
  IForbiddenRuleType,
  IViolation,
} from 'dependency-cruiser';

import { cruise } from 'dependency-cruiser';
import { createFixture } from 'fs-fixture';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const FORBIDDEN_RULES: readonly IForbiddenRuleType[] = [
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
      pathNot: '^src/main[.]ts$',
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
];

const BASE_CRUISE_OPTIONS = {
  exclude: {
    path: '([.](test|spec)[.](ts)$|[.]d[.]ts$)',
  },
  includeOnly: {
    path: '^(src|dist)/',
  },
  ruleSet: {
    forbidden: [...FORBIDDEN_RULES],
  },
  tsPreCompilationDeps: true,
  validate: true,
};

const isCruiseResult = (output: unknown): output is ICruiseResult =>
  typeof output === 'object' && output !== null && 'summary' in output;

const formatViolation = (violation: IViolation): string => {
  if (violation.rule.name === 'no-circular') {
    const cycle = violation.cycle;
    const pathChain =
      cycle === undefined
        ? `${violation.from} -> ${violation.to}`
        : `${cycle.map((c) => c.name).join(' -> ')} -> ${cycle[0]?.name ?? ''}`;
    return `Cycle detected: ${pathChain}`;
  }

  if (violation.rule.name === 'no-orphans') {
    return `Orphan module: ${violation.from}`;
  }

  if (violation.rule.name === 'no-dist-imports') {
    return `Forbidden import from dist/ inside ${violation.from} -> importing ${violation.to}`;
  }

  return `${violation.rule.name}: ${violation.from} -> ${violation.to}`;
};

describe('fitness: dependency graph', () => {
  const sourcePath = path.resolve(import.meta.dirname, '../../src');
  const tsConfigPath = path.resolve(import.meta.dirname, '../../tsconfig.json');
  const WARMUP_TIMEOUT_MS = 30_000;

  let repositoryCruiseResult: Awaited<ReturnType<typeof cruise>> | undefined;

  beforeAll(async () => {
    repositoryCruiseResult = await cruise([sourcePath], {
      ...BASE_CRUISE_OPTIONS,
      tsConfig: {
        fileName: tsConfigPath,
      },
    });
  }, WARMUP_TIMEOUT_MS);

  it('validates repository source files against cycles, orphans, and dist imports', async () => {
    const result =
      repositoryCruiseResult ??
      (await cruise([sourcePath], {
        ...BASE_CRUISE_OPTIONS,
        tsConfig: {
          fileName: tsConfigPath,
        },
      }));

    expect(isCruiseResult(result.output)).toBe(true);
    if (!isCruiseResult(result.output)) {
      return;
    }

    const violations = result.output.summary.violations;
    const errors = result.output.summary.error;
    expect(errors, violations.map((v) => formatViolation(v)).join('\n')).toBe(
      0
    );
  });

  it('detects circular dependencies including type-only cycles', async () => {
    const fixture = await createFixture({
      'src/a.ts':
        "import type { TB } from './b.js';\nexport type TA = string;\n",
      'src/b.ts':
        "import type { TA } from './a.js';\nexport type TB = number;\n",
      'src/main.ts':
        "import type { TA } from './a.js';\nexport const main = 'ok';\n",
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'es2022',
        },
      }),
    });

    try {
      const result = await cruise(['src'], {
        ...BASE_CRUISE_OPTIONS,
        baseDir: fixture.path,
        tsConfig: {
          fileName: 'tsconfig.json',
        },
      });

      expect(isCruiseResult(result.output)).toBe(true);
      if (!isCruiseResult(result.output)) {
        return;
      }

      const violations = result.output.summary.violations;
      const circularViolations = violations.filter(
        (v) => v.rule.name === 'no-circular'
      );
      expect(circularViolations.length).toBeGreaterThan(0);
    } finally {
      await fixture.rm();
    }
  });

  it('detects orphan modules outside of the declared entry point', async () => {
    const fixture = await createFixture({
      'src/main.ts': "export const main = 'entry';\n",
      'src/orphan.ts': 'export const unused = 42;\n',
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'es2022',
        },
      }),
    });

    try {
      const result = await cruise(['src'], {
        ...BASE_CRUISE_OPTIONS,
        baseDir: fixture.path,
        tsConfig: {
          fileName: 'tsconfig.json',
        },
      });

      expect(isCruiseResult(result.output)).toBe(true);
      if (!isCruiseResult(result.output)) {
        return;
      }

      const violations = result.output.summary.violations;
      const orphanViolations = violations.filter(
        (v) => v.rule.name === 'no-orphans'
      );
      expect(orphanViolations.length).toBeGreaterThan(0);
      expect(orphanViolations.some((v) => v.from === 'src/orphan.ts')).toBe(
        true
      );
    } finally {
      await fixture.rm();
    }
  });

  it('detects forbidden imports from dist folder', async () => {
    const fixture = await createFixture({
      'dist/compiled.js': "export const compiled = 'built';\n",
      'src/main.ts':
        "import { compiled } from '../dist/compiled.js';\nexport const main = compiled;\n",
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'es2022',
        },
      }),
    });

    try {
      const result = await cruise(['src'], {
        ...BASE_CRUISE_OPTIONS,
        baseDir: fixture.path,
        tsConfig: {
          fileName: 'tsconfig.json',
        },
      });

      expect(isCruiseResult(result.output)).toBe(true);
      if (!isCruiseResult(result.output)) {
        return;
      }

      const violations = result.output.summary.violations;
      const forbiddenDistributionViolations = violations.filter(
        (v) => v.rule.name === 'no-dist-imports'
      );
      expect(forbiddenDistributionViolations.length).toBeGreaterThan(0);
    } finally {
      await fixture.rm();
    }
  });

  it('does not flag entry point src/main.ts as an orphan module', async () => {
    const fixture = await createFixture({
      'src/main.ts': "export const main = 'standalone entry';\n",
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'es2022',
        },
      }),
    });

    try {
      const result = await cruise(['src'], {
        ...BASE_CRUISE_OPTIONS,
        baseDir: fixture.path,
        tsConfig: {
          fileName: 'tsconfig.json',
        },
      });

      expect(isCruiseResult(result.output)).toBe(true);
      if (!isCruiseResult(result.output)) {
        return;
      }

      const violations = result.output.summary.violations;
      const orphanViolations = violations.filter(
        (v) => v.rule.name === 'no-orphans'
      );
      expect(orphanViolations).toEqual([]);
      expect(result.output.summary.error).toBe(0);
    } finally {
      await fixture.rm();
    }
  });
});

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
      'Every production module must be reachable from the package entry.',
    from: {
      path: '^src/main[.]ts$',
    },
    name: 'not-reachable-from-main',
    severity: 'error',
    to: {
      path: '^src/',
      pathNot: '[.](spec|mock)[.]ts$',
      reachable: false,
    },
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

  if (violation.rule.name === 'not-reachable-from-main') {
    return `Unreachable from src/main.ts: ${violation.from}`;
  }

  if (violation.rule.name === 'no-dist-imports') {
    return `Forbidden import from dist/ inside ${violation.from} -> importing ${violation.to}`;
  }

  return `${violation.rule.name}: ${violation.from} -> ${violation.to}`;
};

describe('fitness: dependency graph', () => {
  const repositoryRoot = path.resolve(import.meta.dirname, '../..');
  const tsConfigPath = path.resolve(import.meta.dirname, '../../tsconfig.json');
  const WARMUP_TIMEOUT_MS = 30_000;

  let repositoryCruiseResult: Awaited<ReturnType<typeof cruise>> | undefined;

  beforeAll(async () => {
    repositoryCruiseResult = await cruise(['src'], {
      ...BASE_CRUISE_OPTIONS,
      baseDir: repositoryRoot,
      tsConfig: {
        fileName: tsConfigPath,
      },
    });
  }, WARMUP_TIMEOUT_MS);

  it('excludes only spec and mock modules from reachability', () => {
    const reachability = FORBIDDEN_RULES.find(
      (rule) => rule.name === 'not-reachable-from-main'
    );
    expect(reachability !== undefined && 'to' in reachability).toBe(true);
    if (reachability === undefined || !('to' in reachability)) {
      return;
    }
    const pathNot = reachability.to.pathNot;
    expect(pathNot).toBe('[.](spec|mock)[.]ts$');
    if (typeof pathNot !== 'string') {
      return;
    }
    const excluded = new RegExp(pathNot);
    expect(excluded.test('src/widget.spec.ts')).toBe(true);
    expect(excluded.test('src/inventory-from-entries.mock.ts')).toBe(true);
    expect(excluded.test('src/main.ts')).toBe(false);
    expect(excluded.test('src/outcome.type.ts')).toBe(false);
    expect(excluded.test('src/mock.ts')).toBe(false);
    expect(excluded.test('src/widget.specification.ts')).toBe(false);
  });

  it('validates repository source files against cycles, reachability, and dist imports', async () => {
    const result =
      repositoryCruiseResult ??
      (await cruise(['src'], {
        ...BASE_CRUISE_OPTIONS,
        baseDir: repositoryRoot,
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

  it('detects modules that are not reachable from src/main.ts', async () => {
    const fixture = await createFixture({
      'src/helper.ts': 'export const helper = 1;\n',
      'src/main.ts': "export const main = 'entry';\n",
      'src/used.ts':
        "import { helper } from './helper.js';\nexport const used = helper;\n",
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
      const unreachable = violations.filter(
        (v) => v.rule.name === 'not-reachable-from-main'
      );
      expect(unreachable.some((v) => v.from === 'src/used.ts')).toBe(true);
      expect(unreachable.some((v) => v.from === 'src/helper.ts')).toBe(true);
      expect(unreachable.some((v) => v.from === 'src/main.ts')).toBe(false);
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

import { describe, expect, it } from 'vitest';

import type { TConfigConstraint } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { OUTCOME_CATALOG } from '../../../../../../../../../../_conformity@shared/_configs/outcome-catalog.config.js';
import { validateRootFragments } from './validate-root-fragments.util.js';

describe('validateRootFragments', () => {
  it('does nothing when rootFragments is undefined', () => {
    const outcomes = validateRootFragments(undefined, 'faf.locals[0]');
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null rootFragments', () => {
    const outcomes = validateRootFragments(null, 'faf.locals[0]');
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe('faf.locals[0].rootFragments');
    expect(outcome?.element).toBe('faf.locals[0].rootFragments');
    expect(outcome?.message).toBe(
      "'faf.locals[0].rootFragments' cannot be null"
    );
  });

  it('rejects non-array rootFragments', () => {
    const outcomes = validateRootFragments('src', 'faf.locals[0]');
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe('faf.locals[0].rootFragments');
    expect(outcome?.element).toBe('faf.locals[0].rootFragments');
    expect(outcome?.message).toBe(
      "'faf.locals[0].rootFragments' has an invalid type"
    );
  });

  it('accepts valid rootFragment with empty rootNodes', () => {
    const outcomes = validateRootFragments(
      [{ path: 'src', rootNodes: [] }],
      'faf.locals[0]'
    );
    expect(outcomes).toHaveLength(0);
  });

  it('accepts valid rootFragment with nested subRootFragments and dependencyEdges', () => {
    const outcomes = validateRootFragments(
      [
        {
          dependencyEdges: [
            {
              from: ['main.tsx'],
              to: ['src/app/app.tsx'],
            },
          ],
          path: 'src',
          rootNodes: [['main.css'], ['main.tsx']],
          subRootFragments: [
            {
              path: 'src/app',
              rootNodes: [['app.tsx']],
            },
          ],
        },
      ],
      'faf.locals[0]'
    );
    expect(outcomes).toHaveLength(0);
  });

  const testCases: readonly {
    readonly constraint: TConfigConstraint;
    readonly message: string;
    readonly normativeReference: string;
    readonly payload: unknown;
    readonly propertyPath: string;
  }[] = [
    {
      constraint: 'configuration/null-forbidden',
      message: 'Root fragment element cannot be null.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [null],
      propertyPath: 'faf.locals[0].rootFragments[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Root fragment element must be an object.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: ['src'],
      propertyPath: 'faf.locals[0].rootFragments[0]',
    },
    {
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "master" is forbidden.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ master: 'main.ts', path: 'src', rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].master',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "path" cannot be null.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: null, rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].path',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "path" is missing.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].path',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "path" must be a string.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 123, rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].path',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Property "path" cannot be empty.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: '', rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].path',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: './src', rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].path',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "rootNodes" is missing.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src' }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "rootNodes" must be an array.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src', rootNodes: 'main.ts' }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Root nodes tier cannot be null.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src', rootNodes: [null] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Root nodes tier must be an array.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src', rootNodes: ['main.ts'] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0]',
    },
    {
      constraint: 'configuration/empty-tier',
      message: 'Root nodes tier cannot be empty.',
      normativeReference: 'FAF §6.2.2',
      payload: [{ path: 'src', rootNodes: [[]] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0]',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Root node element cannot be null.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src', rootNodes: [[null]] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0][0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Root node element must be a string.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src', rootNodes: [[123]] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0][0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Root node element cannot be empty.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src', rootNodes: [['']] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0][0]',
    },
    {
      constraint: 'configuration/invalid-file-name',
      message:
        'Root node file name "app/app.tsx" must be a direct child without "/".',
      normativeReference: 'FAF §6.2.1, §6.2.2',
      payload: [{ path: 'src', rootNodes: [['app/app.tsx']] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0][0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate root node "main.ts".',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ path: 'src', rootNodes: [['main.ts'], ['main.ts']] }],
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[1][0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "dependencyEdges" must be an array.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ dependencyEdges: 'invalid', path: 'src', rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Dependency edge cannot be null.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ dependencyEdges: [null], path: 'src', rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Dependency edge must be an object.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [{ dependencyEdges: [123], path: 'src', rootNodes: [] }],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0]',
    },
    {
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ extra: true, from: ['a.ts'], to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].extra',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "from" is missing.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        { dependencyEdges: [{ to: ['b.ts'] }], path: 'src', rootNodes: [] },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from',
    },
    {
      constraint: 'configuration/invalid-type',
      message:
        'Property "faf.locals[0].rootFragments[0].dependencyEdges[0].from" must be an array.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: 'a.ts', to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from',
    },
    {
      constraint: 'configuration/empty-list',
      message:
        'Property "faf.locals[0].rootFragments[0].dependencyEdges[0].from" cannot be empty.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: [], to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Edge target cannot be null.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: [null], to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Edge target must be a string.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: [123], to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Edge target cannot be empty.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: [''], to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from[0]',
    },
    {
      constraint: 'configuration/invalid-file-name',
      message: 'File name "app/main.ts" cannot contain "/".',
      normativeReference: 'FAF §6.2.1, §6.2.2',
      payload: [
        {
          dependencyEdges: [{ from: ['app/main.ts'], to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate edge element "main.ts".',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['main.ts', 'main.ts'], to: ['b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from[1]',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "to" is missing.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        { dependencyEdges: [{ from: ['a.ts'] }], path: 'src', rootNodes: [] },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to',
    },
    {
      constraint: 'configuration/invalid-type',
      message:
        'Property "faf.locals[0].rootFragments[0].dependencyEdges[0].to" must be an array.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['a.ts'], to: 'b.ts' }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to',
    },
    {
      constraint: 'configuration/empty-list',
      message:
        'Property "faf.locals[0].rootFragments[0].dependencyEdges[0].to" cannot be empty.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['a.ts'], to: [] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Edge target cannot be null.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['a.ts'], to: [null] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Edge target must be a string.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['a.ts'], to: [123] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Edge target cannot be empty.',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['a.ts'], to: [''] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[0]',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./b.ts".',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['a.ts'], to: ['./b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate edge element "b.ts".',
      normativeReference: 'FAF §1.2, §6.9',
      payload: [
        {
          dependencyEdges: [{ from: ['a.ts'], to: ['b.ts', 'b.ts'] }],
          path: 'src',
          rootNodes: [],
        },
      ],
      propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[1]',
    },
  ];

  it.each(testCases)(
    'rejects invalid rootFragment configuration producing $constraint',
    ({ constraint, payload, propertyPath }) => {
      const outcomes = validateRootFragments(payload, 'faf.locals[0]');
      expect(outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = outcomes.find(
        (o) => o.constraint === constraint && o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(
        OUTCOME_CATALOG[constraint].normativeReference
      );
      expect(outcome?.message).toContain(propertyPath);
    }
  );

  it('rejects explicit undefined property on rootFragment', () => {
    const withUndefined: Record<string, unknown> = {
      path: 'src',
      rootNodes: [],
    };
    Object.defineProperty(withUndefined, 'dependencyEdges', {
      enumerable: true,
      value: void 0,
    });
    const outcomes = validateRootFragments([withUndefined], 'faf.locals[0]');
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe(
      'faf.locals[0].rootFragments[0].dependencyEdges'
    );
    expect(outcome?.message).toBe(
      "'faf.locals[0].rootFragments[0].dependencyEdges' cannot be explicitly undefined"
    );
  });
});

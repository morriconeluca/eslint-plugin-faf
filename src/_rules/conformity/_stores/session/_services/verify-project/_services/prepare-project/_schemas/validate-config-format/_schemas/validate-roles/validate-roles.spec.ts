import { describe, expect, it } from 'vitest';

import type { TConfigConstraint } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { OUTCOME_CATALOG } from '../../../../../../../../../../_conformity@shared/_configs/outcome-catalog.config.js';
import { validateRoles } from './validate-roles.schema.js';

describe('validateRoles', () => {
  it('returns empty collections when roles is undefined', () => {
    const result = validateRoles(undefined, 'faf.common');
    expect(result.roleEntries).toHaveLength(0);
    expect(result.extensionEntries).toHaveLength(0);
    expect(result.outcomes).toHaveLength(0);
  });

  it('rejects null roles', () => {
    const validation = validateRoles(null, 'faf.common');
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles');
    expect(outcome?.element).toBe('faf.common.roles');
    expect(outcome?.message).toBe("'faf.common.roles' cannot be null");
  });

  it('rejects non-array roles', () => {
    const validation = validateRoles('util', 'faf.common');
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles');
    expect(outcome?.element).toBe('faf.common.roles');
    expect(outcome?.message).toBe("'faf.common.roles' has an invalid type");
  });

  it('rejects null element in roles list', () => {
    const validation = validateRoles([null], 'faf.common');
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0]');
    expect(outcome?.element).toBe('faf.common.roles[0]');
    expect(outcome?.message).toBe("'faf.common.roles[0]' cannot be null");
  });

  it('rejects primitive element in roles list', () => {
    const validation = validateRoles(['invalid'], 'faf.common');
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0]');
    expect(outcome?.element).toBe('faf.common.roles[0]');
    expect(outcome?.message).toBe("'faf.common.roles[0]' has an invalid type");
  });

  it('rejects empty role group', () => {
    const validation = validateRoles([[]], 'faf.common');
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/empty-list');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0]');
    expect(outcome?.element).toBe('faf.common.roles[0]');
    expect(outcome?.message).toBe(
      "'faf.common.roles[0]' cannot be an empty list"
    );
  });

  it('rejects null element inside role group', () => {
    const validation = validateRoles([[null]], 'faf.common');
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0][0]');
    expect(outcome?.element).toBe('faf.common.roles[0][0]');
    expect(outcome?.message).toBe("'faf.common.roles[0][0]' cannot be null");
  });

  it('rejects further nesting of role groups', () => {
    const validation = validateRoles(
      [[[{ category: '_utils', name: 'util' }]]],
      'faf.common'
    );
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0][0]');
    expect(outcome?.element).toBe('faf.common.roles[0][0]');
    expect(outcome?.message).toBe(
      "'faf.common.roles[0][0]' has an invalid type"
    );
  });

  it('rejects non-object item inside role group', () => {
    const validation = validateRoles([[123]], 'faf.common');
    expect(validation.outcomes).toHaveLength(1);
    const outcome = validation.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0][0]');
    expect(outcome?.element).toBe('faf.common.roles[0][0]');
    expect(outcome?.message).toBe(
      "'faf.common.roles[0][0]' has an invalid type"
    );
  });

  it('accepts valid single role and role group with options', () => {
    const result = validateRoles(
      [
        [
          {
            category: '_fonts',
            implicitRoleExtensions: ['.woff2'],
            name: 'font',
          },
        ],
        {
          allowMultipleSymbols: true,
          category: '_utils',
          isCategoryNode: false,
          name: 'util',
        },
      ],
      'faf.common'
    );
    expect(result.outcomes).toHaveLength(0);
    expect(result.roleEntries).toHaveLength(2);
    expect(result.extensionEntries).toHaveLength(1);
  });

  const undefinedRecord: Record<string, unknown> = {
    category: '_utils',
    name: 'util',
  };
  Object.defineProperty(undefinedRecord, 'allowMultipleSymbols', {
    enumerable: true,
    value: void 0,
  });

  const testCases: readonly {
    readonly constraint: TConfigConstraint;
    readonly message: string;
    readonly normativeReference: string;
    readonly payload: unknown;
    readonly propertyPath: string;
  }[] = [
    {
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'D-14',
      payload: [{ category: '_utils', extra: true, name: 'util' }],
      propertyPath: 'faf.common.roles[0].extra',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "allowMultipleSymbols" cannot be null.',
      normativeReference: 'D-14',
      payload: [
        { allowMultipleSymbols: null, category: '_utils', name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/explicit-undefined',
      message:
        'Property "allowMultipleSymbols" cannot be explicitly undefined.',
      normativeReference: 'D-14',
      payload: [undefinedRecord],
      propertyPath: 'faf.common.roles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "name" is missing.',
      normativeReference: 'D-14',
      payload: [{ category: '_utils' }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "name" is missing.',
      normativeReference: 'D-14',
      payload: [{ category: '_fonts', implicitRoleExtensions: ['.woff2'] }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "name" must be a string.',
      normativeReference: 'D-14',
      payload: [{ category: '_utils', name: 123 }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Property "name" cannot be empty.',
      normativeReference: 'D-14',
      payload: [{ category: '_utils', name: '' }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "category" is missing.',
      normativeReference: 'D-14',
      payload: [{ name: 'util' }],
      propertyPath: 'faf.common.roles[0].category',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "category" must be a string.',
      normativeReference: 'D-14',
      payload: [{ category: 123, name: 'util' }],
      propertyPath: 'faf.common.roles[0].category',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Property "category" cannot be empty.',
      normativeReference: 'D-14',
      payload: [{ category: '', name: 'util' }],
      propertyPath: 'faf.common.roles[0].category',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "allowMultipleSymbols" must be a boolean.',
      normativeReference: 'D-14',
      payload: [
        { allowMultipleSymbols: 'true', category: '_utils', name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "isCategoryNode" must be a boolean.',
      normativeReference: 'D-14',
      payload: [{ category: '_utils', isCategoryNode: 'true', name: 'util' }],
      propertyPath: 'faf.common.roles[0].isCategoryNode',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "implicitRoleExtensions" must be an array.',
      normativeReference: 'D-14',
      payload: [
        { category: '_utils', implicitRoleExtensions: '.png', name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions',
    },
    {
      constraint: 'configuration/empty-list',
      message: 'Property "implicitRoleExtensions" cannot be empty.',
      normativeReference: 'D-14',
      payload: [
        { category: '_utils', implicitRoleExtensions: [], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions',
    },
    {
      constraint: 'configuration/implicit-extension-category-node-mismatch',
      message:
        'Role with implicit extensions cannot set isCategoryNode to false.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        {
          category: '_utils',
          implicitRoleExtensions: ['.png'],
          isCategoryNode: false,
          name: 'util',
        },
      ],
      propertyPath: 'faf.common.roles[0].isCategoryNode',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Implicit extension cannot be null.',
      normativeReference: 'D-14',
      payload: [
        { category: '_utils', implicitRoleExtensions: [null], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Implicit extension must be a string.',
      normativeReference: 'D-14',
      payload: [
        { category: '_utils', implicitRoleExtensions: [123], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Implicit extension cannot be empty.',
      normativeReference: 'D-14',
      payload: [
        { category: '_utils', implicitRoleExtensions: [''], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message: 'Implicit extension "png" must start with a leading dot.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['png'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message: 'Implicit extension ".dir/png" cannot be a path.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        {
          category: '_utils',
          implicitRoleExtensions: ['.dir/png'],
          name: 'util',
        },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message: 'Implicit extension ".png*" cannot contain pattern characters.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.png*'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".ts" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.ts'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".tsx" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.tsx'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".js" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.js'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".jsx" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.jsx'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".mjs" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.mjs'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".cjs" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.cjs'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".mts" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.mts'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".cts" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'FAF §6.3.1',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.cts'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate implicit extension ".png" in the same role.',
      normativeReference: 'D-14',
      payload: [
        {
          category: '_utils',
          implicitRoleExtensions: ['.png', '.png'],
          name: 'util',
        },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[1]',
    },
  ];

  it.each(testCases)(
    'rejects invalid role configuration producing $constraint',
    ({ constraint, payload, propertyPath }) => {
      const validation = validateRoles(payload, 'faf.common');
      expect(validation.outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = validation.outcomes.find(
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
});

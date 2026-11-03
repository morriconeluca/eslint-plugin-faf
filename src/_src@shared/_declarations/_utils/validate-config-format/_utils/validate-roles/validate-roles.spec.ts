import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';

import { validateRoles } from './validate-roles.util.js';

describe('validateRoles', () => {
  it('returns empty collections when roles is undefined', () => {
    const outcomes: TConfigOutcome[] = [];
    const result = validateRoles(undefined, 'faf.common', outcomes);
    expect(result.roleEntries).toHaveLength(0);
    expect(result.extensionEntries).toHaveLength(0);
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null roles', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles(null, 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.roles');
    expect(outcome?.element).toBe('faf.common.roles');
    expect(outcome?.message).toBe('Property "roles" cannot be null.');
  });

  it('rejects non-array roles', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles('util', 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.roles');
    expect(outcome?.element).toBe('faf.common.roles');
    expect(outcome?.message).toBe('Property "roles" must be an array.');
  });

  it('rejects null element in roles list', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles([null], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0]');
    expect(outcome?.element).toBe('faf.common.roles[0]');
    expect(outcome?.message).toBe('Role element cannot be null.');
  });

  it('rejects primitive element in roles list', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles(['invalid'], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0]');
    expect(outcome?.element).toBe('faf.common.roles[0]');
    expect(outcome?.message).toBe('Role element must be an object.');
  });

  it('rejects empty role group', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles([[]], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/empty-list');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_3');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0]');
    expect(outcome?.element).toBe('faf.common.roles[0]');
    expect(outcome?.message).toBe('Role group cannot be empty.');
  });

  it('rejects null element inside role group', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles([[null]], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0][0]');
    expect(outcome?.element).toBe('faf.common.roles[0][0]');
    expect(outcome?.message).toBe('Role element cannot be null.');
  });

  it('rejects further nesting of role groups', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles(
      [[[{ category: '_utils', name: 'util' }]]],
      'faf.common',
      outcomes
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_3');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0][0]');
    expect(outcome?.element).toBe('faf.common.roles[0][0]');
    expect(outcome?.message).toBe(
      'Further nesting of role groups is forbidden.'
    );
  });

  it('rejects non-object item inside role group', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRoles([[123]], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.roles[0][0]');
    expect(outcome?.element).toBe('faf.common.roles[0][0]');
    expect(outcome?.message).toBe('Role element must be an object.');
  });

  it('accepts valid single role and role group with options', () => {
    const outcomes: TConfigOutcome[] = [];
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
      'faf.common',
      outcomes
    );
    expect(outcomes).toHaveLength(0);
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

  it.each([
    {
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'CONFIG_3',
      payload: [{ category: '_utils', extra: true, name: 'util' }],
      propertyPath: 'faf.common.roles[0].extra',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "allowMultipleSymbols" cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: [
        { allowMultipleSymbols: null, category: '_utils', name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/explicit-undefined',
      message:
        'Property "allowMultipleSymbols" cannot be explicitly undefined.',
      normativeReference: 'CONFIG_2',
      payload: [undefinedRecord],
      propertyPath: 'faf.common.roles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "name" is missing.',
      normativeReference: 'CONFIG_3',
      payload: [{ category: '_utils' }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "name" is missing.',
      normativeReference: 'CONFIG_3',
      payload: [{ category: '_fonts', implicitRoleExtensions: ['.woff2'] }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "name" must be a string.',
      normativeReference: 'CONFIG_2',
      payload: [{ category: '_utils', name: 123 }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Property "name" cannot be empty.',
      normativeReference: 'CONFIG_2',
      payload: [{ category: '_utils', name: '' }],
      propertyPath: 'faf.common.roles[0].name',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "category" is missing.',
      normativeReference: 'CONFIG_3',
      payload: [{ name: 'util' }],
      propertyPath: 'faf.common.roles[0].category',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "category" must be a string.',
      normativeReference: 'CONFIG_2',
      payload: [{ category: 123, name: 'util' }],
      propertyPath: 'faf.common.roles[0].category',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Property "category" cannot be empty.',
      normativeReference: 'CONFIG_2',
      payload: [{ category: '', name: 'util' }],
      propertyPath: 'faf.common.roles[0].category',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "allowMultipleSymbols" must be a boolean.',
      normativeReference: 'CONFIG_2',
      payload: [
        { allowMultipleSymbols: 'true', category: '_utils', name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "isCategoryNode" must be a boolean.',
      normativeReference: 'CONFIG_2',
      payload: [{ category: '_utils', isCategoryNode: 'true', name: 'util' }],
      propertyPath: 'faf.common.roles[0].isCategoryNode',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "implicitRoleExtensions" must be an array.',
      normativeReference: 'CONFIG_2',
      payload: [
        { category: '_utils', implicitRoleExtensions: '.png', name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions',
    },
    {
      constraint: 'configuration/empty-list',
      message: 'Property "implicitRoleExtensions" cannot be empty.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: [], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions',
    },
    {
      constraint: 'configuration/implicit-extension-category-node-mismatch',
      message:
        'Role with implicit extensions cannot set isCategoryNode to false.',
      normativeReference: 'CONFIG_3',
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
      normativeReference: 'CONFIG_2',
      payload: [
        { category: '_utils', implicitRoleExtensions: [null], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Implicit extension must be a string.',
      normativeReference: 'CONFIG_2',
      payload: [
        { category: '_utils', implicitRoleExtensions: [123], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Implicit extension cannot be empty.',
      normativeReference: 'CONFIG_2',
      payload: [
        { category: '_utils', implicitRoleExtensions: [''], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message: 'Implicit extension "png" must start with a leading dot.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['png'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message: 'Implicit extension ".dir/png" cannot be a path.',
      normativeReference: 'CONFIG_3',
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
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.png*'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".ts" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.ts'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".tsx" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.tsx'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".js" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.js'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".jsx" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.jsx'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".mjs" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.mjs'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".cjs" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.cjs'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".mts" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.mts'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/invalid-implicit-extension',
      message:
        'Implicit extension ".cts" cannot be a TypeScript or JavaScript code extension.',
      normativeReference: 'CONFIG_3',
      payload: [
        { category: '_utils', implicitRoleExtensions: ['.cts'], name: 'util' },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate implicit extension ".png" in the same role.',
      normativeReference: 'CONFIG_2',
      payload: [
        {
          category: '_utils',
          implicitRoleExtensions: ['.png', '.png'],
          name: 'util',
        },
      ],
      propertyPath: 'faf.common.roles[0].implicitRoleExtensions[1]',
    },
  ])(
    'rejects invalid role configuration producing $constraint',
    ({ constraint, message, normativeReference, payload, propertyPath }) => {
      const outcomes: TConfigOutcome[] = [];
      validateRoles(payload, 'faf.common', outcomes);
      expect(outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = outcomes.find(
        (o) => o.constraint === constraint && o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(normativeReference);
      expect(outcome?.message).toBe(message);
    }
  );
});

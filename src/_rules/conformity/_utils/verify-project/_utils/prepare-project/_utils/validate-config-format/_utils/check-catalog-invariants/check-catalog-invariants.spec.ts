import { describe, expect, it } from 'vitest';

import { checkCatalogInvariants } from './check-catalog-invariants.util.js';

describe('checkCatalogInvariants', () => {
  it('passes for empty catalog entries', () => {
    const outcomes = checkCatalogInvariants(
      { extensionEntries: [], roleEntries: [] },
      []
    );
    expect(outcomes).toHaveLength(0);
  });

  it('passes for distinct roles, categories, and non-conflicting extensions', () => {
    const outcomes = checkCatalogInvariants(
      {
        extensionEntries: [
          {
            extension: '.woff2',
            path: 'faf.common.roles[0].implicitRoleExtensions[0]',
            roleName: 'font',
          },
          {
            extension: '.png',
            path: 'faf.common.roles[1].implicitRoleExtensions[0]',
            roleName: 'image',
          },
        ],
        roleEntries: [
          { category: '_fonts', name: 'font', path: 'faf.common.roles[0]' },
          { category: '_images', name: 'image', path: 'faf.common.roles[1]' },
        ],
      },
      [{ name: 'spec', path: 'faf.common.subGraphRoles[0]' }]
    );
    expect(outcomes).toHaveLength(0);
  });

  it('rejects duplicate role names', () => {
    const outcomes = checkCatalogInvariants(
      {
        extensionEntries: [],
        roleEntries: [
          { category: '_utils', name: 'util', path: 'faf.common.roles[0]' },
          { category: '_helpers', name: 'util', path: 'faf.common.roles[1]' },
        ],
      },
      []
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/duplicate-role-name');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §6.3.1');
    expect(outcome?.propertyPath).toBe('faf.common.roles[1].name');
    expect(outcome?.element).toBe('faf.common.roles[1].name');
    expect(outcome?.message).toBe(
      '\'faf.common.roles[1].name\' is declared more than once in the role catalog: Duplicate role name "util"'
    );
  });

  it('rejects duplicate category across roles', () => {
    const outcomes = checkCatalogInvariants(
      {
        extensionEntries: [],
        roleEntries: [
          { category: '_utils', name: 'util', path: 'faf.common.roles[0]' },
          { category: '_utils', name: 'helper', path: 'faf.common.roles[1]' },
        ],
      },
      []
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/duplicate-category');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §6.3.1');
    expect(outcome?.propertyPath).toBe('faf.common.roles[1].category');
    expect(outcome?.element).toBe('faf.common.roles[1].category');
    expect(outcome?.message).toBe(
      '\'faf.common.roles[1].category\' is declared more than once in the role catalog: Category is already assigned to another role "_utils"'
    );
  });

  it('rejects duplicate sub-graph role names', () => {
    const outcomes = checkCatalogInvariants(
      { extensionEntries: [], roleEntries: [] },
      [
        { name: 'spec', path: 'faf.common.subGraphRoles[0]' },
        { name: 'spec', path: 'faf.common.subGraphRoles[1]' },
      ]
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/duplicate-role-name');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §6.3.1');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[1].name');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[1].name');
    expect(outcome?.message).toBe(
      '\'faf.common.subGraphRoles[1].name\' is declared more than once in the role catalog: Duplicate sub-graph role name "spec"'
    );
  });

  it('rejects conflict between role name and sub-graph role name', () => {
    const outcomes = checkCatalogInvariants(
      {
        extensionEntries: [],
        roleEntries: [
          { category: '_specs', name: 'spec', path: 'faf.common.roles[0]' },
        ],
      },
      [{ name: 'spec', path: 'faf.common.subGraphRoles[0]' }]
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/role-name-conflict');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §6.3.1');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0].name');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[0].name');
    expect(outcome?.message).toBe(
      '\'faf.common.subGraphRoles[0].name\' conflicts with a standard role name: Sub-graph role "spec" conflicts with standard role name'
    );
  });

  it('rejects same implicit extension assigned to different roles', () => {
    const outcomes = checkCatalogInvariants(
      {
        extensionEntries: [
          {
            extension: '.png',
            path: 'faf.common.roles[0].implicitRoleExtensions[0]',
            roleName: 'image',
          },
          {
            extension: '.png',
            path: 'faf.common.roles[1].implicitRoleExtensions[0]',
            roleName: 'photo',
          },
        ],
        roleEntries: [
          { category: '_images', name: 'image', path: 'faf.common.roles[0]' },
          { category: '_photos', name: 'photo', path: 'faf.common.roles[1]' },
        ],
      },
      []
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe(
      'configuration/duplicate-implicit-extension'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §6.3.1');
    expect(outcome?.propertyPath).toBe(
      'faf.common.roles[1].implicitRoleExtensions[0]'
    );
    expect(outcome?.element).toBe(
      'faf.common.roles[1].implicitRoleExtensions[0]'
    );
    expect(outcome?.message).toBe(
      '\'faf.common.roles[1].implicitRoleExtensions[0]\' is declared more than once across roles: Implicit extension ".png" is already associated with role "image"'
    );
  });

  it('rejects implicit extension whose first segment matches a role name or sub-graph role name', () => {
    const outcomes = checkCatalogInvariants(
      {
        extensionEntries: [
          {
            extension: '.module.css',
            path: 'faf.common.roles[1].implicitRoleExtensions[0]',
            roleName: 'style',
          },
          {
            extension: '.spec.json',
            path: 'faf.common.roles[2].implicitRoleExtensions[0]',
            roleName: 'fixture',
          },
        ],
        roleEntries: [
          { category: '_modules', name: 'module', path: 'faf.common.roles[0]' },
          { category: '_styles', name: 'style', path: 'faf.common.roles[1]' },
          {
            category: '_fixtures',
            name: 'fixture',
            path: 'faf.common.roles[2]',
          },
        ],
      },
      [{ name: 'spec', path: 'faf.common.subGraphRoles[0]' }]
    );
    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.constraint).toBe(
      'configuration/implicit-extension-role-name-prefix'
    );
    expect(outcomes[0]?.family).toBe('configuration');
    expect(outcomes[0]?.normativeReference).toBe('FAF §6.3.1');
    expect(outcomes[0]?.message).toBe(
      '\'faf.common.roles[1].implicitRoleExtensions[0]\' cannot start with a segment matching a role name: First segment "module" of implicit extension ".module.css" cannot match a role name'
    );
    expect(outcomes[1]?.constraint).toBe(
      'configuration/implicit-extension-role-name-prefix'
    );
    expect(outcomes[1]?.family).toBe('configuration');
    expect(outcomes[1]?.normativeReference).toBe('FAF §6.3.1');
    expect(outcomes[1]?.message).toBe(
      '\'faf.common.roles[2].implicitRoleExtensions[0]\' cannot start with a segment matching a role name: First segment "spec" of implicit extension ".spec.json" cannot match a role name'
    );
  });
});

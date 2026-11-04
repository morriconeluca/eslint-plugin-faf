import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { checkCatalogInvariants } from './check-catalog-invariants.util.js';

describe('checkCatalogInvariants', () => {
  it('passes for empty catalog entries', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
      { extensionEntries: [], roleEntries: [] },
      [],
      outcomes
    );
    expect(outcomes).toHaveLength(0);
  });

  it('passes for distinct roles, categories, and non-conflicting extensions', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
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
      [{ name: 'spec', path: 'faf.common.subGraphRoles[0]' }],
      outcomes
    );
    expect(outcomes).toHaveLength(0);
  });

  it('rejects duplicate role names', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
      {
        extensionEntries: [],
        roleEntries: [
          { category: '_utils', name: 'util', path: 'faf.common.roles[0]' },
          { category: '_helpers', name: 'util', path: 'faf.common.roles[1]' },
        ],
      },
      [],
      outcomes
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/duplicate-role-name');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_3');
    expect(outcome?.propertyPath).toBe('faf.common.roles[1].name');
    expect(outcome?.element).toBe('faf.common.roles[1].name');
    expect(outcome?.message).toBe('Duplicate role name "util".');
  });

  it('rejects duplicate category across roles', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
      {
        extensionEntries: [],
        roleEntries: [
          { category: '_utils', name: 'util', path: 'faf.common.roles[0]' },
          { category: '_utils', name: 'helper', path: 'faf.common.roles[1]' },
        ],
      },
      [],
      outcomes
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/duplicate-category');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_3');
    expect(outcome?.propertyPath).toBe('faf.common.roles[1].category');
    expect(outcome?.element).toBe('faf.common.roles[1].category');
    expect(outcome?.message).toBe(
      'Category is already assigned to another role "_utils".'
    );
  });

  it('rejects duplicate sub-graph role names', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
      { extensionEntries: [], roleEntries: [] },
      [
        { name: 'spec', path: 'faf.common.subGraphRoles[0]' },
        { name: 'spec', path: 'faf.common.subGraphRoles[1]' },
      ],
      outcomes
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/duplicate-role-name');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_3');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[1].name');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[1].name');
    expect(outcome?.message).toBe('Duplicate sub-graph role name "spec".');
  });

  it('rejects conflict between role name and sub-graph role name', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
      {
        extensionEntries: [],
        roleEntries: [
          { category: '_specs', name: 'spec', path: 'faf.common.roles[0]' },
        ],
      },
      [{ name: 'spec', path: 'faf.common.subGraphRoles[0]' }],
      outcomes
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/role-name-conflict');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_3');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0].name');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[0].name');
    expect(outcome?.message).toBe(
      'Sub-graph role "spec" conflicts with standard role name.'
    );
  });

  it('rejects same implicit extension assigned to different roles', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
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
      [],
      outcomes
    );
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe(
      'configuration/duplicate-implicit-extension'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_3');
    expect(outcome?.propertyPath).toBe(
      'faf.common.roles[1].implicitRoleExtensions[0]'
    );
    expect(outcome?.element).toBe(
      'faf.common.roles[1].implicitRoleExtensions[0]'
    );
    expect(outcome?.message).toBe(
      'Implicit extension ".png" is already associated with role "image".'
    );
  });

  it('rejects implicit extension whose first segment matches a role name or sub-graph role name', () => {
    const outcomes: TConfigOutcome[] = [];
    checkCatalogInvariants(
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
      [{ name: 'spec', path: 'faf.common.subGraphRoles[0]' }],
      outcomes
    );
    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.constraint).toBe(
      'configuration/implicit-extension-role-name-prefix'
    );
    expect(outcomes[0]?.family).toBe('configuration');
    expect(outcomes[0]?.normativeReference).toBe('CONFIG_3');
    expect(outcomes[0]?.message).toBe(
      'First segment "module" of implicit extension ".module.css" cannot match a role name.'
    );
    expect(outcomes[1]?.constraint).toBe(
      'configuration/implicit-extension-role-name-prefix'
    );
    expect(outcomes[1]?.family).toBe('configuration');
    expect(outcomes[1]?.normativeReference).toBe('CONFIG_3');
    expect(outcomes[1]?.message).toBe(
      'First segment "spec" of implicit extension ".spec.json" cannot match a role name.'
    );
  });
});

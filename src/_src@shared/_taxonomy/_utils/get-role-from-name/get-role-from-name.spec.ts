import { describe, expect, it } from 'vitest';

import type {
  TEffectiveCatalog,
  TEffectiveRole,
} from '../../../_declarations/_types/declarations.type.js';
import type { TRoleAttribution } from '../../_types/classification.type.js';

import { getRoleFromName } from './index.js';

const createCatalog = (parameters: {
  roles: readonly {
    category?: string;
    implicitExtensions?: readonly string[];
    name: string;
  }[];
  subGraphRoles?: readonly string[];
}): TEffectiveCatalog => {
  const roles: readonly TEffectiveRole[] = parameters.roles.map(
    (roleDefinition, index) => ({
      allowMultipleSymbols: false,
      category: roleDefinition.category ?? `_${roleDefinition.name}s`,
      form: 'fragments' as const,
      implicitExtensions: roleDefinition.implicitExtensions ?? [],
      name: roleDefinition.name,
      rank: index,
    })
  );

  const categoryToRole = new Map<string, TEffectiveRole>();
  const extensionToRole = new Map<string, TEffectiveRole>();

  for (const role of roles) {
    categoryToRole.set(role.category, role);
    for (const extension of role.implicitExtensions) {
      extensionToRole.set(extension, role);
    }
  }

  return {
    categoryToRole,
    extensionToRole,
    roles,
    subGraphRoles: parameters.subGraphRoles ?? [],
    topRank: roles.length + 1,
  };
};

describe('getRoleFromName', () => {
  const standardCatalog = createCatalog({
    roles: [
      { name: 'component' },
      { name: 'hook' },
      { name: 'type' },
      { name: 'module' },
      { name: 'util' },
      { implicitExtensions: ['.tar.gz'], name: 'archive' },
      { implicitExtensions: ['.css'], name: 'style' },
    ],
    subGraphRoles: ['spec'],
  });

  describe('determining role from file nomenclature', () => {
    it.each<[string, TRoleAttribution]>([
      ['button.component.tsx', { kind: 'explicit', roleName: 'component' }],
      ['button.module.css', { kind: 'explicit', roleName: 'module' }],
      ['user-profile.type.ts', { kind: 'explicit', roleName: 'type' }],
      ['bundle.archive.tar.gz', { kind: 'explicit', roleName: 'archive' }],
      ['bundle.tar.gz', { kind: 'implicit', roleName: 'archive' }],
      ['index.ts', { kind: 'absent', roleName: null }],
      ['button.component.hook.tsx', { kind: 'absent', roleName: null }],
      ['example.util.spec.ts', { kind: 'absent', roleName: null }],
      ['user.profile.type.ts', { kind: 'absent', roleName: null }],
      ['button.unknown.ts', { kind: 'absent', roleName: null }],
      ['globals.d.ts', { kind: 'absent', roleName: null }],
    ])('evaluates "%s" to attribution %o', (fileName, expected) => {
      expect(getRoleFromName(fileName, standardCatalog)).toEqual(expected);
    });
  });

  describe('disjoint explicit and implicit forms', () => {
    it('attributes explicit role when file extension matches implicit asset extension', () => {
      expect(getRoleFromName('button.module.css', standardCatalog)).toEqual({
        kind: 'explicit',
        roleName: 'module',
      });
    });
  });

  describe('implicit asset role nomenclature validation', () => {
    it.each<[string, TRoleAttribution]>([
      ['theme.css', { kind: 'implicit', roleName: 'style' }],
      ['dark-theme.css', { kind: 'implicit', roleName: 'style' }],
      ['theme.dark.css', { kind: 'absent', roleName: null }],
    ])('evaluates asset "%s" to attribution %o', (fileName, expected) => {
      expect(getRoleFromName(fileName, standardCatalog)).toEqual(expected);
    });
  });

  describe('sub-graph role attribution', () => {
    it.each<[string, TRoleAttribution]>([
      ['button.spec.tsx', { kind: 'explicit', roleName: 'spec' }],
      ['user-profile.spec.ts', { kind: 'explicit', roleName: 'spec' }],
      ['bundle.spec.tar.gz', { kind: 'explicit', roleName: 'spec' }],
    ])(
      'evaluates sub-graph file "%s" to attribution %o',
      (fileName, expected) => {
        expect(getRoleFromName(fileName, standardCatalog)).toEqual(expected);
      }
    );
  });

  describe('boundary and invalid file nomenclatures', () => {
    it.each<[string, TRoleAttribution]>([
      ['', { kind: 'absent', roleName: null }],
      ['Makefile', { kind: 'absent', roleName: null }],
      ['README', { kind: 'absent', roleName: null }],
      ['LICENSE', { kind: 'absent', roleName: null }],
      ['.eslintrc', { kind: 'absent', roleName: null }],
      ['.gitignore', { kind: 'absent', roleName: null }],
      ['.component.tsx', { kind: 'absent', roleName: null }],
      ['.hidden.component.tsx', { kind: 'absent', roleName: null }],
      ['.tar.gz', { kind: 'absent', roleName: null }],
      ['.css', { kind: 'absent', roleName: null }],
      ['.', { kind: 'absent', roleName: null }],
      ['..', { kind: 'absent', roleName: null }],
      ['...', { kind: 'absent', roleName: null }],
      ['button.', { kind: 'absent', roleName: null }],
      ['button.component.', { kind: 'absent', roleName: null }],
      ['theme.css.', { kind: 'absent', roleName: null }],
      ['button..tsx', { kind: 'absent', roleName: null }],
      ['button..component.tsx', { kind: 'absent', roleName: null }],
      ['theme..css', { kind: 'absent', roleName: null }],
      ['button.component', { kind: 'absent', roleName: null }],
      ['button.componentx', { kind: 'absent', roleName: null }],
      ['component.tsx', { kind: 'absent', roleName: null }],
      ['button.archive.tar.gz.bak', { kind: 'absent', roleName: null }],
      ['button.other.tar.gz', { kind: 'absent', roleName: null }],
      ['bundle.archive.tar.gz.extra', { kind: 'absent', roleName: null }],
    ])(
      'evaluates boundary input "%s" to attribution %o',
      (fileName, expected) => {
        expect(getRoleFromName(fileName, standardCatalog)).toEqual(expected);
      }
    );
  });
});

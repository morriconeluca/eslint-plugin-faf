import { describe, expect, it } from 'vitest';

import { composeCatalog } from './compose-catalog.util.js';

describe('composeCatalog', () => {
  it('assigns positional rank to individual roles and groups', () => {
    const catalog = composeCatalog(
      [
        [
          {
            category: '_fonts',
            implicitRoleExtensions: ['.woff2'],
            name: 'font',
          },
          {
            category: '_images',
            implicitRoleExtensions: ['.png'],
            name: 'image',
          },
        ],
        { category: '_types', isCategoryNode: true, name: 'type' },
        { category: '_components', name: 'component' },
      ],
      [{ name: 'spec' }, { name: 'story' }]
    );

    expect(catalog.topRank).toBe(3);
    expect(catalog.subGraphRoles).toEqual(['spec', 'story']);

    const font = catalog.roles.find((role) => role.name === 'font');
    const image = catalog.roles.find((role) => role.name === 'image');
    const type = catalog.roles.find((role) => role.name === 'type');
    const component = catalog.roles.find((role) => role.name === 'component');

    expect(font?.rank).toBe(0);
    expect(image?.rank).toBe(0);
    expect(type?.rank).toBe(1);
    expect(component?.rank).toBe(2);

    expect(font?.form).toBe('category-nodes');
    expect(image?.form).toBe('category-nodes');
    expect(type?.form).toBe('category-nodes');
    expect(component?.form).toBe('fragments');

    expect(catalog.categoryToRole.get('_fonts')).toBe(font);
    expect(catalog.categoryToRole.get('_components')).toBe(component);

    expect(catalog.extensionToRole.get('.woff2')).toBe(font);
    expect(catalog.extensionToRole.get('.png')).toBe(image);
    expect(catalog.extensionToRole.get('.unknown')).toBeUndefined();
  });

  it('defaults allowMultipleSymbols to false and honors true', () => {
    const catalog = composeCatalog(
      [
        { category: '_utils', name: 'util' },
        {
          allowMultipleSymbols: true,
          category: '_constants',
          isCategoryNode: true,
          name: 'constant',
        },
      ],
      []
    );

    const util = catalog.roles.find((role) => role.name === 'util');
    const constant = catalog.roles.find((role) => role.name === 'constant');

    expect(util?.allowMultipleSymbols).toBe(false);
    expect(constant?.allowMultipleSymbols).toBe(true);
  });

  it('handles empty roles and subGraphRoles catalog', () => {
    const catalog = composeCatalog([], []);
    expect(catalog.topRank).toBe(0);
    expect(catalog.roles).toHaveLength(0);
    expect(catalog.subGraphRoles).toHaveLength(0);
    expect(catalog.categoryToRole.size).toBe(0);
    expect(catalog.extensionToRole.size).toBe(0);
  });

  it('derives category-nodes form when implicit extensions are provided without isCategoryNode flag', () => {
    const catalog = composeCatalog(
      [
        {
          category: '_styles',
          implicitRoleExtensions: ['.css'],
          name: 'style',
        },
      ],
      []
    );

    const style = catalog.roles.find((role) => role.name === 'style');
    expect(style?.form).toBe('category-nodes');
    expect(style?.implicitExtensions).toEqual(['.css']);
  });
});

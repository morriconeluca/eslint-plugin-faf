import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { prepareProject } from './prepare-project.service.js';

const roles = `roles: [{ name: 'util', category: '_utils' }], subGraphRoles: [{ name: 'spec' }],`;

describe('prepareProject', () => {
  it('stops when faf.config.ts cannot be loaded', async () => {
    const fixture = await createFixture({});
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.outcomes[0]?.constraint).toBe(
          'configuration/missing-config-file'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('stops when package.json is not a regular file', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json/not-a-file': 'x',
      'src/.keep': '',
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.outcomes[0]?.constraint).toBe(
          'configuration/invalid-package-json'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('stops when aliases are declared in both sources', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { common: { aliases: { '#a': './a.ts' } }, locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json': JSON.stringify({
        imports: { '#b': './b.ts' },
        type: 'module',
      }),
      'src/.keep': '',
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.outcomes[0]?.family).toBe('configuration');
      }
    } finally {
      await fixture.rm();
    }
  });

  it('stops when roles are missing', async () => {
    const fixture = await createFixture({
      'faf.config.ts':
        "export default { faf: { locals: [{ rootLayers: ['src'] }] } };",
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.outcomes[0]?.constraint).toBe(
          'configuration/missing-roles'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('stops when a declared origin cannot be listed', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['missing'] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.outcomes.length).toBeGreaterThan(0);
      }
    } finally {
      await fixture.rm();
    }
  });

  it('stops when a reference does not exist in the inventory', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['src'], externalDependencies: [{ from: ['src/main.ts'], to: ['missing.json'] }] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
      'src/main.ts': 'export const main = 1;\n',
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.outcomes[0]?.constraint).toBe(
          'configuration/non-existent-path'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns ready result with effective declarations containing aliases', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { common: { aliases: { '#shared': 'src' } }, locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
      'src/main.ts': 'export const main = 1;\n',
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('ready');
      if (result.kind === 'ready') {
        expect(result.declarations.aliases).toHaveLength(1);
        expect(result.declarations.aliases[0]?.prefix).toBe('#shared');
      }
    } finally {
      await fixture.rm();
    }
  });

  it('composes subCategoryHierarchies and horizontalHierarchies when direct children exist, and blocks when a member is missing', async () => {
    const validFixture = await createFixture({
      'faf.config.ts': `export default { faf: { common: { subCategoryHierarchies: [[['_atoms'], ['_molecules']]] }, locals: [{ ${roles} horizontalHierarchies: [{ hierarchy: [['_domain'], ['_ui']], path: 'src' }], rootLayers: ['src'] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
      'src/_domain/.keep': '',
      'src/_ui/.keep': '',
    });
    try {
      const ready = prepareProject(
        nodePath.join(validFixture.path, 'faf.config.ts')
      );
      expect(ready.kind).toBe('ready');
      if (ready.kind === 'ready') {
        expect(ready.declarations.trees[0]?.subCategoryHierarchies).toEqual([
          [['_atoms'], ['_molecules']],
        ]);
        expect(ready.declarations.trees[0]?.horizontalHierarchies).toEqual([
          { hierarchy: [['_domain'], ['_ui']], path: 'src' },
        ]);
      }
    } finally {
      await validFixture.rm();
    }

    const missingChildFixture = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ ${roles} horizontalHierarchies: [{ hierarchy: [['_domain'], ['_missing']], path: 'src' }], rootLayers: ['src'] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
      'src/_domain/.keep': '',
    });
    try {
      const blocked = prepareProject(
        nodePath.join(missingChildFixture.path, 'faf.config.ts')
      );
      expect(blocked.kind).toBe('blocked');
      if (blocked.kind === 'blocked') {
        expect(blocked.outcomes[0]?.constraint).toBe(
          'configuration/non-existent-path'
        );
      }
    } finally {
      await missingChildFixture.rm();
    }
  });
});

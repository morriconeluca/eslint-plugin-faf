import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { prepareProject } from './index.js';

const roles = `roles: [{ name: 'util', category: '_utils' }], subGraphRoles: [{ name: 'spec' }],`;

describe('prepareProject', () => {
  it('stops when fafconfig.ts cannot be loaded', async () => {
    const fixture = await createFixture({});
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'fafconfig.ts')
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
      'fafconfig.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json/not-a-file': 'x',
      'src/.keep': '',
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'fafconfig.ts')
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
      'fafconfig.ts': `export default { faf: { common: { aliases: { '#a': './a.ts' } }, locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json': JSON.stringify({
        imports: { '#b': './b.ts' },
        type: 'module',
      }),
      'src/.keep': '',
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'fafconfig.ts')
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
      'fafconfig.ts':
        "export default { faf: { locals: [{ rootLayers: ['src'] }] } };",
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'fafconfig.ts')
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
      'fafconfig.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['missing'] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'fafconfig.ts')
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
      'fafconfig.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['src'], externalDependencies: [{ from: ['src/main.ts'], to: ['missing.json'] }] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
      'src/main.ts': 'export const main = 1;\n',
    });
    try {
      const result = prepareProject(
        nodePath.join(fixture.path, 'fafconfig.ts')
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
});

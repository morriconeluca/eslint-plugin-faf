import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { resolveDeclarations } from './resolve-declarations.stage.js';

const roles = `roles: [{ name: 'util', category: '_utils' }], subGraphRoles: [{ name: 'spec' }],`;

describe('resolveDeclarations', () => {
  it('blocks when faf.config.ts cannot be loaded', async () => {
    const fixture = await createFixture({});
    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const result = resolveDeclarations(configPath);
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.baseDirectory).toBe(fixture.path);
        expect(result.configPath).toBe(configPath);
        expect(result.loadedFiles).toEqual([]);
        expect(result.outcomes[0]?.constraint).toBe(
          'configuration/missing-config-file'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('blocks when config format validation fails', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['src'] }] }, extra: true };`,
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const result = resolveDeclarations(configPath);
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.loadedFiles).toContain(configPath);
        expect(result.outcomes[0]?.constraint).toBe(
          'configuration/unknown-property'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('blocks when package.json is not a regular file', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json/not-a-file': 'x',
    });
    try {
      const result = resolveDeclarations(
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

  it('blocks when aliases are declared in both package.json and faf.config.ts', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { common: { aliases: { '#a': 'src' } }, locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json': JSON.stringify({
        imports: { '#b': './b.ts' },
        type: 'module',
      }),
    });
    try {
      const result = resolveDeclarations(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(result.kind).toBe('blocked');
      if (result.kind === 'blocked') {
        expect(result.outcomes[0]?.constraint).toBe(
          'configuration/duplicate-alias-source'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('blocks when roles are missing in declaration composition', async () => {
    const fixture = await createFixture({
      'faf.config.ts':
        "export default { faf: { locals: [{ rootLayers: ['src'] }] } };",
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const result = resolveDeclarations(
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

  it('returns ready declarations with aliases, config, and loadedFiles', async () => {
    const fixture = await createFixture({
      'faf.config.ts': `export default { faf: { common: { aliases: { '#shared': 'src' } }, locals: [{ ${roles} rootLayers: ['src'] }] } };`,
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const result = resolveDeclarations(configPath);
      expect(result.kind).toBe('ready');
      if (result.kind === 'ready') {
        expect(result.baseDirectory).toBe(fixture.path);
        expect(result.configPath).toBe(configPath);
        expect(result.loadedFiles).toContain(configPath);
        expect(result.aliases).toEqual([
          { prefix: '#shared', source: 'common.aliases', targets: ['src'] },
        ]);
        expect(result.declarations.aliases).toEqual(result.aliases);
        expect(result.declarations.trees).toHaveLength(1);
        expect(result.config.faf.locals).toHaveLength(1);
      }
    } finally {
      await fixture.rm();
    }
  });
});

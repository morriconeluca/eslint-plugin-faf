import { describe, expect, it } from 'vitest';

import { shouldTraverseExternalDirectory } from './should-traverse-external-directory.util.js';

describe('shouldTraverseExternalDirectory', () => {
  const declaredOrigins = new Set(['packages/core', 'src']);

  it('skips node_modules at root and nested depths', () => {
    expect(
      shouldTraverseExternalDirectory({
        declaredOrigins,
        isAtRoot: true,
        name: 'node_modules',
        relativePath: 'node_modules',
      })
    ).toBe(false);
    expect(
      shouldTraverseExternalDirectory({
        declaredOrigins,
        isAtRoot: false,
        name: 'node_modules',
        relativePath: 'tools/node_modules',
      })
    ).toBe(false);
  });

  it('skips declared tree origins', () => {
    expect(
      shouldTraverseExternalDirectory({
        declaredOrigins,
        isAtRoot: true,
        name: 'src',
        relativePath: 'src',
      })
    ).toBe(false);
    expect(
      shouldTraverseExternalDirectory({
        declaredOrigins,
        isAtRoot: false,
        name: 'core',
        relativePath: 'packages/core',
      })
    ).toBe(false);
  });

  it('skips known VCS, cache, IDE, and tooling-state dot-directories while allowing source dot-directories like .storybook', () => {
    for (const skippedDot of [
      '.agents',
      '.cache',
      '.changeset',
      '.git',
      '.github',
      '.husky',
      '.idea',
      '.next',
      '.nuxt',
      '.pnpm-store',
      '.stryker-tmp',
      '.svelte-kit',
      '.turbo',
      '.vercel',
      '.vscode',
      '.yarn',
    ]) {
      expect(
        shouldTraverseExternalDirectory({
          declaredOrigins,
          isAtRoot: true,
          name: skippedDot,
          relativePath: skippedDot,
        })
      ).toBe(false);
    }

    expect(
      shouldTraverseExternalDirectory({
        declaredOrigins,
        isAtRoot: true,
        name: '.storybook',
        relativePath: '.storybook',
      })
    ).toBe(true);
    expect(
      shouldTraverseExternalDirectory({
        declaredOrigins,
        isAtRoot: false,
        name: '.storybook',
        relativePath: 'apps/web/.storybook',
      })
    ).toBe(true);
  });

  it('skips artifact directories only at root and allows them at nested depths', () => {
    for (const artifactDirectory of [
      'build',
      'coverage',
      'dist',
      'out',
      'reports',
      'tmp',
    ]) {
      expect(
        shouldTraverseExternalDirectory({
          declaredOrigins,
          isAtRoot: true,
          name: artifactDirectory,
          relativePath: artifactDirectory,
        })
      ).toBe(false);
      expect(
        shouldTraverseExternalDirectory({
          declaredOrigins,
          isAtRoot: false,
          name: artifactDirectory,
          relativePath: `__test__/${artifactDirectory}`,
        })
      ).toBe(true);
    }
  });
});

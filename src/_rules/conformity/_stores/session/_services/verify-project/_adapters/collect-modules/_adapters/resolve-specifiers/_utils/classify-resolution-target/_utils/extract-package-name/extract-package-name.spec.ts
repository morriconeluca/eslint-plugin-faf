import { describe, expect, it } from 'vitest';

import { extractPackageName } from './extract-package-name.util.js';

describe('extractPackageName', () => {
  it('extracts unscoped package name from node_modules path', () => {
    expect(extractPackageName('/repo/node_modules/lodash/index.js')).toBe(
      'lodash'
    );
  });

  it('extracts scoped package name from node_modules path', () => {
    expect(
      extractPackageName('/repo/node_modules/@scope/pkg/dist/index.js')
    ).toBe('@scope/pkg');
  });

  it('extracts package name when path starts with node_modules/', () => {
    expect(extractPackageName('node_modules/react/index.js')).toBe('react');
    expect(extractPackageName('node_modules/@types/node/index.d.ts')).toBe(
      '@types/node'
    );
  });

  it('extracts innermost package name from nested node_modules', () => {
    expect(
      extractPackageName(
        '/repo/node_modules/lib-a/node_modules/@nested/lib/index.js'
      )
    ).toBe('@nested/lib');
  });

  it('handles scoped folder without second segment', () => {
    expect(extractPackageName('node_modules/@singleton')).toBe('@singleton');
  });

  it('extracts first segment when path lacks node_modules marker', () => {
    expect(extractPackageName('custom-lib/index.js')).toBe('custom-lib');
  });

  it('returns empty string for empty input', () => {
    expect(extractPackageName('')).toBe('');
  });
});

import { describe, expect, it } from 'vitest';

import { isLibraryPath } from './is-library-path.util.js';

describe('isLibraryPath', () => {
  it('detects a node_modules segment and ignores ordinary paths', () => {
    expect(isLibraryPath('node_modules')).toBe(true);
    expect(isLibraryPath('node_modules/react/index.js')).toBe(true);
    expect(isLibraryPath('src/node_modules/react/index.js')).toBe(true);
    expect(isLibraryPath('src/main.ts')).toBe(false);
  });
});

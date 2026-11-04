import { describe, expect, it } from 'vitest';

import { isLintablePath } from './index.js';

describe('isLintablePath', () => {
  it('accepts each lintable extension and rejects other suffixes', () => {
    expect(isLintablePath('src/main.ts')).toBe(true);
    expect(isLintablePath('src/view.tsx')).toBe(true);
    expect(isLintablePath('src/mod.mts')).toBe(true);
    expect(isLintablePath('src/mod.cts')).toBe(true);
    expect(isLintablePath('src/main.js')).toBe(true);
    expect(isLintablePath('src/view.jsx')).toBe(true);
    expect(isLintablePath('src/mod.mjs')).toBe(true);
    expect(isLintablePath('src/mod.cjs')).toBe(true);
    expect(isLintablePath('src/theme.css')).toBe(false);
    expect(isLintablePath('src/notes.md')).toBe(false);
    expect(isLintablePath('src/Makefile')).toBe(false);
  });
});

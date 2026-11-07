import { describe, expect, it } from 'vitest';

import { produceModuleRecordByExtension } from './produce-module-record-by-extension.util.js';

const SCRIPT_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
] as const;

const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less'] as const;

describe('produceModuleRecordByExtension', () => {
  it.each(SCRIPT_EXTENSIONS)(
    'selects the script producer for %s including declaration files',
    (extension) => {
      const path =
        extension === '.ts' ? `types.d${extension}` : `file${extension}`;
      const record = produceModuleRecordByExtension(
        path,
        'const marker = 1;\n'
      );
      expect(record.language).toBe('script');
      expect(record.symbols.some((symbol) => symbol.name === 'marker')).toBe(
        true
      );
    }
  );

  it('parses a .d.ts path through the script producer', () => {
    const record = produceModuleRecordByExtension(
      'src/types.d.ts',
      'export const marker = 1;\n'
    );
    expect(record.language).toBe('script');
    expect(record.symbols.some((symbol) => symbol.name === 'marker')).toBe(
      true
    );
  });

  it.each(STYLE_EXTENSIONS)(
    'selects the style producer for %s',
    (extension) => {
      const record = produceModuleRecordByExtension(
        `theme${extension}`,
        '@import "./other.css";\n'
      );
      expect(record.language).toBe('style');
      expect(record.imports[0]?.specifier).toBe('./other.css');
    }
  );

  it.each(['.png', '.json', '.woff2', '.md', ''])(
    'selects the binary producer for extension %s',
    (extension) => {
      const path = extension === '' ? 'src/Makefile' : `asset${extension}`;
      const record = produceModuleRecordByExtension(path, 'not used');
      expect(record.language).toBe('binary');
      expect(record.imports).toEqual([]);
      expect(record.symbols).toEqual([]);
      expect(record.exports).toEqual([]);
    }
  );

  it('ignores a dot in a parent segment and a leading dotfile name', () => {
    expect(produceModuleRecordByExtension('dir.old/name', '').language).toBe(
      'binary'
    );
    expect(produceModuleRecordByExtension('.gitignore', '').language).toBe(
      'binary'
    );
    expect(
      produceModuleRecordByExtension('dir.old/name.ts', 'const marker = 1;\n')
        .language
    ).toBe('script');
  });
});

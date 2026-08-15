import { beforeEach, describe, expect, it } from 'vitest';

import type { TFafSettings } from '../../../_types/faf.type.js';

import { clearDirCache } from '../../_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '../../_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '../../_primitives/set-project-root/index.js';
import { resolveImportPath } from './resolve-import-path.util.js';

setProjectRoot(process.cwd());

const settings: TFafSettings = { trees: [] };

describe('resolveImportPath', () => {
  beforeEach(() => {
    clearDirCache();
  });

  it('resolves a plain relative import to its exact file', () => {
    seedDirCache('src/pagination', ['pagination.hook.ts'], []);

    expect(
      resolveImportPath(
        './pagination.hook',
        'src/pagination/pagination.component.tsx',
        settings
      )
    ).toBe('src/pagination/pagination.hook.ts');
  });

  it('resolves a directory import to its index file', () => {
    seedDirCache('src/button', ['index.ts', 'button.component.tsx'], []);

    expect(resolveImportPath('./button', 'src/consumer.ts', settings)).toBe(
      'src/button/index.ts'
    );
  });

  it('prefers the bare-extension file over a same-prefix Role-suffixed sibling', () => {
    seedDirCache(
      'src/pagination',
      ['pagination.util.spec.ts', 'pagination.util.ts'],
      []
    );

    expect(
      resolveImportPath(
        './pagination.util',
        'src/pagination/pagination.hook.ts',
        settings
      )
    ).toBe('src/pagination/pagination.util.ts');
  });

  it('resolves correctly regardless of the readdir order of the candidates', () => {
    seedDirCache(
      'src/pagination',
      ['pagination.util.ts', 'pagination.util.spec.ts'],
      []
    );

    expect(
      resolveImportPath(
        './pagination.util',
        'src/pagination/pagination.hook.ts',
        settings
      )
    ).toBe('src/pagination/pagination.util.ts');
  });
});

import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { readSourceOverlay } from './index.js';

describe('readSourceOverlay', () => {
  it('omits the overlay when the text matches disk and keeps it otherwise', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const value = 1;\n',
    });

    try {
      const filePath = nodePath.join(fixture.path, 'src/a.ts');
      expect(
        readSourceOverlay(filePath, 'export const value = 1;\n').text
      ).toBeNull();
      const changed = readSourceOverlay(filePath, 'export const value = 2;\n');
      expect(changed.text).toBe('export const value = 2;\n');
      expect(changed.key).toContain(filePath);
    } finally {
      await fixture.rm();
    }
  });
});

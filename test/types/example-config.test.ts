import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  compileInBothModes,
  WARMUP_TIMEOUT_MS,
  warmupTypeHarness,
} from './type-harness.js';

const EXAMPLE_CONFIG_PATH =
  '/Users/lucamorricone/Workspace/my-projects/mine/faf_next/fafconfig.ts';

const HYPOTHETICAL_PATHS = [
  'packages/contracts/src',
  'packages/formatters/src',
  'legacy/client.ts',
  'src/app/app.tsx',
] as const;

describe('example configuration compilation', () => {
  beforeAll(() => {
    warmupTypeHarness();
  }, WARMUP_TIMEOUT_MS);

  it('compiles faf_next example fafconfig.ts in both exactOptionalPropertyTypes modes', () => {
    const rawExample = fs.readFileSync(EXAMPLE_CONFIG_PATH, 'utf8');
    const transformedExample = rawExample.replace(
      "from './fafconfig.type'",
      "from './src/main.js'"
    );

    const result = compileInBothModes(transformedExample);
    expect(result.strictErrors).toHaveLength(0);
    expect(result.looseErrors).toHaveLength(0);
  });

  it('compiles without asserting physical existence of its hypothetical paths in repository', () => {
    const rootDirectory = process.cwd();
    for (const hypotheticalRelativePath of HYPOTHETICAL_PATHS) {
      const fullPath = path.resolve(rootDirectory, hypotheticalRelativePath);
      expect(fs.existsSync(fullPath)).toBe(false);
    }
  });
});

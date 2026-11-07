import { describe, expect, it } from 'vitest';

import { readConfigFileSetting } from './read-config-file-setting.schema.js';

describe('readConfigFileSetting', () => {
  it('reads a string settings.faf.configFile and ignores other shapes', () => {
    expect(
      readConfigFileSetting({ faf: { configFile: 'nested/fafconfig.ts' } })
    ).toBe('nested/fafconfig.ts');
    expect(readConfigFileSetting(undefined)).toBeUndefined();
    expect(readConfigFileSetting({ faf: { configFile: 1 } })).toBeUndefined();
    expect(readConfigFileSetting({ faf: null })).toBeUndefined();
    expect(readConfigFileSetting([])).toBeUndefined();
  });
});

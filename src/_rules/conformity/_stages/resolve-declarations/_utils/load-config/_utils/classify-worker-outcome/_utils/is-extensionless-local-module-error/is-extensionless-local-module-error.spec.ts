import { describe, expect, it } from 'vitest';

import { isExtensionlessLocalModuleError } from './is-extensionless-local-module-error.util.js';

describe('isExtensionlessLocalModuleError', () => {
  it.each([
    "Cannot find module '/a'",
    "Cannot find module '/abs/path/dep' imported from /abs/path/faf.config.ts",
    'Cannot find module "/abs/path/dep" imported from /abs/path/faf.config.ts',
    "Cannot find module './dep'",
    'Cannot find module "./dep"',
    "Cannot find module '../dep' imported from /abs/path/faf.config.ts",
    'Cannot find module ./local',
    'Cannot find module ./local imported from /abs/path/faf.config.ts',
    "Cannot find module './dir.with.dots/dep' imported from /abs/path/faf.config.ts",
    "Cannot find module './dep?file=a.ts' imported from /abs/path/faf.config.ts",
    "Cannot find module 'file:///abs/path/dep' imported from file:///abs/path/faf.config.ts",
    "Cannot find module 'file:///abs/path/dep?file=a.ts#hash'",
    "Cannot find module 'file:///C:/project/dep'",
    "Cannot find module 'C:\\project\\dir.dot\\dep' imported from C:\\project\\faf.config.ts",
    "Cannot find module 'C:/project/dep'",
    "Cannot find module 'C://dep'",
    "Cannot find module '\\\\server\\share\\dep' imported from C:\\project\\faf.config.ts",
    "Cannot find module 'file://[invalid'",
    "Cannot find module './dep'\nstack line",
  ])('returns true for extensionless local module message: %s', (message) => {
    expect(isExtensionlessLocalModuleError(message)).toBe(true);
  });

  it.each([
    '',
    'Some unrelated error message',
    "Cannot find package 'foo' imported from /abs/path/faf.config.ts",
    "Cannot find module '' imported from /abs/path/faf.config.ts",
    'Cannot find module ',
    "Cannot find module './dep' unexpected trailing text",
    'Cannot find module ./local unexpected trailing text',
    'Cannot find module ./local.ts',
    'Cannot find module ./local.ts imported from /abs/path/faf.config.ts',
    "Cannot find module 'foo' imported from /abs/path/faf.config.ts",
    "Cannot find module 'foo/bar' imported from /abs/path/faf.config.ts",
    "Cannot find module '@scope/pkg/subpath' imported from /abs/path/faf.config.ts",
    "Cannot find module '/abs/path/nonexistent.ts' imported from /abs/path/faf.config.ts",
    "Cannot find module './nonexistent.js' imported from /abs/path/faf.config.ts",
    "Cannot find module './nonexistent.ts?query=1#hash'",
    "Cannot find module 'file:///abs/path/nonexistent.ts'",
    "Cannot find module 'C:\\project\\nonexistent.ts'",
    "Cannot find module '/abs/project/node_modules/pkg/entry' imported from /abs/project/faf.config.ts",
    "Cannot find module 'C:\\project\\node_modules\\pkg\\entry' imported from C:\\project\\faf.config.ts",
    "Cannot find module '/'",
    "Cannot find module 'file:///'",
  ])(
    'returns false for non-extensionless, package, node_modules, or unrecognized message: %s',
    (message) => {
      expect(isExtensionlessLocalModuleError(message)).toBe(false);
    }
  );
});

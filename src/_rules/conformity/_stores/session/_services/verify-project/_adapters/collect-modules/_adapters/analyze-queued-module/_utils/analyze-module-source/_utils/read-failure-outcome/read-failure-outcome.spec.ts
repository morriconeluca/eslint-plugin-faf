import { describe, expect, it } from 'vitest';

import type { TModuleReadFailureKind } from '../../../../../../_collect-modules@shared/_types/_aggregates/collect-modules.type.js';

import { readFailureOutcome } from './index.js';

const readKinds = [
  'directory',
  'missing',
  'undecodable',
  'unreadable',
] as const satisfies readonly TModuleReadFailureKind[];

describe('readFailureOutcome', () => {
  it.each(readKinds)(
    'marks an unreadable Tree file %s as an unverified entry',
    (kind) => {
      const outcome = readFailureOutcome({
        isTreeFile: true,
        kind,
        reason: 'detail',
        relativePath: 'src/file.ts',
      });
      expect(outcome.constraint).toBe('unverified/unreadable-entry');
      expect(outcome.family).toBe('unverified');
      expect(outcome.element).toBe('src/file.ts');
      expect(outcome.normativeReference).toBe('D-06');
      expect(outcome.reason).toBe('detail');
      expect(outcome.message).toContain('src/file.ts');
    }
  );

  it.each(readKinds)(
    'marks an unreadable external file %s as an unverified external file',
    (kind) => {
      const outcome = readFailureOutcome({
        isTreeFile: false,
        kind,
        reason: 'detail',
        relativePath: 'outside/file.ts',
      });
      expect(outcome.constraint).toBe('unverified/unreadable-external-file');
      expect(outcome.normativeReference).toBe('D-03');
      expect(outcome.element).toBe('outside/file.ts');
      expect(outcome.family).toBe('unverified');
      expect(outcome.reason).toBe('detail');
    }
  );

  it('uses a distinct message for each read failure kind', () => {
    expect(
      readFailureOutcome({
        isTreeFile: true,
        kind: 'directory',
        reason: 'Path is a directory',
        relativePath: 'src/file.ts',
      }).message
    ).toBe("'src/file.ts' could not be inspected: Path is a directory");
    expect(
      readFailureOutcome({
        isTreeFile: true,
        kind: 'missing',
        reason: 'File is missing',
        relativePath: 'src/file.ts',
      }).message
    ).toBe("'src/file.ts' could not be inspected: File is missing");
    expect(
      readFailureOutcome({
        isTreeFile: false,
        kind: 'undecodable',
        reason: 'Text is not valid UTF-8',
        relativePath: 'outside/file.ts',
      }).message
    ).toBe("'outside/file.ts' could not be read: Text is not valid UTF-8");
    expect(
      readFailureOutcome({
        isTreeFile: false,
        kind: 'unreadable',
        reason: 'EACCES',
        relativePath: 'outside/file.ts',
      }).message
    ).toBe("'outside/file.ts' could not be read: EACCES");
  });
});

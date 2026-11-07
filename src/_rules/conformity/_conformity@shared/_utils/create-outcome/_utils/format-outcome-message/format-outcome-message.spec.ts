import { describe, expect, it } from 'vitest';

import { formatOutcomeMessage } from './format-outcome-message.util.js';

describe('formatOutcomeMessage', () => {
  it('formats an element message without detail', () => {
    const result = formatOutcomeMessage('is not implemented', {
      element: 'my-feature',
    });
    expect(result).toBe("'my-feature' is not implemented");
  });

  it('formats an element message with detail', () => {
    const result = formatOutcomeMessage('could not be read', {
      detail: 'permission denied',
      element: 'src/secret.ts',
    });
    expect(result).toBe("'src/secret.ts' could not be read: permission denied");
  });

  it('removes trailing period from detail before formatting', () => {
    const result = formatOutcomeMessage('could not be read', {
      detail: 'permission denied.',
      element: 'src/secret.ts',
    });
    expect(result).toBe("'src/secret.ts' could not be read: permission denied");
  });

  it('formats a configuration property path message when element is omitted', () => {
    const result = formatOutcomeMessage('cannot be null', {
      propertyPath: 'faf.locals[0].roles',
    });
    expect(result).toBe("'faf.locals[0].roles' cannot be null");
  });

  it('formats an edge message', () => {
    const result = formatOutcomeMessage(
      'peer fragments cannot import each other',
      {
        from: 'src/a/a.util.ts',
        specifier: '../b/b.util.js',
        to: 'src/b/b.util.ts',
      }
    );
    expect(result).toBe(
      "'src/a/a.util.ts' imports 'src/b/b.util.ts' through '../b/b.util.js': peer fragments cannot import each other"
    );
  });

  it('formats a path message', () => {
    const result = formatOutcomeMessage(
      're-entry through external code is prohibited',
      {
        chain: ['src/a.ts', 'external/lib.ts', 'src/b.ts'],
        from: 'src/a.ts',
        to: 'src/b.ts',
      }
    );
    expect(result).toBe(
      "'src/a.ts' reaches 'src/b.ts' through src/a.ts -> external/lib.ts -> src/b.ts: re-entry through external code is prohibited"
    );
  });

  it('formats a cycle message with single module cycle segment', () => {
    const result = formatOutcomeMessage('forms a dependency cycle', {
      cycle: [['src/a.ts', 'src/b.ts', 'src/a.ts']],
      element: 'src/a.ts',
    });
    expect(result).toBe(
      "'src/a.ts' forms a dependency cycle: src/a.ts -> src/b.ts -> src/a.ts"
    );
  });

  it('formats a cycle message with multiple cycle segments', () => {
    const result = formatOutcomeMessage('forms an inter-tree cycle', {
      cycle: [
        ['treeA', 'treeB'],
        ['treeB', 'treeA'],
      ],
      element: 'treeA',
    });
    expect(result).toBe(
      "'treeA' forms an inter-tree cycle: treeA -> treeB; treeB -> treeA"
    );
  });

  it('treats empty detail string as absent detail', () => {
    const result = formatOutcomeMessage('is required and missing', {
      detail: '',
      propertyPath: 'faf.locals[0].origin',
    });
    expect(result).toBe("'faf.locals[0].origin' is required and missing");
  });
});

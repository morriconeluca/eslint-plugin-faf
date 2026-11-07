import { describe, expect, it } from 'vitest';

import { classifyWorkerOutcome } from './classify-worker-outcome.util.js';

describe('classifyWorkerOutcome', () => {
  it('returns configuration failure when rawMessage is null', () => {
    const result = classifyWorkerOutcome({
      configPath: '/test/fafconfig.ts',
      rawMessage: null,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.outcomes).toHaveLength(1);
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.element).toBe('/test/fafconfig.ts');
    expect(outcome?.family).toBe('configuration');
    if (outcome?.family === 'configuration') {
      expect(outcome.normativeReference).toBe('D-09');
      expect(outcome.propertyPath).toBe('default');
    }
    expect(outcome?.message).toBe(
      "'/test/fafconfig.ts' failed to load configuration: Worker terminated without transmitting a valid configuration payload"
    );
  });

  it('returns configuration failure when rawMessage is an array or primitive', () => {
    const result = classifyWorkerOutcome({
      configPath: '/test/fafconfig.ts',
      rawMessage: [1, 2, 3],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.outcomes[0]?.constraint).toBe(
      'configuration/config-load-failure'
    );
  });

  it('returns successful result when kind is value and payload is complete', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        kind: 'value',
        loadedFiles: ['/project/fafconfig.ts'],
        value: { key: 'sample' },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.config).toEqual({ key: 'sample' });
    expect(result.value.configDirectory).toBe('/project');
    expect(result.value.configPath).toBe('/project/fafconfig.ts');
    expect(result.value.loadedFiles).toEqual(['/project/fafconfig.ts']);
  });

  it('returns configuration failure when kind is value but value property is missing', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        kind: 'value',
        loadedFiles: ['/project/fafconfig.ts'],
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.outcomes[0]?.constraint).toBe(
      'configuration/config-load-failure'
    );
  });

  it('returns configuration failure when kind is value but loadedFiles contains non-strings', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        kind: 'value',
        loadedFiles: ['/project/fafconfig.ts', 123],
        value: { key: 'sample' },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.outcomes[0]?.constraint).toBe(
      'configuration/config-load-failure'
    );
  });

  it('returns configuration failure when kind is value but loadedFiles is not an array', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        kind: 'value',
        loadedFiles: 'not-an-array',
        value: { key: 'sample' },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.outcomes[0]?.constraint).toBe(
      'configuration/config-load-failure'
    );
  });

  it.each([
    {
      constraint: 'configuration/missing-default-export',
      kind: 'missing',
      message: "'/project/fafconfig.ts' must declare a default export",
    },
    {
      constraint: 'configuration/invalid-default-export-function',
      kind: 'function',
      message:
        "'/project/fafconfig.ts' cannot export a function as its default export",
    },
    {
      constraint: 'configuration/invalid-default-export-promise',
      kind: 'thenable',
      message:
        "'/project/fafconfig.ts' cannot export a Promise as its default export",
    },
  ] as const)(
    'returns $constraint outcome when kind is $kind',
    ({ constraint, kind, message }) => {
      const result = classifyWorkerOutcome({
        configPath: '/project/fafconfig.ts',
        rawMessage: { kind },
      });

      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      const outcome = result.outcomes[0];
      expect(outcome?.constraint).toBe(constraint);
      expect(outcome?.element).toBe('/project/fafconfig.ts');
      expect(outcome?.message).toBe(message);
    }
  );

  it('returns unclonable-config-value outcome when kind is clone-error with message', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        kind: 'clone-error',
        message: 'Could not clone function property',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/unclonable-config-value');
    expect(outcome?.element).toBe('/project/fafconfig.ts');
    expect(outcome?.message).toContain('Could not clone function property');
  });

  it('returns unclonable-config-value outcome when kind is clone-error without string message', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: { kind: 'clone-error', message: 123 },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/unclonable-config-value');
    expect(outcome?.message).toContain('Unknown data clone error');
  });

  it('returns unsupported-typescript-syntax outcome when error has ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        error: {
          code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX',
          message: 'Syntax error encountered',
        },
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe(
      'configuration/unsupported-typescript-syntax'
    );
    expect(outcome?.message).toContain('Syntax error encountered');
  });

  it('returns unsupported-typescript-syntax outcome when message mentions typescript enum without code', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        error: {
          message: 'TypeScript enum is not supported in this runtime mode',
        },
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe(
      'configuration/unsupported-typescript-syntax'
    );
    expect(outcome?.message).toContain('TypeScript enum is not supported');
  });

  it('returns unresolved-relative-import outcome when error code is ERR_MODULE_NOT_FOUND', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        error: {
          code: 'ERR_MODULE_NOT_FOUND',
          message: 'Cannot find module ./local',
        },
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe(
      'configuration/unresolved-relative-import'
    );
    expect(outcome?.message).toContain('Cannot find module ./local');
  });

  it('returns commonjs-package-type outcome when package.json declares type commonjs', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      packageJson: { type: 'commonjs' },
      rawMessage: {
        error: {
          code: 'ERR_UNKNOWN',
          message: 'Cannot use import statement',
        },
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/commonjs-package-type');
    expect(outcome?.message).toContain('TypeScript ES module loading requires');
  });

  it('returns config-load-failure outcome when error occurs without package.json or with non-commonjs package.json', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      packageJson: { type: 'module' },
      rawMessage: {
        error: {
          code: 'ERR_SYNTAX',
          message: 'Unexpected token',
        },
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toContain('Unexpected token');
  });

  it('handles error record without code and with non-object error gracefully', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        error: 'string-error-payload',
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toContain('failed to load configuration');
  });

  it('handles error record with non-string code and message gracefully', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        error: {
          code: 999,
          message: 888,
        },
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toContain('failed to load configuration');
  });

  it('returns config-load-failure outcome when error occurs with invalid json package.json', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        error: {
          code: 'ERR_UNKNOWN',
          message: 'Failed to load module',
        },
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toContain('Failed to load module');
  });

  it('handles array error payload gracefully', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        error: ['array-error'],
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toContain('failed to load configuration');
  });

  it('handles error message when error property is omitted from error payload', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        kind: 'error',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toContain('failed to load configuration');
  });

  it('returns configuration failure when kind is value but loadedFiles is omitted', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: {
        kind: 'value',
        value: { key: 'sample' },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.outcomes[0]?.constraint).toBe(
      'configuration/config-load-failure'
    );
  });

  it('returns config-load-failure when kind is unrecognized', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: { kind: 'unexpected-kind' },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toBe(
      "'/project/fafconfig.ts' failed to load configuration: Worker terminated without transmitting a valid configuration payload"
    );
  });

  it('returns config-load-failure when kind is non-string', () => {
    const result = classifyWorkerOutcome({
      configPath: '/project/fafconfig.ts',
      rawMessage: { kind: 123 },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    const outcome = result.outcomes[0];
    expect(outcome?.constraint).toBe('configuration/config-load-failure');
    expect(outcome?.message).toBe(
      "'/project/fafconfig.ts' failed to load configuration: Worker terminated without transmitting a valid configuration payload"
    );
  });
});

import { describe, expect, it } from 'vitest';

import { classifyWorkerOutcome } from './classify-worker-outcome.schema.js';

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
      expect(outcome.normativeReference).toBe('CONFIG_1');
      expect(outcome.propertyPath).toBe('default');
    }
    expect(outcome?.message).toBe(
      'Worker terminated without transmitting a valid configuration payload'
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
      message:
        'The fafconfig.ts configuration file must provide an export default value.',
    },
    {
      constraint: 'configuration/invalid-default-export-function',
      kind: 'function',
      message:
        'The default export of fafconfig.ts cannot be a function; it must be a configuration object.',
    },
    {
      constraint: 'configuration/invalid-default-export-promise',
      kind: 'thenable',
      message:
        'The default export of fafconfig.ts cannot be a Promise; synchronous configuration value required.',
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
    expect(outcome?.message).toBe(
      'Exported configuration default value could not be cloned via structured clone: Could not clone function property'
    );
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
    expect(outcome?.message).toBe(
      'Exported configuration default value could not be cloned via structured clone: Unknown data clone error'
    );
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
    expect(outcome?.message).toBe(
      'Non-strippable TypeScript syntax violates configuration constraints: Syntax error encountered (code: ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX)'
    );
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
    expect(outcome?.message).toBe(
      'Non-strippable TypeScript syntax violates configuration constraints: TypeScript enum is not supported in this runtime mode'
    );
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
    expect(outcome?.message).toBe(
      'Relative import without explicit file extension violates configuration constraints: Cannot find module ./local (code: ERR_MODULE_NOT_FOUND)'
    );
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
    expect(outcome?.message).toBe(
      'Package configuration declaring "type": "commonjs" violates configuration constraints: Cannot use import statement (code: ERR_UNKNOWN). TypeScript ES module loading requires "type": "module" in package.json.'
    );
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
    expect(outcome?.message).toBe(
      'Failed to load fafconfig.ts: Unexpected token (code: ERR_SYNTAX)'
    );
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
    expect(outcome?.message).toBe('Failed to load fafconfig.ts: ');
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
    expect(outcome?.message).toBe('Failed to load fafconfig.ts: ');
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
    expect(outcome?.message).toBe(
      'Failed to load fafconfig.ts: Failed to load module (code: ERR_UNKNOWN)'
    );
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
    expect(outcome?.message).toBe('Failed to load fafconfig.ts: ');
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
    expect(outcome?.message).toBe('Failed to load fafconfig.ts: ');
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
      'Worker terminated without transmitting a valid configuration payload'
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
      'Worker terminated without transmitting a valid configuration payload'
    );
  });
});

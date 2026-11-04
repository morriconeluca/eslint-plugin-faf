import nodePath from 'node:path';

import type { TLoadConfigResult } from '../../_load-config@shared/_types/load-config.type.js';
import type { TClassifyWorkerOutcomeInput } from './classify-worker-outcome.type.js';

import { workerMessageSchema } from './_schemas/worker-message-schema/index.js';

export function classifyWorkerOutcome(
  input: TClassifyWorkerOutcomeInput
): TLoadConfigResult {
  const { configPath, rawMessage } = input;
  const configLoadFailure = 'configuration/config-load-failure' as const;
  const invalidPayloadMessage =
    'Worker terminated without transmitting a valid configuration payload';
  const defaultProperty = 'default';
  const normativeReference = 'CONFIG_1';

  const makeFailure = (
    constraint: `configuration/${string}`,
    message: string
  ): TLoadConfigResult => ({
    ok: false,
    outcomes: [
      {
        constraint,
        element: configPath,
        family: 'configuration',
        message,
        normativeReference,
        propertyPath: defaultProperty,
      },
    ],
  });

  const isCommonJsConfig = (): boolean =>
    input.packageJson?.['type'] === 'commonjs';

  const classifyError = (errorPayload: unknown): TLoadConfigResult => {
    const parseDetails = (
      error: unknown
    ): { readonly code?: string; readonly message: string } => {
      if (typeof error !== 'object' || error === null || Array.isArray(error)) {
        return { message: '' };
      }
      const message =
        'message' in error && typeof error.message === 'string'
          ? error.message
          : '';
      const code =
        'code' in error && typeof error.code === 'string'
          ? error.code
          : undefined;
      return { code, message };
    };

    const { code, message } = parseDetails(errorPayload);
    const codeSuffix = code === undefined ? '' : ` (code: ${code})`;

    if (
      code === 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX' ||
      message.includes('TypeScript enum is not supported')
    ) {
      return makeFailure(
        'configuration/unsupported-typescript-syntax',
        `Non-strippable TypeScript syntax violates configuration constraints: ${message}${codeSuffix}`
      );
    }

    if (code === 'ERR_MODULE_NOT_FOUND') {
      return makeFailure(
        'configuration/unresolved-relative-import',
        `Relative import without explicit file extension violates configuration constraints: ${message}${codeSuffix}`
      );
    }

    return isCommonJsConfig()
      ? makeFailure(
          'configuration/commonjs-package-type',
          `Package configuration declaring "type": "commonjs" violates configuration constraints: ${message}${codeSuffix}. TypeScript ES module loading requires "type": "module" in package.json.`
        )
      : makeFailure(
          configLoadFailure,
          `Failed to load fafconfig.ts: ${message}${codeSuffix}`
        );
  };

  const classifyCloneError = (payload: object): TLoadConfigResult => {
    const cloneMessage =
      'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Unknown data clone error';
    return makeFailure(
      'configuration/unclonable-config-value',
      `Exported configuration default value could not be cloned via structured clone: ${cloneMessage}`
    );
  };

  const classifyValue = (payload: object): TLoadConfigResult => {
    const hasValue = 'value' in payload;
    const loadedFiles =
      'loadedFiles' in payload ? payload.loadedFiles : undefined;

    const areLoadedFilesValid =
      Array.isArray(loadedFiles) &&
      loadedFiles.every((file: unknown) => typeof file === 'string');

    if (hasValue && areLoadedFilesValid) {
      return {
        ok: true,
        value: {
          config: payload.value,
          configDirectory: nodePath.dirname(configPath),
          configPath,
          loadedFiles,
        },
      };
    }

    return makeFailure(configLoadFailure, invalidPayloadMessage);
  };

  const dispatchKind = (payload: object, kind: string): TLoadConfigResult => {
    switch (kind) {
      case 'clone-error': {
        return classifyCloneError(payload);
      }
      case 'error': {
        const errorPayload = 'error' in payload ? payload.error : undefined;
        return classifyError(errorPayload);
      }
      case 'function': {
        return makeFailure(
          'configuration/invalid-default-export-function',
          'The default export of fafconfig.ts cannot be a function; it must be a configuration object.'
        );
      }
      case 'missing': {
        return makeFailure(
          'configuration/missing-default-export',
          'The fafconfig.ts configuration file must provide an export default value.'
        );
      }
      case 'thenable': {
        return makeFailure(
          'configuration/invalid-default-export-promise',
          'The default export of fafconfig.ts cannot be a Promise; synchronous configuration value required.'
        );
      }
      case 'value': {
        return classifyValue(payload);
      }
      default: {
        return makeFailure(configLoadFailure, invalidPayloadMessage);
      }
    }
  };

  const dispatchValidKind = (payload: object): TLoadConfigResult =>
    'kind' in payload && typeof payload.kind === 'string'
      ? dispatchKind(payload, payload.kind)
      : makeFailure(configLoadFailure, invalidPayloadMessage);

  const parsedMessage = workerMessageSchema.safeParse(rawMessage);
  return parsedMessage.success
    ? dispatchValidKind(parsedMessage.data)
    : makeFailure(configLoadFailure, invalidPayloadMessage);
}

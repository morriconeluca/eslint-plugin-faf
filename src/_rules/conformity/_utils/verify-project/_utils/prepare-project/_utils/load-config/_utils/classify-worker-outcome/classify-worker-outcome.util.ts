import nodePath from 'node:path';

import type { TConfigConstraint } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TLoadConfigResult } from '../../_load-config@shared/_types/load-config.type.js';
import type { TClassifyWorkerOutcomeInput } from './classify-worker-outcome.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import {
  workerErrorSchema,
  workerMessageSchema,
} from './classify-worker-outcome.schema.js';

export function classifyWorkerOutcome(
  input: TClassifyWorkerOutcomeInput
): TLoadConfigResult {
  const { configPath, rawMessage } = input;
  const configLoadFailure = 'configuration/config-load-failure' as const;
  const invalidPayloadMessage =
    'Worker terminated without transmitting a valid configuration payload';
  const defaultProperty = 'default';

  const makeFailure = (
    constraint: TConfigConstraint,
    detail?: string
  ): TLoadConfigResult => ({
    ok: false,
    outcomes: [
      createOutcome.configuration(constraint, {
        ...(detail !== undefined && { detail }),
        element: configPath,
        propertyPath: defaultProperty,
      }),
    ],
  });

  const isCommonJsConfig = (): boolean =>
    input.packageJson?.['type'] === 'commonjs';

  const classifyError = (errorPayload: unknown): TLoadConfigResult => {
    const parsedError = workerErrorSchema.safeParse(errorPayload);
    const code = parsedError.success ? parsedError.data.code : undefined;
    const message = parsedError.success ? (parsedError.data.message ?? '') : '';
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
          `Failed to load faf.config.ts: ${message}${codeSuffix}`
        );
  };

  const parsedMessage = workerMessageSchema.safeParse(rawMessage);
  if (!parsedMessage.success) {
    return makeFailure(configLoadFailure, invalidPayloadMessage);
  }

  const payload = parsedMessage.data;
  switch (payload.kind) {
    case 'clone-error': {
      const cloneMessage =
        typeof payload.message === 'string'
          ? payload.message
          : 'Unknown data clone error';
      return makeFailure(
        'configuration/unclonable-config-value',
        `Exported configuration default value could not be cloned via structured clone: ${cloneMessage}`
      );
    }
    case 'error': {
      return classifyError(payload.error);
    }
    case 'function': {
      return makeFailure('configuration/invalid-default-export-function');
    }
    case 'missing': {
      return makeFailure('configuration/missing-default-export');
    }
    case 'thenable': {
      return makeFailure('configuration/invalid-default-export-promise');
    }
    case 'value': {
      return {
        ok: true,
        value: {
          config: payload.value,
          configDirectory: nodePath.dirname(configPath),
          configPath,
          loadedFiles: payload.loadedFiles,
        },
      };
    }
  }
}

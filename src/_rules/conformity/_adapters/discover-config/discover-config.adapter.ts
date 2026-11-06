import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type {
  TDiscoverConfigInput,
  TDiscoverConfigResult,
} from './discover-config.type.js';

import { CONFIG_FILE_NAME } from '../../../../_src@shared/_constants/faf.constant.js';
import { createOutcome } from '../../_conformity@shared/_utils/create-outcome/index.js';

export function discoverConfig(
  input: TDiscoverConfigInput
): TDiscoverConfigResult {
  const missingConfigFile = 'configuration/missing-config-file';
  if (input.configFile !== undefined) {
    const configProperty = 'settings.faf.configFile';
    const candidatePath = nodePath.isAbsolute(input.configFile)
      ? nodePath.normalize(input.configFile)
      : nodePath.resolve(input.workingDirectory, input.configFile);

    const stats = nodeFs.statSync(candidatePath, { throwIfNoEntry: false });
    if (stats === undefined || !stats.isFile()) {
      return {
        ok: false,
        outcomes: [
          createOutcome(missingConfigFile, {
            element: candidatePath,
            propertyPath: configProperty,
          }),
        ],
      };
    }

    return {
      ok: true,
      value: {
        configDirectory: nodePath.dirname(candidatePath),
        configPath: candidatePath,
      },
    };
  }

  let currentDirectory = nodePath.resolve(input.workingDirectory);
  let isReachedRoot = false;

  while (!isReachedRoot) {
    const candidatePath = nodePath.join(currentDirectory, CONFIG_FILE_NAME);
    const stats = nodeFs.statSync(candidatePath, { throwIfNoEntry: false });

    if (stats !== undefined && stats.isFile()) {
      return {
        ok: true,
        value: {
          configDirectory: currentDirectory,
          configPath: candidatePath,
        },
      };
    }

    const parentDirectory = nodePath.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      isReachedRoot = true;
    } else {
      currentDirectory = parentDirectory;
    }
  }

  const resolvedWorkingDirectory = nodePath.resolve(input.workingDirectory);

  return {
    ok: false,
    outcomes: [
      createOutcome(missingConfigFile, {
        element: resolvedWorkingDirectory,
        propertyPath: 'faf',
      }),
    ],
  };
}

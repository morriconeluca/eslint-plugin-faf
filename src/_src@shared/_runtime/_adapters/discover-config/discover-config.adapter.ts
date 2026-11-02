import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type {
  TDiscoverConfigInput,
  TDiscoverConfigResult,
} from './discover-config.type.js';

export function discoverConfig(
  input: TDiscoverConfigInput
): TDiscoverConfigResult {
  const missingConstraint = 'configuration/missing-config-file';
  if (input.configFile !== undefined) {
    const configProperty = 'settings.faf.configFile';
    const candidatePath = nodePath.isAbsolute(input.configFile)
      ? nodePath.normalize(input.configFile)
      : nodePath.resolve(input.workingDirectory, input.configFile);

    const stats = nodeFs.statSync(candidatePath, { throwIfNoEntry: false });
    if (stats === undefined) {
      return {
        ok: false,
        outcomes: [
          {
            constraint: missingConstraint,
            element: candidatePath,
            family: 'configuration',
            message: `Explicit configuration file not found at path: ${candidatePath}`,
            normativeReference: 'CONFIG_1',
            propertyPath: configProperty,
          },
        ],
      };
    }

    if (!stats.isFile()) {
      return {
        ok: false,
        outcomes: [
          {
            constraint: missingConstraint,
            element: candidatePath,
            family: 'configuration',
            message: `Explicit configuration path is not a file: ${candidatePath}`,
            normativeReference: 'CONFIG_1',
            propertyPath: configProperty,
          },
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
    const candidatePath = nodePath.join(currentDirectory, 'fafconfig.ts');
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
      {
        constraint: missingConstraint,
        element: resolvedWorkingDirectory,
        family: 'configuration',
        message: `No fafconfig.ts configuration file found in working directory or parent directories: ${resolvedWorkingDirectory}`,
        normativeReference: 'CONFIG_1',
        propertyPath: 'faf',
      },
    ],
  };
}

import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type {
  TPackageJsonData,
  TReadPackageJsonInput,
  TReadPackageJsonResult,
} from './read-package-json.type.js';

import { createOutcome } from '../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function readPackageJson(
  input: TReadPackageJsonInput
): TReadPackageJsonResult {
  const packagePath = nodePath.join(
    nodePath.resolve(input.directory),
    'package.json'
  );

  const stats = nodeFs.statSync(packagePath, { throwIfNoEntry: false });
  if (stats === undefined) {
    return {
      ok: true,
      value: {
        present: false,
      },
    };
  }

  const invalidPackageJson = 'configuration/invalid-package-json';

  if (!stats.isFile()) {
    return {
      ok: false,
      outcomes: [
        createOutcome(invalidPackageJson, {
          detail: `package.json at ${packagePath} is not a regular file`,
          element: packagePath,
          propertyPath: '',
        }),
      ],
    };
  }

  try {
    const rawContent = nodeFs.readFileSync(packagePath, 'utf8');
    const parsed: unknown = JSON.parse(rawContent);

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null && !Array.isArray(value);

    if (!isRecord(parsed)) {
      return {
        ok: false,
        outcomes: [
          createOutcome(invalidPackageJson, {
            detail: `package.json at ${packagePath} does not contain a JSON object`,
            element: packagePath,
            propertyPath: '',
          }),
        ],
      };
    }

    const packageJsonData: TPackageJsonData = {
      packageJson: parsed,
      present: true,
    };

    return {
      ok: true,
      value: packageJsonData,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      ok: false,
      outcomes: [
        createOutcome(invalidPackageJson, {
          detail: `Failed to parse package.json at ${packagePath}: ${errorMessage}`,
          element: packagePath,
          propertyPath: '',
        }),
      ],
    };
  }
}

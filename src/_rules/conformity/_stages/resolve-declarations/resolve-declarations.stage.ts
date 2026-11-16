import nodePath from 'node:path';

import type { TOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TResolveDeclarationsResult } from './resolve-declarations.type.js';

import { readPackageJson } from './_resolve-declarations@shared/_utils/read-package-json/index.js';
import { acquirePathAliases } from './_utils/acquire-path-aliases/index.js';
import { composeDeclarations } from './_utils/compose-declarations/index.js';
import { loadConfig } from './_utils/load-config/index.js';
import { validateConfigFormat } from './_utils/validate-config-format/index.js';

export function resolveDeclarations(
  configPath: string
): TResolveDeclarationsResult {
  const blocked = (
    resolvedPath: string,
    baseDirectory: string,
    loadedFiles: readonly string[],
    outcomes: readonly TOutcome[]
  ): TResolveDeclarationsResult => ({
    baseDirectory,
    configPath: resolvedPath,
    kind: 'blocked',
    loadedFiles,
    outcomes,
  });

  const resolvedConfigPath = nodePath.resolve(configPath);
  const loaded = loadConfig({ configPath: resolvedConfigPath });
  if (!loaded.ok) {
    return blocked(
      resolvedConfigPath,
      nodePath.dirname(resolvedConfigPath),
      [],
      loaded.outcomes
    );
  }
  const formatted = validateConfigFormat(loaded.value.config);
  if (!formatted.ok) {
    return blocked(
      loaded.value.configPath,
      loaded.value.configDirectory,
      loaded.value.loadedFiles,
      formatted.outcomes
    );
  }
  const packageJson = readPackageJson({
    directory: loaded.value.configDirectory,
  });
  if (!packageJson.ok) {
    return blocked(
      loaded.value.configPath,
      loaded.value.configDirectory,
      loaded.value.loadedFiles,
      packageJson.outcomes
    );
  }
  const aliases = acquirePathAliases({
    commonAliases: formatted.value.faf.common?.aliases,
    packageJson: packageJson.value.packageJson,
  });
  if (!aliases.ok) {
    return blocked(
      loaded.value.configPath,
      loaded.value.configDirectory,
      loaded.value.loadedFiles,
      aliases.outcomes
    );
  }
  const declarations = composeDeclarations(
    formatted.value,
    loaded.value.configDirectory
  );
  if (!declarations.ok) {
    return blocked(
      loaded.value.configPath,
      loaded.value.configDirectory,
      loaded.value.loadedFiles,
      declarations.outcomes
    );
  }

  return {
    aliases: aliases.value,
    baseDirectory: loaded.value.configDirectory,
    config: formatted.value,
    configPath: loaded.value.configPath,
    declarations: {
      ...declarations.value,
      aliases: aliases.value,
    },
    kind: 'ready',
    loadedFiles: loaded.value.loadedFiles,
  };
}

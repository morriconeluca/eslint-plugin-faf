import nodePath from 'node:path';

import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TPrepareProjectResult } from './prepare-project.type.js';

import { listEntries } from '../../_adapters/list-entries/index.js';
import { loadConfig } from '../../_adapters/load-config/index.js';
import { validateConfigFormat } from '../../_schemas/validate-config-format/index.js';
import { acquirePathAliases } from '../../_utils/acquire-path-aliases/index.js';
import { buildInventory } from '../../_utils/build-inventory/index.js';
import { composeDeclarations } from '../../_utils/compose-declarations/index.js';
import { validateConfigReferences } from '../../_utils/validate-config-references/index.js';
import { readPackageJson } from '../../_verify-project@shared/_adapters/read-package-json/index.js';
import { includeExternalTargets } from './_adapters/include-external-targets/index.js';

export function prepareProject(configPath: string): TPrepareProjectResult {
  const blocked = (
    resolvedPath: string,
    baseDirectory: string,
    loadedFiles: readonly string[],
    outcomes: readonly TOutcome[]
  ): TPrepareProjectResult => ({
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
  const origins = declarations.value.trees.map((tree) => tree.originPath);
  const entries = listEntries(loaded.value.configDirectory, origins);
  if (!entries.ok) {
    return blocked(
      loaded.value.configPath,
      loaded.value.configDirectory,
      loaded.value.loadedFiles,
      entries.outcomes
    );
  }
  const built = buildInventory(entries.value, origins);
  const inventory = includeExternalTargets(
    built.inventory,
    formatted.value,
    loaded.value.configDirectory
  );
  const references = validateConfigReferences(
    formatted.value,
    declarations.value,
    inventory
  );
  if (references.length > 0) {
    return blocked(
      loaded.value.configPath,
      loaded.value.configDirectory,
      loaded.value.loadedFiles,
      [...built.outcomes, ...references]
    );
  }
  return {
    aliases: aliases.value,
    baseDirectory: loaded.value.configDirectory,
    configPath: loaded.value.configPath,
    declarations: declarations.value,
    inventory,
    inventoryOutcomes: built.outcomes,
    kind: 'ready',
    loadedFiles: loaded.value.loadedFiles,
  };
}

import type { Rule } from 'eslint';

import nodePath from 'node:path';

import type { TOutcome } from '../../_src@shared/_utils/create-outcome/index.js';
import type {
  TProjectBasis,
  TVerificationModel,
} from './_conformity@shared/_types/verification-model.type.js';
import type {
  TCollectWatchedExternalFilesInput,
  TVerifyProjectInput,
  TVerifyProjectResult,
} from './conformity.type.js';

import { CONFIG_FILE_NAME } from '../../_src@shared/_constants/faf.constant.js';
import { toPosixPath } from '../../_src@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from './_conformity@shared/_utils/compare-ordinal/index.js';
import { verifyAccessNodeContract } from './_norms/access-node-contract/index.js';
import { verifyAcyclicity } from './_norms/acyclicity/index.js';
import { verifyCategoryRole } from './_norms/category-role/index.js';
import { verifyClassificationCompleteness } from './_norms/classification-completeness/index.js';
import { verifyContainmentMatrix } from './_norms/containment-matrix/index.js';
import { verifyExclusiveForms } from './_norms/exclusive-forms/index.js';
import { verifyExternalDependencies } from './_norms/external-dependencies/index.js';
import { verifyForeignNodeIsolation } from './_norms/foreign-node-isolation/index.js';
import { verifyFractalBranchUnidirectionality } from './_norms/fractal-branch-unidirectionality/index.js';
import { verifyFractalBranchVisibility } from './_norms/fractal-branch-visibility/index.js';
import { verifyFragmentAnatomy } from './_norms/fragment-anatomy/index.js';
import { verifyFragmentEncapsulation } from './_norms/fragment-encapsulation/index.js';
import { verifyHorizontalHierarchies } from './_norms/horizontal-hierarchies/index.js';
import { verifyNomenclature } from './_norms/nomenclature/index.js';
import { verifyPathAliasAnchoring } from './_norms/path-alias-anchoring/index.js';
import { verifyPeerSeparation } from './_norms/peer-separation/index.js';
import { verifyPrivateCategoryVisibility } from './_norms/private-category-visibility/index.js';
import { verifyReEntryProhibition } from './_norms/re-entry-prohibition/index.js';
import { verifyReExportProhibition } from './_norms/re-export-prohibition/index.js';
import { verifyRootNodeDiscipline } from './_norms/root-node-discipline/index.js';
import { verifySubGraphNodeIsolation } from './_norms/sub-graph-node-isolation/index.js';
import { verifySymbolUniqueness } from './_norms/symbol-uniqueness/index.js';
import { verifyTreeFrontier } from './_norms/tree-frontier/index.js';
import { anchorOutcomes } from './_stages/anchor-outcomes/index.js';
import { buildDependencyGraph } from './_stages/build-dependency-graph/index.js';
import { buildInventory } from './_stages/build-inventory/index.js';
import { classifyTaxonomy } from './_stages/classify-taxonomy/index.js';
import { collectModules } from './_stages/collect-modules/index.js';
import { deriveExternalCrossings } from './_stages/derive-external-crossings/index.js';
import { deriveHorizontalHierarchies } from './_stages/derive-horizontal-hierarchies/index.js';
import { derivePublicSurface } from './_stages/derive-public-surface/index.js';
import { resolveDeclarations } from './_stages/resolve-declarations/index.js';
import { validateDeclarationReferences } from './_stages/validate-declaration-references/index.js';
import { configFileSettingsSchema } from './conformity.schema.js';

export function collectWatchedExternalFiles(
  input: TCollectWatchedExternalFilesInput
): readonly string[] {
  const externalFilesSet = new Set<string>([
    nodePath.resolve(input.baseDirectory, 'package.json'),
  ]);

  for (const item of input.inventory.items) {
    if (item.kind === 'file' && item.treeOrigin === null) {
      externalFilesSet.add(nodePath.resolve(input.baseDirectory, item.path));
    }
  }

  for (const modulePath of input.modules.records.keys()) {
    const absolute = nodePath.resolve(input.baseDirectory, modulePath);
    const isUnderTree = input.treeOrigins.some(
      (origin) =>
        absolute === origin || absolute.startsWith(`${origin}${nodePath.sep}`)
    );
    if (!isUnderTree) {
      externalFilesSet.add(absolute);
    }
  }

  const externalFiles = [...externalFilesSet];
  externalFiles.sort(compareOrdinal);
  return externalFiles;
}

export function readConfigFileSetting(
  settings: Rule.RuleContext['settings'] | undefined
): string | undefined {
  const parsed = configFileSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data.faf.configFile : undefined;
}

const blockedVerificationResult = (
  baseDirectory: string,
  configPath: string,
  loadedFiles: readonly string[],
  outcomes: readonly TOutcome[]
): TVerifyProjectResult => {
  const anchored = anchorOutcomes({
    baseDirectory,
    configPath,
    outcomes,
  });
  return {
    ...anchored,
    baseDirectory,
    collectedModules: false,
    externalFiles: [],
    loadedFiles,
    treeOrigins: [],
  };
};

const buildTextOverrides = (
  baseDirectory: string,
  fileOverlays: ReadonlyMap<string, string> | undefined
): ReadonlyMap<string, string> => {
  const textOverrides = new Map<string, string>();
  if (fileOverlays !== undefined) {
    for (const [filePath, text] of fileOverlays) {
      const absolute = nodePath.isAbsolute(filePath)
        ? filePath
        : nodePath.resolve(baseDirectory, filePath);
      const relative = toPosixPath(nodePath.relative(baseDirectory, absolute));
      textOverrides.set(relative, text);
    }
  }
  return textOverrides;
};

const selectOverlayPaths = (
  textOverrides: ReadonlyMap<string, string>
): readonly string[] => {
  const paths: string[] = [];
  for (const relativePath of textOverrides.keys()) {
    if (
      relativePath === '..' ||
      relativePath.length === 0 ||
      relativePath.startsWith('../')
    ) {
      continue;
    }
    if (
      relativePath !== CONFIG_FILE_NAME &&
      !nodePath.isAbsolute(relativePath)
    ) {
      paths.push(relativePath);
    }
  }
  return paths;
};

const collectNormOutcomes = (
  model: TVerificationModel
): readonly TOutcome[] => [
  ...verifyClassificationCompleteness(model),
  ...verifyContainmentMatrix(model),
  ...verifyExclusiveForms(model),
  ...verifyFragmentAnatomy(model),
  ...verifyCategoryRole(model),
  ...verifyNomenclature(model),
  ...verifyHorizontalHierarchies(model),
  ...verifyPeerSeparation(model),
  ...verifyFragmentEncapsulation(model),
  ...verifyPrivateCategoryVisibility(model),
  ...verifyFractalBranchVisibility(model),
  ...verifyRootNodeDiscipline(model),
  ...verifySubGraphNodeIsolation(model),
  ...verifyForeignNodeIsolation(model),
  ...verifyAccessNodeContract(model),
  ...verifyTreeFrontier(model),
  ...verifyExternalDependencies(model),
  ...verifyPathAliasAnchoring(model),
  ...verifySymbolUniqueness(model),
  ...verifyReExportProhibition(model),
  ...verifyAcyclicity(model),
  ...verifyFractalBranchUnidirectionality(model),
  ...verifyReEntryProhibition(model),
];

export function verifyProject(
  input: TVerifyProjectInput
): TVerifyProjectResult {
  const configPath = nodePath.isAbsolute(input.configPath)
    ? input.configPath
    : nodePath.resolve(input.workingDirectory, input.configPath);
  const declarationsResult = resolveDeclarations(configPath);
  if (declarationsResult.kind === 'blocked') {
    return blockedVerificationResult(
      declarationsResult.baseDirectory,
      declarationsResult.configPath,
      declarationsResult.loadedFiles,
      declarationsResult.outcomes
    );
  }
  const textOverrides = buildTextOverrides(
    declarationsResult.baseDirectory,
    input.fileOverlays
  );
  const inventoryResult = buildInventory({
    baseDirectory: declarationsResult.baseDirectory,
    config: declarationsResult.config,
    origins: declarationsResult.declarations.trees.map(
      (tree) => tree.originPath
    ),
    overlayPaths: selectOverlayPaths(textOverrides),
  });
  if (!inventoryResult.ok) {
    return blockedVerificationResult(
      declarationsResult.baseDirectory,
      declarationsResult.configPath,
      declarationsResult.loadedFiles,
      inventoryResult.outcomes
    );
  }
  const references = validateDeclarationReferences(
    declarationsResult.config,
    declarationsResult.declarations,
    inventoryResult.value.inventory
  );
  if (references.length > 0) {
    return blockedVerificationResult(
      declarationsResult.baseDirectory,
      declarationsResult.configPath,
      declarationsResult.loadedFiles,
      [...inventoryResult.value.inventoryOutcomes, ...references]
    );
  }
  const basis: TProjectBasis = {
    aliases: declarationsResult.aliases,
    baseDirectory: declarationsResult.baseDirectory,
    configPath: declarationsResult.configPath,
    declarations: declarationsResult.declarations,
    inventory: inventoryResult.value.inventory,
    inventoryOutcomes: inventoryResult.value.inventoryOutcomes,
    kind: 'ready',
    loadedFiles: declarationsResult.loadedFiles,
  };
  const taxonomy = classifyTaxonomy({
    declarations: basis.declarations,
    inventory: basis.inventory,
  });
  const hierarchies = deriveHorizontalHierarchies(basis, taxonomy.model);
  const surface = derivePublicSurface(basis, taxonomy.model);
  const modules = collectModules({
    aliases: basis.aliases,
    baseDirectory: basis.baseDirectory,
    inventory: basis.inventory,
    packageVersion: input.packageVersion,
    textOverrides,
  });
  const graph = buildDependencyGraph(basis, taxonomy.model, modules);
  const crossings = deriveExternalCrossings(graph.graph);
  const model: TVerificationModel = {
    basis,
    crossings,
    graph: graph.graph,
    hierarchies: hierarchies.hierarchies,
    modules,
    surface: surface.surface,
    taxonomy: taxonomy.model,
  };
  const anchored = anchorOutcomes({
    baseDirectory: basis.baseDirectory,
    configPath: basis.configPath,
    inventory: basis.inventory,
    model: taxonomy.model,
    outcomes: [
      ...basis.inventoryOutcomes,
      ...taxonomy.outcomes,
      ...hierarchies.outcomes,
      ...surface.outcomes,
      ...modules.unverifiedOutcomes,
      ...graph.outcomes,
      ...collectNormOutcomes(model),
    ],
  });
  const treeOrigins = basis.declarations.trees.map((tree) =>
    nodePath.resolve(basis.baseDirectory, tree.originPath)
  );
  const externalFiles = collectWatchedExternalFiles({
    baseDirectory: basis.baseDirectory,
    inventory: basis.inventory,
    modules,
    treeOrigins,
  });
  return {
    ...anchored,
    baseDirectory: basis.baseDirectory,
    collectedModules: true,
    externalFiles,
    loadedFiles: basis.loadedFiles,
    treeOrigins,
  };
}

import nodePath from 'node:path';

import type { TVerificationModel } from './_verify-project@shared/_types/_systems/verification-model.type.js';
import type {
  TVerifyProjectInput,
  TVerifyProjectResult,
} from './verify-project.type.js';

import { toPosixPath } from '../../_session@shared/_utils/to-posix-path/index.js';
import { collectModules } from './_adapters/collect-modules/index.js';
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
import { verifyPublicSurface } from './_norms/public-surface/index.js';
import { verifyReEntryProhibition } from './_norms/re-entry-prohibition/index.js';
import { verifyReExportProhibition } from './_norms/re-export-prohibition/index.js';
import { verifyRootNodeDiscipline } from './_norms/root-node-discipline/index.js';
import { verifySubGraphNodeIsolation } from './_norms/sub-graph-node-isolation/index.js';
import { verifySymbolUniqueness } from './_norms/symbol-uniqueness/index.js';
import { verifyTreeFrontier } from './_norms/tree-frontier/index.js';
import { prepareProject } from './_services/prepare-project/index.js';
import { anchorOutcomes } from './_utils/anchor-outcomes/index.js';
import { buildDependencyGraph } from './_utils/build-dependency-graph/index.js';
import { classifyTaxonomy } from './_utils/classify-taxonomy/index.js';
import { deriveExternalCrossings } from './_utils/derive-external-crossings/index.js';
import { deriveHorizontalHierarchies } from './_utils/derive-horizontal-hierarchies/index.js';
import { derivePublicSurface } from './_utils/derive-public-surface/index.js';

export function verifyProject(
  input: TVerifyProjectInput
): TVerifyProjectResult {
  const configPath = nodePath.isAbsolute(input.configPath)
    ? input.configPath
    : nodePath.resolve(input.workingDirectory, input.configPath);
  const prepared = prepareProject(configPath);
  if (prepared.kind === 'blocked') {
    const anchored = anchorOutcomes({
      baseDirectory: prepared.baseDirectory,
      configPath: prepared.configPath,
      outcomes: prepared.outcomes,
    });
    return {
      ...anchored,
      collectedModules: false,
      loadedFiles: prepared.loadedFiles,
    };
  }
  const taxonomy = classifyTaxonomy({
    declarations: prepared.declarations,
    inventory: prepared.inventory,
  });
  const hierarchies = deriveHorizontalHierarchies(prepared, taxonomy.model);
  const surface = derivePublicSurface(prepared, taxonomy.model);
  const textOverrides = new Map<string, string>();
  if (input.fileOverlays !== undefined) {
    for (const [filePath, text] of input.fileOverlays) {
      const absolute = nodePath.isAbsolute(filePath)
        ? filePath
        : nodePath.resolve(prepared.baseDirectory, filePath);
      const relative = toPosixPath(
        nodePath.relative(prepared.baseDirectory, absolute)
      );
      textOverrides.set(relative, text);
    }
  }
  const modules = collectModules({
    aliases: prepared.aliases,
    baseDirectory: prepared.baseDirectory,
    inventory: prepared.inventory,
    textOverrides,
  });
  const graph = buildDependencyGraph(prepared, taxonomy.model, modules);
  const crossings = deriveExternalCrossings(graph.graph);
  const model: TVerificationModel = {
    basis: prepared,
    crossings,
    graph: graph.graph,
    hierarchies: hierarchies.hierarchies,
    modules,
    surface: surface.surface,
    taxonomy: taxonomy.model,
  };
  const anchored = anchorOutcomes({
    baseDirectory: prepared.baseDirectory,
    configPath: prepared.configPath,
    inventory: prepared.inventory,
    model: taxonomy.model,
    outcomes: [
      ...prepared.inventoryOutcomes,
      ...taxonomy.outcomes,
      ...hierarchies.outcomes,
      ...surface.outcomes,
      ...modules.unverifiedOutcomes,
      ...graph.outcomes,
      ...verifyClassificationCompleteness(model),
      ...verifyContainmentMatrix(model),
      ...verifyExclusiveForms(model),
      ...verifyFragmentAnatomy(model),
      ...verifyCategoryRole(model),
      ...verifyNomenclature(model),
      ...verifyHorizontalHierarchies(model),
      ...verifyPublicSurface(model),
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
    ],
  });
  return {
    ...anchored,
    collectedModules: true,
    loadedFiles: prepared.loadedFiles,
  };
}

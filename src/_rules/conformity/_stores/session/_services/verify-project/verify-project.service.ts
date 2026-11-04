import nodePath from 'node:path';

import type {
  TVerifyProjectInput,
  TVerifyProjectResult,
} from './verify-project.type.js';

import { toPosixPath } from '../../_session@shared/_utils/to-posix-path/index.js';
import { collectModules } from './_adapters/collect-modules/index.js';
import { verifyClassificationCompleteness } from './_norms/classification-completeness/index.js';
import { prepareProject } from './_services/prepare-project/index.js';
import { anchorOutcomes } from './_utils/anchor-outcomes/index.js';
import { classifyTaxonomy } from './_utils/classify-taxonomy/index.js';
import { collectGraphOutcomes } from './_utils/collect-graph-outcomes/index.js';

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
  const classification = classifyTaxonomy({
    declarations: prepared.declarations,
    inventory: prepared.inventory,
  });
  const completeness = verifyClassificationCompleteness(classification.model);
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
  const anchored = anchorOutcomes({
    baseDirectory: prepared.baseDirectory,
    configPath: prepared.configPath,
    inventory: prepared.inventory,
    model: classification.model,
    outcomes: [
      ...prepared.inventoryOutcomes,
      ...classification.outcomes,
      ...completeness,
      ...collectGraphOutcomes(modules.unverifiedOutcomes),
    ],
  });
  return {
    ...anchored,
    collectedModules: true,
    loadedFiles: prepared.loadedFiles,
  };
}

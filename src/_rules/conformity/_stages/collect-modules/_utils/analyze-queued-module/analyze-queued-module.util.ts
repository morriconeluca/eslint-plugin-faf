import type {
  TAnalyzeQueuedModuleInput,
  TModuleAnalysis,
} from '../../_collect-modules@shared/_types/collect-modules.type.js';

import { analyzeModuleSource } from './_utils/analyze-module-source/index.js';
import { readModuleText } from './_utils/read-module-text/index.js';

export function analyzeQueuedModule(
  input: TAnalyzeQueuedModuleInput
): TModuleAnalysis {
  const override = input.textOverrides.get(input.relativePath);
  const readResult =
    override === undefined
      ? readModuleText(input.baseDirectory, input.relativePath)
      : { status: 'text' as const, text: override };
  return analyzeModuleSource({
    inventory: input.inventory,
    producer: input.producer,
    readResult,
    relativePath: input.relativePath,
    resolver: input.resolver,
  });
}

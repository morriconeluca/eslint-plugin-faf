import type {
  TAnalyzeQueuedModuleInput,
  TModuleAnalysis,
} from '../../_collect-modules@shared/_types/_aggregates/collect-modules.type.js';

import { readModuleText } from './_adapters/read-module-text/index.js';
import { analyzeModuleSource } from './_utils/analyze-module-source/index.js';

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

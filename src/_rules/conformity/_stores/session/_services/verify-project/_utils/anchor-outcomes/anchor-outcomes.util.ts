import nodePath from 'node:path';

import type { TSourceLocation } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TAnchoredOutcome,
  TAnchorOutcomesInput,
  TAnchorOutcomesResult,
} from './anchor-outcomes.type.js';

import { compareAnchoredOutcomes } from './_utils/compare-anchored-outcomes/index.js';
import { selectAnchorPath } from './_utils/select-anchor-path/index.js';

export function anchorOutcomes(
  input: TAnchorOutcomesInput
): TAnchorOutcomesResult {
  const fileStart: TSourceLocation = { column: 1, line: 1 };
  const anchored: TAnchoredOutcome[] = [];
  for (const outcome of input.outcomes) {
    const anchorPath = selectAnchorPath({
      baseDirectory: input.baseDirectory,
      configPath: input.configPath,
      inventory: input.inventory,
      model: input.model,
      outcome,
    });
    const elementRelative = nodePath.isAbsolute(outcome.element)
      ? nodePath
          .relative(input.baseDirectory, outcome.element)
          .replaceAll('\\', '/')
      : outcome.element.replaceAll('\\', '/');
    const anchorRelative = nodePath
      .relative(input.baseDirectory, anchorPath)
      .replaceAll('\\', '/');
    const isSameFile = elementRelative === anchorRelative;
    anchored.push({
      anchorPath,
      outcome,
      position:
        isSameFile && outcome.position !== undefined
          ? outcome.position
          : fileStart,
    });
  }
  anchored.sort(compareAnchoredOutcomes);
  const byFile = new Map<string, TAnchoredOutcome[]>();
  for (const item of anchored) {
    const existing = byFile.get(item.anchorPath) ?? [];
    byFile.set(item.anchorPath, [...existing, item]);
  }
  return { byFile, outcomes: anchored };
}

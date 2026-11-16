import type { TConfigOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TItemClassification } from '../../_conformity@shared/_types/verification-model.type.js';
import type {
  TClassifyTaxonomyInput,
  TTaxonomyClassification,
} from './_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  classifyOneTree,
  compareConfigOutcomes,
  indexItemsByParentId,
} from './classify-taxonomy.util.js';

export function classifyTaxonomy(
  input: TClassifyTaxonomyInput
): TTaxonomyClassification {
  const classifications: TItemClassification[] = [];
  const outcomes: TConfigOutcome[] = [];
  const itemsByParentId = indexItemsByParentId(input.inventory.items);

  for (const [treeIndex, tree] of input.declarations.trees.entries()) {
    const result = classifyOneTree(
      input.inventory,
      itemsByParentId,
      tree,
      treeIndex
    );
    classifications.push(...result.classifications);
    outcomes.push(...result.outcomes);
  }

  outcomes.sort(compareConfigOutcomes);
  return {
    model: {
      byItemId: new Map(
        classifications.map((classification) => [
          classification.itemId,
          classification,
        ])
      ),
      byPath: new Map(
        classifications.map((classification) => [
          classification.path,
          classification,
        ])
      ),
      classifications,
    },
    outcomes,
  };
}

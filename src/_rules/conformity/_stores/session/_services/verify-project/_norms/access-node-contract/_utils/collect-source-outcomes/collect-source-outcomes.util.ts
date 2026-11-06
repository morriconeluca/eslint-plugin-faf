import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { isPermittedEdge } from './_utils/is-permitted-edge/index.js';

export function collectSourceOutcomes(
  model: TVerificationModel
): readonly TDependencyOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { inventory } = model.basis;
  const { graph, taxonomy } = model;

  for (const edge of graph.edgeMetadata) {
    const sourceClassification = taxonomy.byPath.get(edge.sourcePath);
    if (sourceClassification?.nodeKind !== 'access-node') {
      continue;
    }

    const sourceItem = inventory.items[sourceClassification.itemId];
    const destinationClassification = taxonomy.byPath.get(edge.destinationPath);
    const destinationItem =
      destinationClassification === undefined
        ? undefined
        : inventory.items[destinationClassification.itemId];

    if (
      !isPermittedEdge(sourceItem, destinationItem, destinationClassification)
    ) {
      outcomes.push(
        createOutcome('dependency/access-node-sources', {
          from: edge.sourcePath,
          importIndex: edge.importIndex,
          position: edge.position,
          specifier: edge.specifier,
          to: edge.destinationPath,
        })
      );
    }
  }

  for (const note of graph.libraryNotes) {
    const sourceClassification = taxonomy.byPath.get(note.sourcePath);
    if (sourceClassification?.nodeKind === 'access-node') {
      outcomes.push(
        createOutcome('dependency/access-node-sources', {
          from: note.sourcePath,
          importIndex: note.importIndex,
          position: note.position,
          specifier: note.specifier,
          to: note.packageName,
        })
      );
    }
  }

  return outcomes;
}

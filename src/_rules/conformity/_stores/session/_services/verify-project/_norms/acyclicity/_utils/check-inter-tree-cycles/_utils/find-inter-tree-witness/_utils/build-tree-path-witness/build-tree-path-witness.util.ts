import type { TSourceLocation } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

export function buildTreePathWitness(
  treePath: readonly number[],
  transitions: readonly (readonly (null | {
    readonly position?: TSourceLocation;
    readonly segment: readonly string[];
  })[])[]
): null | {
  readonly position?: TSourceLocation;
  readonly witness: readonly (readonly string[])[];
} {
  const witness: (readonly string[])[] = [];
  let firstPosition: TSourceLocation | undefined;

  for (let index = 0; index < treePath.length - 1; index += 1) {
    const u = treePath[index];
    const v = treePath[index + 1];
    if (u === undefined || v === undefined) {
      return null;
    }
    const transition = transitions[u]?.[v];
    if (transition === null || transition === undefined) {
      return null;
    }
    if (index === 0) {
      firstPosition = transition.position;
    }
    witness.push(transition.segment);
  }

  return { position: firstPosition, witness };
}

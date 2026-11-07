export function buildWitnessPayload(witness: readonly string[]): {
  readonly element: string;
  readonly secondNode: string;
  readonly witness: readonly string[];
} {
  return {
    element: witness[0] ?? '',
    secondNode: witness[1] ?? '',
    witness,
  };
}

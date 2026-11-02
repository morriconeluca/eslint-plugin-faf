export function assertInvariant(
  isCondition: boolean,
  message: string
): asserts isCondition {
  if (!isCondition) {
    throw new Error(message);
  }
}

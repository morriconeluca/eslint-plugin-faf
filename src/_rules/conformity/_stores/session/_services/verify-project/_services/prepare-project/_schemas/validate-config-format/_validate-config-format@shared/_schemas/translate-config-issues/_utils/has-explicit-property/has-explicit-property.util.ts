export function hasExplicitProperty(
  parent: null | object,
  key: PropertyKey | undefined
): boolean {
  return (
    parent !== null &&
    !Array.isArray(parent) &&
    typeof key === 'string' &&
    Object.hasOwn(parent, key)
  );
}

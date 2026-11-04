export function isAliasReference(
  path: string,
  prefixes: readonly string[]
): boolean {
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function isStringDirectChild(
  childPath: string,
  parentPath: string
): boolean {
  if (parentPath === '.') {
    return childPath.length > 0 && !childPath.includes('/');
  }

  const prefix = `${parentPath}/`;
  return (
    childPath.startsWith(prefix) &&
    !childPath.slice(prefix.length).includes('/')
  );
}

/**
 * Returns the immediate sub-domain path relative to the private category path,
 * or the private category path itself if no sub-segment exists.
 * Returns an empty string if the relPath is not inside the private category path.
 */
export function getImmediateSubDomain(
  relPath: string,
  privateCategoryPath: string
): string {
  if (
    relPath !== privateCategoryPath &&
    !relPath.startsWith(privateCategoryPath + '/')
  ) {
    return '';
  }
  const relative = relPath.substring(privateCategoryPath.length + 1);
  const firstSegment = relative.split('/')[0];
  return firstSegment
    ? privateCategoryPath + '/' + firstSegment
    : privateCategoryPath;
}

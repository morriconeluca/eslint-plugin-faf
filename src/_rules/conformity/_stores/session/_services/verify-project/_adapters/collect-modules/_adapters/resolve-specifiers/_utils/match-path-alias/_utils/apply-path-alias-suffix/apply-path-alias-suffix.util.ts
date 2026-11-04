export function applyPathAliasSuffix(target: string, suffix: string): string {
  if (suffix === '') {
    return target;
  }

  if (target === '' || target === '.') {
    return suffix;
  }

  const cleanTarget = target.endsWith('/') ? target.slice(0, -1) : target;
  return `${cleanTarget}/${suffix}`;
}

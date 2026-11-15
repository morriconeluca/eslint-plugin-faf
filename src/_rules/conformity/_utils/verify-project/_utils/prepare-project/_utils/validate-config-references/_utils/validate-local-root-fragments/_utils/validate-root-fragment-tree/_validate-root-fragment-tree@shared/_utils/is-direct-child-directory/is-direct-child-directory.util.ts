import type { TInventory } from '../../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';

export function isDirectChildDirectory(
  inventory: TInventory,
  childPath: string,
  parentPath: string
): boolean {
  const isStringDirectChild = (targetPath: string): boolean => {
    if (parentPath === '.') {
      return targetPath.length > 0 && !targetPath.includes('/');
    }

    const prefix = `${parentPath}/`;
    return (
      targetPath.startsWith(prefix) &&
      !targetPath.slice(prefix.length).includes('/')
    );
  };

  const isPhysicalDirectChild = (targetPath: string): boolean => {
    const childId = inventory.pathToId.get(targetPath);
    if (childId === undefined) {
      return true;
    }

    const parentId = inventory.pathToId.get(parentPath);
    if (parentId === undefined) {
      return false;
    }

    const child = inventory.items[childId];
    if (child === undefined) {
      return true;
    }

    const parent = inventory.items[parentId];
    return parent !== undefined && child.parentId === parent.id;
  };

  return isStringDirectChild(childPath) && isPhysicalDirectChild(childPath);
}

import type { TInventory } from '../../../../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';

export const isDirectChildDirectory = (() => {
  const isStringDirectChild = (
    childPath: string,
    parentPath: string
  ): boolean => {
    if (parentPath === '.') {
      return childPath.length > 0 && !childPath.includes('/');
    }

    const prefix = `${parentPath}/`;
    return (
      childPath.startsWith(prefix) &&
      !childPath.slice(prefix.length).includes('/')
    );
  };

  const isPhysicalDirectChild = (
    inventory: TInventory,
    childPath: string,
    parentPath: string
  ): boolean => {
    const childId = inventory.pathToId.get(childPath);
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

  return function isDirectChildDirectory(
    inventory: TInventory,
    childPath: string,
    parentPath: string
  ): boolean {
    return (
      isStringDirectChild(childPath, parentPath) &&
      isPhysicalDirectChild(inventory, childPath, parentPath)
    );
  };
})();

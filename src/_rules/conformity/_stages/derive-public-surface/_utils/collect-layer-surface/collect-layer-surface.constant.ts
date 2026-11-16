export const EXPOSED_NODE_KEYS = new Set([
  'category:category-node',
  'fragment:access-node',
]);

export const NEXT_TRAVERSAL_STATE: Readonly<
  Record<string, string | undefined>
> = {
  'category:fragment': 'fragment',
  'category:path-sub-category': 'category',
  'category:sub-category': 'category',
  'organizer:category': 'category',
  'organizer:layer': 'organizer',
};

export const STATE_ORGANIZER = 'organizer';

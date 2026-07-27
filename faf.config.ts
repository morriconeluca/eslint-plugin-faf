export default {
  faf: {
    aliases: {
      '#_rules@shared': 'src/_rules/_rules@shared',
      '#_utils@shared': 'src/_rules/_rules@shared/_utils/_utils@shared',
    },
    trees: [
      {
        categories: [
          { name: '_rules', role: 'rule' },
          { name: '_utils', role: 'util' },
          { allowSingleFiles: true, name: '_types', role: 'type' },
          { name: '_stores', role: 'store' },
        ],
        excludes: ['src/configs'],
        globalHorizontalHierarchies: [
          [['_primitives'], ['_compounds'], ['_aggregates'], ['_systems']],
        ],
        includes: ['src'],
        localHorizontalHierarchies: [
          {
            hierarchies: [['_types'], ['_utils']],
            paths: ['src/_rules/_rules@shared'],
          },
        ],
        roles: [['type'], ['util'], ['rule', 'store'], ['index', 'spec']],
        rootFragments: [
          {
            paths: ['src'],
            rootNodes: [['main.type.ts'], ['main.ts']],
          },
        ],
      },
    ],
  },
};

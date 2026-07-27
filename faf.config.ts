export default {
  faf: {
    aliases: {
      '#_rules@shared': 'src/_rules/_rules@shared',
    },
    trees: [
      {
        categories: [
          { name: '_rules', role: 'rule' },
          { name: '_utils', role: 'util' },
        ],
        excludes: ['src/configs'],
        includes: ['src'],
        roles: [['type'], ['util'], ['rule'], ['index', 'spec']],
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

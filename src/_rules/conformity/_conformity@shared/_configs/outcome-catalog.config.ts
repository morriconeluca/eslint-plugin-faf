import type { TCatalogEntry, TConstraint } from '../_types/outcome.type.js';

import {
  REFERENCE_D_03,
  REFERENCE_D_04,
  REFERENCE_D_05,
  REFERENCE_D_06,
  REFERENCE_D_07,
  REFERENCE_D_08,
  REFERENCE_D_09,
  REFERENCE_D_14,
  REFERENCE_FAF_4,
  REFERENCE_FAF_4_6_3_5_6_6,
  REFERENCE_FAF_4_6_7,
  REFERENCE_FAF_5,
  REFERENCE_FAF_6,
  REFERENCE_FAF_6_1_1,
  REFERENCE_FAF_6_1_3,
  REFERENCE_FAF_6_2_2,
  REFERENCE_FAF_6_3_1,
  REFERENCE_FAF_6_3_2_MULTIPLE,
  REFERENCE_FAF_6_3_3,
  REFERENCE_FAF_6_3_5,
  REFERENCE_FAF_6_6_2,
  REFERENCE_FAF_6_7,
  REFERENCE_FAF_6_8,
  REFERENCE_FAF_6_9,
  REFERENCE_FAF_7_1,
  REFERENCE_FAF_7_2,
  REFERENCE_FAF_7_2_7_3,
  REFERENCE_FAF_7_3,
  REFERENCE_FAF_7_4,
} from '../_constants/outcome-catalog.constant.js';

export const OUTCOME_CATALOG = {
  'acyclicity/dependency-cycle': {
    family: 'acyclicity',
    form: 'cycle',
    normativeReference: REFERENCE_FAF_5,
    predicate: 'is part of a dependency cycle',
  },
  'acyclicity/inter-tree-cycle': {
    family: 'acyclicity',
    form: 'cycle',
    normativeReference: REFERENCE_FAF_7_2,
    predicate: 'is part of a dependency cycle between Fractal Trees',
  },
  'classification/category-role': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'does not have the form or the Role imposed by its Category',
  },
  'classification/containment-matrix': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_8,
    predicate: 'is a child type that its parent Logical Domain does not admit',
  },
  'classification/duplicate-fragment-role': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate:
      'has more than one direct Logical Node with the same explicit Role',
  },
  'classification/exclusive-forms': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_2_MULTIPLE,
    predicate: 'mixes mutually exclusive forms among its direct children',
  },
  'classification/fragment-node-anatomy': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate:
      'is not a Fragment Node, Access Node or Sub-Graph Node named after its Fragment',
  },
  'classification/fragment-node-rank': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_3,
    predicate:
      'has a Rank not strictly lower than the Master Node of its Fragment',
  },
  'classification/horizontal-hierarchy-members': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_9,
    predicate:
      'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
  },
  'classification/horizontal-hierarchy-overlap': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_4,
    predicate: 'is selected by more than one Horizontal Hierarchy',
  },
  'classification/missing-access-node': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate: 'has no index.ts Access Node',
  },
  'classification/missing-master-node': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate:
      'has no direct Fragment Node with the Role imposed by its Category',
  },
  'classification/nomenclature': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_4_6_3_5_6_6,
    predicate: 'does not follow the naming contract of its classification',
  },
  'classification/unclassifiable-directory': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_9,
    predicate: 'has no unique Logical Domain classification',
  },
  'classification/unclassifiable-file': {
    family: 'classification',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_9,
    predicate:
      'is neither a uniquely classified Logical Node nor a Foreign Node',
  },
  'configuration/commonjs-package-type': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate:
      'requires nearest package.json not to declare "type": "commonjs"',
  },
  'configuration/config-load-failure': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'failed to load configuration',
  },
  'configuration/conflicting-origin-kind': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'cannot be declared as both a Root Layer and a Root Fragment',
  },
  'configuration/contradictory-root-foreign': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_7,
    predicate: 'cannot be declared as both a Root Node and a Foreign Node',
  },
  'configuration/duplicate-alias-source': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_4,
    predicate:
      'cannot declare path aliases when package.json imports are present',
  },
  'configuration/duplicate-category': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'is declared more than once in the role catalog',
  },
  'configuration/duplicate-element': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'is a duplicate element',
  },
  'configuration/duplicate-implicit-extension': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'is declared more than once across roles',
  },
  'configuration/duplicate-mimetic-path': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_5,
    predicate: 'is designated more than once as a mimetic path',
  },
  'configuration/duplicate-origin': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'is declared more than once as a tree origin',
  },
  'configuration/duplicate-role-name': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'is declared more than once in the role catalog',
  },
  'configuration/empty-list': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'cannot be an empty list',
  },
  'configuration/empty-string': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'cannot be an empty string',
  },
  'configuration/empty-tier': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'cannot be an empty tier',
  },
  'configuration/expected-directory': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'must be a directory',
  },
  'configuration/expected-file': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'must be a file',
  },
  'configuration/explicit-undefined': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'cannot be explicitly undefined',
  },
  'configuration/external-dependency-to-alias': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_3,
    predicate:
      'cannot be targeted as an external dependency because it is a path alias',
  },
  'configuration/external-dependency-to-inside-tree': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_3,
    predicate:
      'must be outside all Fractal Trees as an external dependency target',
  },
  'configuration/external-dependency-to-library': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_3,
    predicate:
      'cannot be targeted as an external dependency because it is a node_modules library',
  },
  'configuration/implicit-extension-category-node-mismatch': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'must be true for a role with implicit extensions',
  },
  'configuration/implicit-extension-role-name-prefix': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'cannot start with a segment matching a role name',
  },
  'configuration/incompatible-foreign-origin': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_7,
    predicate: 'cannot be designated as a foreign domain',
  },
  'configuration/incompatible-mimetic-designation': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_5,
    predicate: 'must identify a Category of Fragments',
  },
  'configuration/incompatible-root-in-foreign-domain': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_7,
    predicate: 'cannot be designated inside a foreign domain',
  },
  'configuration/invalid-action-name': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_5,
    predicate: 'must adhere to kebab-case grammar',
  },
  'configuration/invalid-alias-key': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_4,
    predicate: 'must begin with an allowed prefix and follow valid syntax',
  },
  'configuration/invalid-alias-source': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_4,
    predicate: 'must declare valid imports with subpath keys',
  },
  'configuration/invalid-default-export-function': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'cannot export a function as its default export',
  },
  'configuration/invalid-default-export-promise': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'cannot export a Promise as its default export',
  },
  'configuration/invalid-external-dependency-source': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_3,
    predicate: 'must be an authorized logical node in externalDependencies',
  },
  'configuration/invalid-file-name': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_4,
    predicate: 'must adhere to kebab-case grammar',
  },
  'configuration/invalid-foreign-pattern': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_05,
    predicate: 'must adhere to allowed glob pattern grammar',
  },
  'configuration/invalid-implicit-extension': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'must start with a dot and contain only lowercase letters',
  },
  'configuration/invalid-literal-path': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_05,
    predicate: 'must be a POSIX relative path without empty or parent segments',
  },
  'configuration/invalid-origin': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'must be a directory',
  },
  'configuration/invalid-package-json': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'is invalid or unreadable',
  },
  'configuration/invalid-public-root-node': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_1,
    predicate: 'must identify an enumerated Root Node in publicRootNodes',
  },
  'configuration/invalid-root-dependency-from': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate: 'must be an enumerated root node as a root dependency source',
  },
  'configuration/invalid-root-dependency-to': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate: 'must be an enumerated root node as a root dependency target',
  },
  'configuration/invalid-type': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'has an invalid type',
  },
  'configuration/missing-config-file': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'was not found',
  },
  'configuration/missing-default-export': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'must declare a default export',
  },
  'configuration/missing-origin': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'must be an existing tree origin directory',
  },
  'configuration/missing-property': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'is required and missing',
  },
  'configuration/missing-roles': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'must declare a roles catalog in local or common configuration',
  },
  'configuration/nested-root-fragment-not-direct-child': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate: 'must be a direct child directory of the root fragment',
  },
  'configuration/non-existent-path': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'does not exist',
  },
  'configuration/null-forbidden': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'cannot be null',
  },
  'configuration/origin-contained-in-other-tree': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'cannot be contained within another tree',
  },
  'configuration/origin-designated-foreign-domain': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_7,
    predicate: 'cannot be designated as a foreign domain',
  },
  'configuration/overlapping-origins': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'overlaps with another declared tree origin',
  },
  'configuration/public-root-node-not-enumerated': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_1,
    predicate: 'must be an enumerated root node of its tree in publicRootNodes',
  },
  'configuration/public-root-nodes-in-root-layer-tree': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_1,
    predicate:
      'cannot be declared as a public root node in a tree with only Root Layers',
  },
  'configuration/reference-outside-local-scope': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6,
    predicate: 'must belong to a tree within this local configuration',
  },
  'configuration/reference-outside-trees': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6,
    predicate: 'must be inside a Fractal Tree of this configuration',
  },
  'configuration/role-name-conflict': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_3_1,
    predicate: 'conflicts with a standard role name',
  },
  'configuration/root-dependency-different-tree': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate: 'must belong to the same tree as the root dependency source',
  },
  'configuration/root-dependency-same-fragment': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate: 'cannot belong to the same root fragment as its source',
  },
  'configuration/root-node-not-direct-child': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate: 'must be a direct child root node of the root fragment',
  },
  'configuration/scope-mismatch': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'cannot be declared in this configuration scope',
  },
  'configuration/tree-dependency-from-outside-scope': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_2,
    predicate:
      'must belong to this local configuration as a tree dependency source',
  },
  'configuration/tree-dependency-not-tree-origin': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_2,
    predicate: 'must identify a declared tree origin as a tree dependency',
  },
  'configuration/tree-dependency-self': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_2,
    predicate: 'cannot declare a tree dependency on itself',
  },
  'configuration/unclonable-config-value': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'exports a default value that cannot be cloned',
  },
  'configuration/undeclared-sub-root-fragment': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate: 'must be declared in subRootFragments',
  },
  'configuration/unenumerated-root-file': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate:
      'must be either enumerated as a Root Node or designated as a Foreign Node',
  },
  'configuration/unknown-property': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_14,
    predicate: 'is not a recognized property',
  },
  'configuration/unresolvable-alias-base': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_FAF_7_4,
    predicate: 'defines a path alias whose base path cannot be resolved',
  },
  'configuration/unresolved-relative-import': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'requires relative imports to include explicit file extensions',
  },
  'configuration/unsupported-typescript-syntax': {
    family: 'configuration',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'contains unsupported non-strippable TypeScript syntax',
  },
  'dependency/access-node-sources': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate:
      'an Access Node imports only direct Fragment Nodes of its own Fragment',
  },
  'dependency/external-dependencies': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_7_3,
    predicate:
      'a local file outside all Fractal Trees is importable only with an externalDependencies authorization of this source',
  },
  'dependency/foreign-node-isolation': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_4_6_7,
    predicate: 'a Foreign Node has no import relation with codebase files',
  },
  'dependency/fractal-branch-unidirectionality': {
    family: 'dependency',
    form: 'edge-or-path',
    normativeReference: REFERENCE_FAF_6_6_2,
    predicate:
      'a Fractal Branch must not depend on the other subtrees of its parent',
  },
  'dependency/fractal-branch-visibility': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_6_6_2,
    predicate:
      'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
  },
  'dependency/fragment-encapsulation': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate:
      'a Fragment is importable from outside only through its index.ts',
  },
  'dependency/path-alias-anchoring': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_7_4,
    predicate:
      'a Path Alias importing its own Fractal Tree must have a Fractal Branch of that Tree as base in every alternative',
  },
  'dependency/peer-separation': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_5,
    predicate:
      'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
  },
  'dependency/private-category-unidirectionality': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_6_3_3,
    predicate:
      'a Private Category must not import the direct Logical Nodes of its parent',
  },
  'dependency/private-category-visibility': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_6_3_3,
    predicate:
      'a Private Category is importable from outside only by the enabled direct Logical Nodes of its parent',
  },
  'dependency/re-entry-prohibition': {
    family: 'dependency',
    form: 'path',
    normativeReference: REFERENCE_FAF_7_3,
    predicate:
      'a path through local files outside all Fractal Trees must not re-enter its Fractal Tree',
  },
  'dependency/root-node-discipline': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_6_2_2,
    predicate:
      'a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges',
  },
  'dependency/sub-graph-node-isolation': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_4,
    predicate: 'a Sub-Graph Node is not importable',
  },
  'dependency/tree-authorization': {
    family: 'dependency',
    form: 'edge-or-path',
    normativeReference: REFERENCE_FAF_7_2_7_3,
    predicate:
      'a dependency between Fractal Trees requires an oriented treeDependencies authorization',
  },
  'dependency/tree-opacity': {
    family: 'dependency',
    form: 'edge',
    normativeReference: REFERENCE_FAF_7_1,
    predicate:
      'only the Public Surface of a Fractal Tree is importable from outside the Tree',
  },
  'symbol/access-node-master-export': {
    family: 'symbol',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate: 'does not re-export the Symbol of its Master Node',
  },
  'symbol/access-node-own-symbols': {
    family: 'symbol',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate: 'defines its own Symbols as Access Node',
  },
  'symbol/master-symbol': {
    family: 'symbol',
    form: 'element',
    normativeReference: REFERENCE_FAF_6_1_1,
    predicate: 'does not define and export exactly one Symbol as Master Node',
  },
  'symbol/re-export-prohibition': {
    family: 'symbol',
    form: 'element',
    normativeReference: REFERENCE_FAF_5,
    predicate: 're-exports an imported Symbol',
  },
  'symbol/symbol-uniqueness': {
    family: 'symbol',
    form: 'element',
    normativeReference: REFERENCE_FAF_5,
    predicate: 'defines more than one Symbol in its root scope',
  },
  'unverified/config-loading-timeout': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_09,
    predicate: 'timed out during configuration loading',
  },
  'unverified/cyclic-root-authorization': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_04,
    predicate:
      'declares reciprocal root dependency authorizations without physical code cycle',
  },
  'unverified/cyclic-tree-authorization': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_04,
    predicate:
      'declares reciprocal tree dependencies without physical code cycle',
  },
  'unverified/non-literal-dynamic-import': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_07,
    predicate:
      'contains a non-literal dynamic import that cannot be resolved statically',
  },
  'unverified/not-implemented': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_03,
    predicate: 'is not implemented',
  },
  'unverified/symbolic-link': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'is a symbolic link within a tree',
  },
  'unverified/unreadable-entry': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'could not be inspected',
  },
  'unverified/unreadable-external-file': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_03,
    predicate: 'could not be read',
  },
  'unverified/unreadable-origin': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_06,
    predicate: 'could not be accessed',
  },
  'unverified/unresolved-import': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_08,
    predicate: 'contains an import that could not be resolved',
  },
  'unverified/unsupported-syntax': {
    family: 'unverified',
    form: 'element',
    normativeReference: REFERENCE_D_07,
    predicate: 'contains unsupported syntax',
  },
} as const satisfies Record<TConstraint, TCatalogEntry>;

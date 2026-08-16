---
'@morriconeluca/eslint-plugin-faf': minor
---

Split `naming-conventions` and `no-peer-dependency` — the two rules that had accumulated most of the plugin's checks — into eleven focused rules along their real semantic boundaries, and added one previously-missing check to `no-fractal-branch-leak`. Every moved check keeps its exact behavior and error message text; only the reporting `ruleId` changes.

This is a breaking change for anyone not using `configs.recommended` (which picks up the new rules automatically), or referencing a specific rule `id` directly (e.g. `// eslint-disable-next-line faf/<id>`, or a hand-written `rules` block).

**`naming-conventions`** is now restricted to pure lexical checks (kebab-case, underscore prefix rules, Fractal Branch naming, single-Role-segment, Category loose-file naming). Three checks moved out of it:

- **`logical-domain-placement`** (new): Root Fragment/Layer/Fragment/Fractal Branch topological placement — where a domain is allowed to physically sit relative to its parent.
- **`enforce-access-node`** (existing rule, absorbs two checks): Access Node existence for a directory that should have one, and "Fragment has no Master Node".
- **`fragment-master-node`** (new): Fragment Node name prefix, role requirement/uniqueness within a Fragment, Category/Route-imposed Master Node role, and the route terminal `<method>-<object>` naming pattern.

**`no-peer-dependency`** is now restricted to horizontal hierarchy resolution (same-directory Fragment Node Role order, sibling directory hierarchies). Two checks moved out of it:

- **`foreign-domain-isolation`** (new): Imports between Logical Nodes and Foreign Domains, in both directions.
- **`root-node-dependency-direction`** (new): Dependency direction between Root Nodes via `rootFragments.rootNodes`, with no fallback to the Role scale.

**`no-fractal-branch-leak`** gains a new check: a Fractal Branch depending on the subtree it serves — even indirectly, even on something outside a Private Category — is now reported. This is the only genuinely new behavior in this change; everything else is a move.

`no-direct-fragment-import`, `no-private-category-leak`, and `category-mutually-exclusive` are unaffected.

Internally, the repeated ancestor-directory traversal used by folder taxonomy and placement checks is now a single cached utility (`walkAncestors`) shared across rules, instead of being re-walked and re-classified per file per rule.

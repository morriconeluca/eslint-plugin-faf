# Fractal Architecture Framework (FAF)

FAF governs TypeScript codebase architecture through directory hierarchy and file naming (_Architecture is Code_).

- **Declaration**: An architectural decision formally stated by the architect. Declarations are binding architectural constraints that complement FAF conventions. Declarations must be complete, consistent with the FAF taxonomy, and must never derogate from any FAF norm.
- **Conformance**: Prescriptions marked with _it is recommended_ are recommendations (non-binding for conformance). Every other prescription is a mandatory **norm**. Conformance requires satisfying all norms and all Declarations.

## 1. Principles

A **Fractal Tree** is a codebase subtree rooted at an origin directory identified by a Declaration.

- **Fractal Decomposition**: A codebase models a software system through one or more disjoint Fractal Trees (sharing no files or directories), each forming an autonomous architectural space dedicated to a specific problem. Files and directories outside all Fractal Trees fall outside the FAF taxonomy. Within each Fractal Tree, cohesive sub-problems are solved recursively at every scale by dedicated logical units governed by a self-similar organizational structure.
- **Semantic Form**: File and directory hierarchy and naming must reveal the architectural purpose of every logical unit.
- **Proportionality**: Decomposition depth and granularity must match the complexity of the problem solved.

## 2. Foundations

- **Dependency Graph**: Within a Fractal Tree, the directed graph whose vertices are its Logical Nodes and whose edges connect each source vertex to each directly imported target vertex. An **import** is any static reference by which a file requires resolution of another file in the codebase (including `import`, `import type`, `export … from`, `import()` with a literal specifier, `require`, and stylesheet `@import` and `url()`).
- **Logical Nodes and Foreign Nodes**: Every file in a Fractal Tree is exclusively either:
  - **Logical Node**: A vertex of the Dependency Graph permitted to import, export, or be imported.
  - **Foreign Node**: A file identified by a Declaration as excluded from the Dependency Graph. Foreign Nodes must have no incoming or outgoing imports with any file in the codebase. No file is a Foreign Node without a Declaration covering it, regardless of extension or content.
- **Asset**: A Logical Node whose content is not TypeScript or JavaScript code (e.g., stylesheets, fonts, images, JSON).
- **Symbol**: Each root-scope declaration in a non-Asset Logical Node, in the value space or type space, exported or unexported (e.g., `const`, `let`, `var`, `function`, `class`, `enum`, `type`, `interface`, `namespace`).
  - Distinct Symbols: each individual binding in multi-variable or destructured declarations; each declaration in same-name declaration merging; each declaration initialized with an imported binding.
  - Single Symbol: all overload signatures together with the implementation of the same function; an anonymous `export default`.
  - Import declarations introduce no Symbols.
- **Role**: Semantic label qualifying a Logical Node's architectural responsibility. For one or more Fractal Trees, a Declaration establishes a closed catalog of Roles, distinguishing **Sub-Graph Roles** from ordinary Roles, and defines any **implicit extensions** (Asset extensions bound to an ordinary Role; each implicit extension belongs to a single Role, and its first segment must not match any Role name in the catalog).
  - Given dot-separated filename segments where `<name>` is the initial segment (containing no `.`) and `<extension>` is either the final segment or a trailing multi-segment implicit extension (e.g., `tar.gz` for `.tar.gz`), a Logical Node's Role (except Root Nodes) is:
    - **Explicit**: `<name>.<role>.<extension>` with `<role>` in the catalog (e.g., `button.component.tsx`, `button.module.css`).
    - **Implicit**: an Asset named `<name>.<extension>` where `<extension>` is an implicit extension of that Role (e.g., `theme.css`, `inter.woff2`, `bundle.tar.gz`).
    - **Absent**: matches neither form (e.g., `index.ts`, `example.util.spec.ts`).
- **Execution Sub-Graphs, Sub-Graph Roles, and Sub-Graph Nodes**: Each execution context (e.g., build-time, runtime, test, component workbench) operates on an **Execution Sub-Graph** of the Dependency Graph induced by reachability from its entry Logical Nodes. A **Sub-Graph Role** (e.g., `spec`, `story`) is reserved for entry Logical Nodes of dedicated Execution Sub-Graphs and is attributed exclusively in explicit form. A **Sub-Graph Node** is a Logical Node with a Sub-Graph Role and must not be imported by any Logical Node.
- **Logical Domain**: Every directory in a Fractal Tree, forming a transitive semantic boundary over all Logical Domains, Logical Nodes, and Foreign Nodes in its subtree. Every Logical Domain may directly contain Foreign Nodes and Foreign Domains, and is either:
  - **Functional**: isolates a single logical unit (`Fragment`, `Root Fragment`).
  - **Organizational**: does not constitute a single logical unit (`Category`, `Sub-Category`, `Path Sub-Category`, `Layer`, `Root Layer`, `Fractal Branch`, `Foreign Domain`).
- **Horizontal Hierarchy**: A Declaration assigning a natural-number **Rank** ($0, 1, 2, \dots$) to each element of a homogeneous set of direct-child siblings (either Logical Nodes or Logical Domains, never mixed) under one parent Logical Domain.
  - Authorizes dependencies exclusively within its set, from Rank $N$ to strictly lower Rank $M$ ($M < N$). Multiple Horizontal Hierarchies under the same parent may coexist only on disjoint sets of direct children; Ranks from distinct Horizontal Hierarchies are not comparable.
  - Permitted **exclusively** on: (1) direct-child Logical Nodes of a Fragment, (2) Root Nodes of a Root Fragment (at most one hierarchy per Root Fragment), (3) non-private sibling Categories (domain-specific, including adopting their Roles' Ranks), (4) sibling Sub-Categories excluding Path Sub-Categories (including inside a Private Category), or (5) sibling Layers or Sub-Layers (domain-specific, without predefined reference models). Forbidden on all other sets (including sibling Fragments, sibling Category Nodes, sibling Private Categories, and Path Sub-Categories). Membership does not alter Logical Domain classification.
- **Naming**: Unless otherwise prescribed by external technology contracts or FAF, file and directory identifiers use `kebab-case` combined with FAF's syntactic delimiters. Foreign Nodes, Foreign Domains, Fractal Tree origin directories, child Root Fragments, and Root Nodes have free naming. For all other Logical Domains, a leading underscore (`_`) marks Organizational Logical Domains, whereas Functional Logical Domains omit `_`.

## 3. Dependency Graph Laws

- **Directed Acyclic Graph (DAG)**: The Dependency Graph must be acyclic.
- **Peer Separation**: Any dependency between Logical Nodes in subtrees of sibling Logical Domains, or between sibling Logical Nodes in the same Logical Domain, is forbidden unless authorized by an applicable Horizontal Hierarchy or by the visibility rules of specific Logical Domains.
- **Symbol Uniqueness**: Each Logical Node with an explicit Role, other than an Asset or a Sub-Graph Node, must define at most one Symbol coherent with its Role, unless the catalog Declaration allows multiple Symbols for that Role. Additional Symbols each require a dedicated Logical Node.
  - _It is recommended_ to allow multiple Symbols in the catalog Declaration exclusively for Roles whose nature entails correlated or auxiliary declarations (e.g., `constant`, `mock`, `recipe`, `schema`, `styled`, `type`, `util`).
  - Where a Role permits multiple Symbols, only mutually inseparable Symbols within the same responsibility may coexist in one Logical Node; autonomous Symbols require distinct Logical Nodes or dedicated Sub-Fragments.
  - Mechanical derivability between Symbols does not imply architectural identity: Symbols serving distinct responsibilities must reside in distinct Logical Nodes with distinct Roles (e.g., a validation schema and its inferred static type).
- **No Re-Export**: Every Logical Node with an explicit Role must not re-export imported Symbols.

## 4. Logical Domains

Every Logical Domain may directly contain Foreign Nodes and Foreign Domains; each subsection below specifies exhaustive placement and remaining direct children.

### 4.1. Fragments

A **Fragment** is a Functional Logical Domain (`kebab-case`, no `_` prefix) implementing a cohesive, self-contained logical unit (e.g., `button/`, `use-example/`). Every Fragment has a Role (the _Role of the Fragment_) qualifying the unit implemented.

- **Placement and Nesting**: Placed exclusively as a direct child of a Category, Sub-Category, or Path Sub-Category (which imposes the Fragment's Role). A Fragment may enclose internal Fragments in its subtree exclusively via intermediate Organizational Logical Domains (`Private Categories` or `Fractal Branches`); each enclosed Fragment is a **Sub-Fragment** relative to its nearest enclosing **Parent Fragment** (with no interposed Fragments).
- **Direct Children**: Private Categories, at most one Fractal Branch, and direct-child Logical Nodes (in which each explicit Role appears **at most once**) of exclusively three kinds:
  - **Fragment Nodes**: Explicit non-Sub-Graph Role, named `<fragment>.<role>.<extension>` (`<fragment>` matching the Fragment directory name). Includes a mandatory **Master Node** — the unique Fragment Node with the Fragment's Role — which must define and export **exactly one** Symbol, even when the catalog Declaration permits multiple Symbols for that Role. Importing any Fragment Node from outside the Fragment's directory is forbidden.
  - **Access Node** (`index.ts`): Mandatory unique Logical Node with absent Role, forming the Fragment's exclusive public interface. Must re-export the Master Node's Symbol, may selectively re-export other Fragment Nodes' Symbols of the same Fragment, must not define its own Symbols, and must not import or re-export from anything other than the Fragment Nodes of the same Fragment.
  - **Sub-Graph Nodes**: Explicit Sub-Graph Role, named `<fragment>.<role>.<extension>`, consuming or observing the Fragment's Fragment Nodes for dedicated Execution Sub-Graphs.
- **Internal Horizontal Hierarchy**: The catalog Declaration assigns a Rank to every non-Sub-Graph Role. Direct-child Logical Nodes of a Fragment are ordered by the Horizontal Hierarchy in which each Fragment Node takes its Role's Rank, while the Access Node and Sub-Graph Nodes jointly occupy `maxCatalogRank + 1`. Every Fragment Node other than the Master Node must have a Rank **strictly lower** than the Master Node's Rank.
- **Reference Model for Roles** _(illustrative; active only as adopted by Declaration — Roles model composable responsibilities, and co-ranking application coordination Roles prevents bundling multiple primary responsibilities into one Fragment)_:
  - **Rank 0** (Static Assets): `font`, `image`
  - **Rank 1** (Declarative Styles & Markup): `markup`, `module` (CSS Modules), `style` (CSS)
  - **Rank 2** (Primitive Constants): `constant`
  - **Rank 3** (Declarative Data Models): `model`
  - **Rank 4** (Style Recipes): `recipe`
  - **Rank 5** (Validation Schemas): `schema`
  - **Rank 6** (Static Types): `type`
  - **Rank 7** (Typed Errors): `error`
  - **Rank 8** (Mock Data): `mock`
  - **Rank 9** (Configuration): `config`
  - **Rank 10** (Typed Styled Constructs): `styled`
  - **Rank 11** (Pure Utilities): `util`
  - **Rank 12** (Stateful Constructs): `class`
  - **Rank 13** (Creational Factories): `factory`
  - **Rank 14** (Preconfigured Instances): `instance`
  - **Rank 15** (Local Coordination): `controller`, `handler`, `hook`
  - **Rank 16** (Application Coordination): `api`, `component`, `context`, `job`, `layout`, `middleware`, `page`, `repository`, `route`, `router`, `service`, `store`
  - **Rank 17** (Top Rank): `index.ts` (Access Node), `spec` (Sub-Graph Node), `story` (Sub-Graph Node)

### 4.2. Root Fragments

A **Root Fragment** is a Functional Logical Domain with free naming (e.g., `src/`, `app/`) acting either as a boundary with external tools (e.g., bundler entry points, file-system routers) or to surface the system's primary semantically relevant functional partitions directly at the root of the Fractal Tree without burying them in internal domains. _It is recommended_ that a Root Fragment's name not use the `_` prefix.

- **Placement and Identification**: Placed exclusively as the origin of a Fractal Tree or as a direct child of another Root Fragment. Identified exclusively by a Declaration, which also enumerates its direct-child Root Fragments. Has no Master Node and no Access Node.
- **Direct Children and Root Nodes**: Direct-child Logical Domains: declared child Root Fragments, Private Categories, and at most one Fractal Branch. All direct-child Logical Nodes are **Root Nodes**, exhaustively enumerated by Declaration (every other direct-child file must be declared a Foreign Node). Root Nodes have free naming and **absent Role** regardless of filename form (Role Ranks, Symbol Uniqueness, and No Re-Export do not apply).
- **Root Node Dependencies**: Within the same Fractal Tree, a Root Node must not be imported by any Logical Node other than another Root Node. Dependencies between Root Nodes are forbidden unless authorized by:
  - **Same Root Fragment**: a single declared Horizontal Hierarchy ordering its Root Nodes.
  - **Distinct Root Fragments (same Fractal Tree)**: a Declaration authorizing edges from source Root Nodes of a source Root Fragment to target Root Nodes of other Root Fragments (multiple sources and targets authorize every source–target pair; target membership in its containing Root Fragment is unchanged; authorizations do not require imports to exist and grant neither reverse nor transitive edges).

### 4.3. Categories

A **Category** is an Organizational Logical Domain (`_` prefix, `kebab-case`) classifying homogeneous units sharing a single Role (e.g., `_components/`, `_hooks/`, `_styles/`, `_types/`).

- **Catalog Binding and Placement**: The catalog Declaration maps every non-Sub-Graph Role to a distinct exact Category name (without requiring a Category directory to exist; _it is recommended_ to use plural names). Unless overridden by Path Sub-Category rules or a Foreign Domain Declaration, any directory in a Fractal Tree matching a Category name is a Category and imposes its associated Role. Placed exclusively as a direct child of a Root Layer, Layer, or Fractal Branch (non-private Category), or of a Fragment or Root Fragment (**Private Category**). Categories, Sub-Categories, and Path Sub-Categories forbid Access Nodes (`index.ts`); each classified unit is imported individually.
- **Category Form and Category Nodes**: A **Category Node** is a Logical Node not encapsulated in a Fragment, classified by a Category (or Sub-Category), whose Role matches that Category's Role. Per Role across the entire Fractal Tree, the catalog Declaration establishes one mutually exclusive form:
  - **Category of Fragments**: classifies Fragments whose Role matches the Category's Role.
  - **Category of Category Nodes**: classifies Category Nodes with explicit or implicit Role. Within a Fractal Tree, Logical Nodes with an **implicit Role** are permitted **exclusively** as Category Nodes. Any Role with implicit extensions must adopt the Category Nodes form tree-wide. A Role with Category Nodes form forbids encapsulating individual units in Fragments or attaching dedicated Sub-Graph Nodes to them, while remaining allowed in explicit form for non-Master Fragment Nodes inside Fragments of other Roles.
  - Direct-child Logical Nodes with absent Role or a Role different from the Category's Role are forbidden.
- **Sub-Categories**: Nested Organizational Logical Domains (`_` prefix, `kebab-case`; _it is recommended_ to use plural names) partitioning a Category's content. Unless governed by a Mimetic Path Structure or classified as a Fractal Branch or Foreign Domain, every Organizational direct-child directory of a Category or Sub-Category whose name does not match any Category name is a Sub-Category. Placed exclusively as a direct child of a Category (its **Parent Category**) or another Sub-Category, propagating the Parent Category's Role and form unchanged. Within each ordinary Category and Sub-Category (besides an optional Fractal Branch), branching into Sub-Categories and directly containing Fragments or Category Nodes are **mutually exclusive**.
- **Private Categories**: Any Category directly inside a Fragment or Root Fragment.
  - From outside a Private Category, imports into it are permitted **exclusively** from direct-child Logical Nodes of its parent Logical Domain — in a Fragment, its Fragment Nodes and Sub-Graph Nodes (**excluding** `index.ts`); in a Root Fragment, its direct-child Root Nodes — subject to inner encapsulation boundaries.
  - Unidirectional: no Logical Node in a Private Category's subtree may import direct-child Logical Nodes of the parent Logical Domain.
- **Sub-Category Reference Models** _(for Horizontal Hierarchies when adopted by Declaration)_:
  - **Atomic Design** (UI components): Rank 0 `_atoms`, Rank 1 `_molecules`, Rank 2 `_organisms`, Rank 3 `_templates`. (_It is recommended_ to classify `pages` via a distinct sibling Category bound to its own Role, e.g., `_pages/` with Role `page`, rather than as a Sub-Category of components.)
  - **Systemic Design** (logical, algorithmic, or infrastructural domains): Rank 0 `_primitives`, Rank 1 `_compounds`, Rank 2 `_aggregates`, Rank 3 `_systems`, Rank 4 `_ecosystems`.
- **Mimetic Path Structure**: Topological configuration established by a Declaration on a Category of Fragments (**Parent Category**; forbidden on a Category of Category Nodes) to map an external hierarchical address space (e.g., HTTP/REST endpoints, programmatic UI routes, CLI commands, event topics, RPC/IPC namespaces).
  - **Path Sub-Categories**: Organizational direct-child directories (other than a Fractal Branch or Foreign Domains) of the Parent Category or another Path Sub-Category, mapping external address segments 1-to-1 and propagating the Parent Category's Role unchanged (overriding Category-name matching):
    - **Static**: `_<segment>/` in `kebab-case` matching the external segment (exempt from plural naming).
    - **Dynamic**: `_[<parameter>]/` with `<parameter>` in `kebab-case` (e.g., `_[todo-id]/`).
  - **Path Fragments**: Fragments (with the Parent Category's Role) placed directly in the Parent Category (root coordinate) or in a Path Sub-Category, named according to one mutually exclusive declared mode:
    - **With Action Catalog**: `<action>-<target>` in `kebab-case`, where `<action>` belongs to the closed declared **Action Catalog** (split by longest matching prefix in the Action Catalog when compound actions overlap) and `<target>` identifies the target entity/resource.
    - **Without Action Catalog**: `<target>` in `kebab-case`.
  - Direct children of the Parent Category or a Path Sub-Category: at most one Fractal Branch, Path Sub-Categories, and Path Fragments (**coexistence permitted**; Category Nodes forbidden).

### 4.4. Layers

A **Layer** is an Organizational Logical Domain (`_` prefix, `kebab-case`) defining a cross-Role architectural abstraction plane (e.g., `_domain/`, `_network/`, `_ui/`), bound to no single Role and imposing no Role.

- **Placement and Direct Children**: Placed exclusively as a direct child of a Root Layer, a Fractal Branch, or another Layer (where it is a **Sub-Layer**, governed by Layer rules). Direct children: at most one Fractal Branch, and **exclusively one of** non-private Categories or child Sub-Layers.

### 4.5. Root Layers

A **Root Layer** is an Organizational Logical Domain with free naming (e.g., `src/`, `lib/`) structuring the origin of a Fractal Tree directly into organizational partitions, bound to no Role and imposing no Role.

- **Placement and Direct Children**: Identified exclusively by a Declaration and placed exclusively as the origin of a Fractal Tree (every Fractal Tree origin is either a Root Fragment or a Root Layer). Direct children: at most one Fractal Branch, and **exclusively one of** non-private Categories or Layers.

### 4.6. Fractal Branches

A **Fractal Branch** is an Organizational Logical Domain encapsulating shared units and implementation details across subtrees of its parent Logical Domain.

- **Naming, Placement, and Direct Children**: Identified by the reserved name `_<scope>@shared/`, where `<scope>` is the parent Logical Domain's directory name stripped of any leading `_` (e.g., `src/` -> `_src@shared/`, `button/` -> `_button@shared/`, `_hooks/` -> `_hooks@shared/`, `_[todo-id]/` -> `_[todo-id]@shared/`); at most one per parent. Placed exclusively as a direct child of a Root Fragment, Root Layer, Fragment, Category, Sub-Category, Path Sub-Category, or Layer. Direct children: **exclusively one of** non-private Categories or Layers.
- **Visibility and Unidirectionality**:
  - **Authorized consumers**: From outside the Fractal Branch, access is permitted **exclusively** to Logical Nodes in the subtree of the Fractal Branch's parent Logical Domain, **excluding** the parent's Access Node (`index.ts`) when the parent is a Fragment.
  - **Encapsulation boundary**: Authorized consumers may import **exclusively** units classified by direct Categories of the Fractal Branch or of Layers/Sub-Layers inside it (including their Sub-Categories and Path Sub-Categories): for each Fragment its Access Node, for each Category Node the Category Node itself. Visibility does **not** cross into Fragments, Private Categories, or nested Fractal Branches.
  - **Unidirectionality**: No Logical Node in a Fractal Branch's subtree may depend, directly or indirectly, on direct-child Logical Nodes of the parent Logical Domain or on any Logical Node in the parent's other subtrees.

### 4.7. Foreign Domains

A **Foreign Domain** is an Organizational Logical Domain with free naming (_it is recommended_ to use the `_` prefix where not constrained by external contracts, e.g., `_tooling/`), identified by a Declaration to isolate Foreign Nodes.

- **Placement, Scope, and Precedence**: May be a direct child of any Logical Domain and admits **exclusively** Foreign Nodes and nested Foreign Domains; the Declaration extends automatically to its entire subtree without individual enumeration. Declaring a path as a Foreign Domain overrides Category-name matching at that path without altering other occurrences of that name.
- **Standalone Foreign Nodes**: Foreign Nodes outside Foreign Domains must be identified by Declarations targeting individual files or file families defined by an explicit criterion and an application scope.

### 4.8. Classification Completeness

- Declarations and FAF conventions must assign every file in a Fractal Tree uniquely as a Logical Node or Foreign Node, and every directory uniquely as one Logical Domain kind; any unclassified or ambiguously classified file or directory is a violation.
- In containers eligible to host Layers (`Root Layer`, `Layer`, `Fractal Branch`), Organizational directories (`_` prefix) not classified as Categories, Fractal Branches, or Foreign Domains are Layers (or Sub-Layers).

## 5. Fractal Tree Frontier and External Relations

- **Public Surface**: Exclusive interface of a Fractal Tree to external consumers:
  - **Root Fragment origin**: zero, one, or more Root Nodes of the Fractal Tree designated by a Declaration.
  - **Root Layer origin**: determined structurally (without Declaration), comprising exclusively units classified by direct Categories of the Root Layer or of Layers/Sub-Layers inside it (including their Sub-Categories and Path Sub-Categories) — each Fragment's Access Node and each Category Node — without crossing into Fragments, Private Categories, or any Fractal Branch (including the Root Layer's own Fractal Branch).
  - **External opacity**: From outside the Fractal Tree, importing any Logical Node outside its Public Surface is forbidden.
  - **Internal invariance**: Exposure in the Public Surface does not alter intra-tree visibility constraints.
- **Inter-Tree Relations**: Fractal Trees are mutually isolated by default. Any dependency from a Logical Node of a source Fractal Tree to a target Fractal Tree is forbidden unless a Declaration authorizes the directed relation `source -> target`. When authorized, any Logical Node of the source Fractal Tree — **except Fragment Access Nodes** — may import exclusively Logical Nodes in the target Fractal Tree's Public Surface (subject to No Re-Export on explicit-Role importers). The directed dependency graph across Fractal Trees must be a **DAG** (no direct or transitive cycles).
- **External Local Codebase Files** _(modular codebase files outside all Fractal Trees, distinct from external library packages)_:
  - **Outgoing dependencies**: Logical Nodes of a Fractal Tree (**excluding Fragment Access Nodes**) must not import codebase files outside all Fractal Trees unless a Declaration specifies both the permitted external paths and the Logical Nodes or Logical Domains authorized to import them.
  - **Induced inter-tree dependencies**: Any import path from a Logical Node of one Fractal Tree to a Logical Node of another Fractal Tree traversing exclusively codebase files outside all Fractal Trees constitutes a dependency between those two Fractal Trees.
  - **No re-entry**: No import path traversing codebase files outside all Fractal Trees may re-enter the originating Fractal Tree.
- **Path Aliases** _(optional path abbreviations bound to a base target, e.g., `#_src@shared/*`)_:
  - **Anchoring**: Importing a Logical Node within the **same** Fractal Tree via a Path Alias requires the alias's base target to be a Fractal Branch of that Fractal Tree.
  - **Invariance**: Path Aliases do not modify the Dependency Graph or bypass any visibility, encapsulation, unidirectionality, acyclicity, or authorization rule.

## 6. Design and Evolution Criteria

- **Placement by Proximity and Domain Relevance**: _It is recommended_ to place each unit according to its actual consumers in the codebase and its domain significance, without positioning it preemptively for consumers that do not exist yet:
  - **Proximity and lowest common ancestor**: An implementation detail without standalone domain significance resides at the most specific point compatible with its current consumers:
    - in the Private Category matching its Role within the single Fragment or Root Fragment whose direct-child Logical Nodes exclusively consume it, even when imported by multiple Fragment Nodes or Root Nodes of that domain or by its Sub-Graph Nodes;
    - in the Fractal Branch of the lowest common ancestor Logical Domain of all its consumers whenever consumers are not confined to the direct-child Logical Nodes of a single Fragment or Root Fragment (e.g., consumers across distinct subtrees, between a Fragment and its Sub-Fragment, or Category Nodes).
  - **Domain semantic relevance**: A unit modeling a primary partition or foundational concept of the application domain resides where its architectural role is immediately legible — as a Root Fragment at the root of the Fractal Tree or in the Organizational Logical Domain expressing its architectural responsibility (e.g., a Layer or Category of the relevant Root Layer or Fractal Branch) — even if it has a single consumer. Potential technical reusability does not constitute domain semantic relevance.
- **Depth Control**: _It is recommended_ to govern Fractal Tree depth through two dual mechanisms according to a strict priority order:
  - **Vertical encapsulation** (`Private Categories`, `Fractal Branches`): removes a unit from external visibility by confining it to its governing domain's subtree. _It is recommended_ to adopt vertical encapsulation as the default choice whenever a unit is an internal detail not intended for exposure outside its consumers' perimeter.
  - **Horizontal ordering** (`Horizontal Hierarchies` among Logical Domains — Sub-Categories, Categories, Sub-Layers, or Layers — or among Root Nodes): keeps partitions or nodes at the same depth while preserving visibility within the containing domain and enforcing unidirectional dependencies without extra nesting. Because it widens visibility compared to encapsulation, _it is recommended_ not to adopt such Horizontal Hierarchies as the first choice, using them exclusively when at least one of two needs holds:
    - **External exposure of dependencies**: keeping units visible outside their consumers' boundary when other units depend on them, where encapsulating them inside those consumers' Private Categories or Fractal Branches would withhold them from external visibility;
    - **Semantic prominence**: surfacing the parts of the software with highest semantic relevance — a goal that likewise justifies Root Fragments at the root of the Fractal Tree — so the structure directly reflects the domain (_Screaming Architecture_) without nesting obscuring foundational parts of the system.
  - _It is recommended_ not to place or promote a unit into the Fractal Branch of a domain higher than that determined by its actual consumers to bypass Peer Separation between sibling units: if the unit is an internal detail consumed by a single sibling Fragment without need for external exposure, _it is recommended_ to encapsulate it in that Fragment's Private Category; if instead one of two Fragments or two Category Nodes must depend on the other while both remain exposed by their containing domain, _it is recommended_ to partition them into Sub-Categories ordered by a Horizontal Hierarchy.
- **Iterative and Recursive Evolution**: Architecture converges iteratively over time and recursively across scale. At every level of the Fractal Tree, _it is recommended_ to adapt structure by selecting the transformation with greatest conceptual economy among three operations:
  - **Extraction**: Separating autonomous Symbols into distinct Logical Nodes (additional Fragment Nodes with distinct Roles, or Category Nodes in a Private Category), or turning a Fragment Node into a Sub-Fragment in a Private Category when the extracted responsibility acquires collaborating details with distinct Roles or requires a dedicated Sub-Graph Node (confining the unit within the parent Logical Domain's subtree).
  - **Promotion**: Moving a unit into a Category (optionally inside a Layer) of a Fractal Branch that widens its authorized consumers (e.g., from a Fragment's Private Category to its Fractal Branch, or from a Logical Domain's Fractal Branch to an ancestor's Fractal Branch). Promotion occurs upon the actual appearance of consumers outside the current perimeter, targets the Fractal Branch of the lowest common ancestor Logical Domain of all actual consumers, and requires dependencies permitted by applicable visibility rules and Horizontal Hierarchies.
  - **Contraction**: Removing or reabsorbing Layers, Sub-Layers, Sub-Categories, Fractal Branches, or Sub-Fragments that have become redundant or disproportionate to actual sub-problem complexity (including collapsing a Fractal Branch or Root Layer from Layer stratification to direct Category exposure).
  - As long as the contract exposed by a Fragment's Access Node remains unchanged, transformations confined to that Fragment's subtree remain transparent to external consumers.
- **External Local Dependency Isolation**: During incremental FAF adoption or alongside generated local code outside Fractal Trees, _it is recommended_ that outgoing authorizations to external local codebase files not result in widespread coupling across internal Logical Nodes; _it is recommended_ to confine authorized imports of external local codebase modules to dedicated adapter units inside the Fractal Tree (Fragments or Category Nodes placed in the Category and optional Layer matching the external dependency's responsibility), encapsulating them behind a FAF-conformant contract with a Role governed by internal Horizontal Hierarchies.

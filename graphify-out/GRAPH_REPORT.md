# Graph Report - .  (2026-11-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 129 nodes · 235 edges · 13 communities (7 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12

## God Nodes (most connected - your core abstractions)
1. `switchTab()` - 11 edges
2. `OptiTrackCacheService` - 11 edges
3. `Sanitizer` - 10 edges
4. `initializeDemoData()` - 9 edges
5. `Formatters` - 9 edges
6. `openNewOrderModal()` - 8 edges
7. `OpticalOrderService` - 8 edges
8. `OpticalTransposer` - 7 edges
9. `renderPrescriptions()` - 7 edges
10. `attachPrescriptionsEvents()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `renderDashboard()` --references--> `Formatters`  [EXTRACTED]
  src/main.js → src/utils/formatters.js
- `renderPrescriptions()` --references--> `Formatters`  [EXTRACTED]
  src/main.js → src/utils/formatters.js
- `renderPrescriptions()` --references--> `Sanitizer`  [EXTRACTED]
  src/main.js → src/utils/sanitizer.js
- `attachTransposerEvents()` --references--> `Formatters`  [EXTRACTED]
  src/main.js → src/utils/formatters.js
- `renderLensometerQC()` --references--> `Formatters`  [EXTRACTED]
  src/main.js → src/utils/formatters.js

## Import Cycles
- None detected.

## Communities (13 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (46): badDnp, badgeReady, badgeWorkshop, cachedOrders, chaosLens, chaosTrans, csvOutput, e2eDelivered (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.26
Nodes (6): initializeDemoData(), getStorageItem(), memoryStore, OptiTrackCacheService, removeStorageItem(), setStorageItem()

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (11): author, description, license, name, scripts, security:full, test, test:security (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.39
Nodes (7): attachDashboardEvents(), attachTransposerEvents(), renderCatalog(), renderDashboard(), renderTransposerTool(), switchTab(), Sanitizer

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (5): attachPrescriptionsEvents(), initApp(), openNewOrderModal(), renderLensometerQC(), renderPrescriptions()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (3): LENS_MATERIALS, LENS_TREATMENTS, MaterialsCatalog

### Community 9 - "Community 9"
Cohesion: 0.50
Nodes (3): attachSettlementEvents(), renderSettlement(), Formatters

## Knowledge Gaps
- **58 isolated node(s):** `name`, `version`, `description`, `type`, `test` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OptiTrackCacheService` connect `Community 1` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `OpticalOrderService` connect `Community 11` to `Community 0`, `Community 3`, `Community 5`, `Community 6`, `Community 8`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MaterialsCatalog` connect `Community 7` to `Community 0`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
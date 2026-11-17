# Graph Report - c:\Users\Regondi Calidad\Desktop\QM\OptiTrack  (2026-11-17)

## Corpus Check
- Corpus is ~15,147 words - fits in a single context window. You may not need a graph.

## Summary
- 164 nodes · 307 edges · 12 communities (9 shown, 3 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `setupModalListeners()` - 15 edges
2. `OptiTrackCacheService` - 13 edges
3. `Sanitizer` - 13 edges
4. `initializeDemoData()` - 12 edges
5. `renderPrescriptions()` - 12 edges
6. `switchTab()` - 12 edges
7. `Formatters` - 10 edges
8. `renderDashboard()` - 9 edges
9. `attachPrescriptionsEvents()` - 9 edges
10. `attachTransposerEvents()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `attachTransposerEvents()` --references--> `Formatters`  [EXTRACTED]
  src/main.js → src/utils/formatters.js
- `attachTransposerEvents()` --references--> `Sanitizer`  [EXTRACTED]
  src/main.js → src/utils/sanitizer.js
- `renderStatusBadge()` --references--> `Formatters`  [EXTRACTED]
  src/main.js → src/utils/formatters.js
- `renderStatusBadge()` --references--> `Sanitizer`  [EXTRACTED]
  src/main.js → src/utils/sanitizer.js
- `showModalError()` --references--> `Sanitizer`  [EXTRACTED]
  src/main.js → src/utils/sanitizer.js

## Import Cycles
- None detected.

## Communities (12 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (49): badDnp, badgeReady, badgeWorkshop, cachedOrders, chaosLens, chaosTrans, corruptedOrders, csvOutput (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.20
Nodes (27): attachDashboardEvents(), attachDemoPurgeListener(), attachPrescriptionsEvents(), attachSettlementEvents(), initApp(), loadAppVersion(), openDeliveryModal(), openLensometerModal() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (10): LensometerQualitySentinel, OpticalTransposer, attachTransposerEvents(), closeAllModals(), closeModalElement(), generatePatientId(), parseNumericInput(), setupModalListeners() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (7): initializeDemoData(), getStorageItem(), memoryStore, OptiTrackCacheService, removeStorageItem(), safeParseJSON(), setStorageItem()

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (11): author, description, license, name, scripts, security:full, test, test:security (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, scope, short_name, start_url (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (3): LENS_MATERIALS, LENS_TREATMENTS, MaterialsCatalog

## Knowledge Gaps
- **72 isolated node(s):** `name`, `short_name`, `description`, `start_url`, `scope` (+67 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OptiTrackCacheService` connect `Community 3` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `Sanitizer` connect `Community 1` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `OpticalOrderService` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _72 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
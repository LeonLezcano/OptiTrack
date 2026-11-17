# OptiTrack — Design System & Visual Direction

## 1. Product Mode & Industry Scene
- **Mode:** Operate (high-precision clinical & workshop operational dashboard for optical chains, contactology labs, and ophthalmic edging benches).
- **Competitive Benchmarking:** Informed by clinical optical instrumentation interfaces (Zeiss i.Com, Essilor Visioffice, Ocuco Acuitas): low-glare dark instrumental bench surfaces so dioptric signs (`+` / `-`), axes (`0°`–`180°`), DNP measurements (`mm`), and ISO 8980-1 lensometry tolerances remain effortless to scan under workshop and dispensary lighting, paired with high-contrast black-on-white `@media print` stylesheets for physical workshop envelopes and prescriptions.
- **Dial:** `Dial: ENERGY 4 / RHYTHM 3 / MOTION 2`
  - **Energy (4/10):** Calm, disciplined, high-signal UI without decorative glows, gradients, or neon clutter.
  - **Rhythm (3/10):** Structured operational cadence: compact KPI strip, flat divider-separated cards, and dense tabular prescription ledgers.
  - **Motion (2/10):** Fast state transitions only on interactive controls; zero endless pulse/bounce loops; full `@media (prefers-reduced-motion: reduce)` support.

---

## 2. Color Tokens (Single Dark Bench Theme + Print Override)
Single dark theme is intentional for glare reduction at optical dispensing counters and lensometry benches (no runtime light/dark toggle shipped; print stylesheets override all surfaces to pure white `#ffffff` with `#0f172a` ink).

### Neutral Surfaces & Borders
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#0b0f17` | Main application canvas |
| `--bg-header` | `#0e131d` | Top navigation bar & table headers |
| `--bg-surface` | `#121722` | Primary cards, tables, and modal dialogs |
| `--border-subtle` | `#1e2638` | Structural hairline dividers & card borders |
| `--border-strong` | `#334155` | Interactive input & secondary button borders |

### Typography Colors (WCAG AA Verified >= 4.5:1)
| Token | Hex | Contrast on `#121722` | Usage |
| :--- | :--- | :--- | :--- |
| `--text-primary` | `#f8fafc` | ~16.8:1 | Headings, patient names, primary values |
| `--text-secondary` | `#cbd5e1` | ~11.6:1 | Body copy, table cells, form labels |
| `--text-muted` | `#94a3b8` | ~6.8:1 | Captions, metadata, helper descriptions (never `#64748b` slate-500 on dark surfaces) |

### Brand & Semantic Accents (Max 2 Core + 1 Accent + Semantic)
| Role | Hex | Usage |
| :--- | :--- | :--- |
| Primary Action (Optical Cobalt) | `#2563eb` (hover `#3b82f6`, text `#60a5fa`) | Primary CTAs, active navigation tab, order IDs |
| Precision Accent (Lensometer Cyan) | `#0891b2` (text `#22d3ee`) | OD/OI optical axes, lensometer QC triggers |
| Success (ISO Approved) | `#059669` (text `#34d399`) | Passed ISO 8980-1 QC, ready for pickup, delivery ePOD |
| Warning / Balance Due | `#d97706` (text `#fbbf24`) | Pending customer balance, `[DEMO]` indicator |
| Error / Out-of-Tolerance | `#e11d48` (text `#fb7185`) | Validation errors, ISO 8980-1 deviation alerts |

---

## 3. Typography Scale & Hierarchy
- **UI Sans Stack (Offline-First, Zero Overused AI Fonts):** `"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`
- **Data / Measurement Monospace Stack:** `ui-monospace, "Cascadia Mono", "SFMono-Regular", Consolas, monospace` with `font-variant-numeric: tabular-nums` for diopters, axes, DNP, currency, and SHA-256 seals.
- **Strict Descending Scale (`h1 > h2 > h3 > body`):**
  - `h1` (Brand Title): `1.75rem` (28px), weight `800`, line-height `1.2`, tracking `-0.025em`
  - `h2` (View Heading): `1.35rem` (21.6px), weight `700`, line-height `1.25`, tracking `-0.02em`
  - `h3` (Section / Modal Heading): `1.0625rem` (17px), weight `600`, line-height `1.3`
  - `h4` (Card Item Title): `0.9375rem` (15px), weight `600`, line-height `1.35`
  - `body`: `0.875rem` (14px), weight `400`, line-height `1.5`
  - `label / table header / metadata`: `0.75rem` (12px) minimum (`11px` only for compact badge codes; never `< 11px` for critical labels)

---

## 4. Layout, Spacing & Accessibility Rules
1. **Flat Card Architecture:** Never nest bordered rounded boxes inside cards. Separate internal sections (OD/OI grid, transposition, pricing, actions) using `border-t border-slate-800 pt-3` dividers.
2. **Zero AI-Slop Effects:** No `backdrop-blur` spam, no colored `shadow-*-*/30` halos, no `border-l-4` side-tabs, no decorative emojis in UI chrome (use crisp uniform-stroke inline `<svg aria-hidden="true">` icons).
3. **Touch Targets & Mobile Reflow:** Every interactive button, tab, and modal close control enforces `min-h-[44px]` (`min-w-[44px]` for icon buttons). Grids collapse cleanly to 1 column on mobile (`grid-cols-1 sm:grid-cols-2`, `grid-cols-1 sm:grid-cols-3`, `grid-cols-2 sm:grid-cols-4`). Viewport permits pinch-zoom (`width=device-width, initial-scale=1.0`).
4. **Keyboard & Screen Readers:** High-contrast `:focus-visible` ring (`2px solid #38bdf8`), `role="tablist"` / `role="tab"` / `aria-selected`, `role="dialog"` / `aria-modal="true"`, `Escape` and backdrop dismissal on modals, explicit `<label for="...">` on every input.
5. **Radical Truth & Demo Isolation:** Seeded demo orders carry explicit `[DEMO]` labels and can be purged via an in-UI control wired to `OptiTrackCacheService.purgeData()`. All form fields use `placeholder=` without pre-filled fake values.

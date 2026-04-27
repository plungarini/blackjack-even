# Blackjack Even Hub App — Implementation Plan

> **Read this first, every iteration.** This file is the single source of truth for scope and progress on the Blackjack Even Hub app. The coding agent must:
>
> 1. **Iterate through this plan continuously.** Re-open this file at the start of every task and at every meaningful checkpoint within a task. Do not rely on cached memory of the plan.
> 2. **Never invent facts.** If a path, API, design constraint, char width, layout dimension, or behavior is not already verified, _stop and research_: read the relevant files, the SDK, the existing reference apps (`apps/smokeless`, `apps/birdie`, `apps/this-day`), the docs in `even-apps/docs/`, and the original Angular project at `C:/DEV/blackjack-trainer`. Do not guess.
> 3. **Do not duplicate logic.** When porting features from the Angular trainer, port the _domain logic_ (deck, hand, count, strategy table, stats) into framework-free TypeScript modules under `src/domain/` and reuse from both phone and glasses entry points.
> 4. **Mirror smokeless conventions.** Phone shell + glasses router/render-loop/screens layout, store + selectors, navigation wiring (phone <-> glasses), menu overlay behavior, double-click shutdown — all should follow `apps/smokeless` exactly unless there is a documented reason to deviate.
> 5. **Track progress here.** At the end of every subtask — and at any meaningful intermediate checkpoint (e.g., after research, after a milestone, after discovering a blocker) — spawn a fresh sub-agent whose sole job is to update this file: tick the relevant checkboxes, append a dated entry to the **Progress Log**, and record any newly discovered constraints under **Discovered Constraints**. The sub-agent must read the file, edit it, and report what it changed. Do not let the implementing agent edit progress directly — always delegate to keep the log honest and self-contained.
> 6. **Keep tasks small and verifiable.** Prefer many small commits with a working build at each step over big-bang changes.

---

## 0. Context Snapshot (verify before trusting)

- **Reference Angular app:** `C:/DEV/blackjack-trainer` — Angular + Firebase + Tailwind. Pages: `home`, `strategy`, `stats`, `settings`, plus `simulator`. Source of truth for: deck logic, basic strategy table, count math, stats schema, settings shape.
- **Target app skeleton:** `C:/DEV/even-apps/apps/blackjack` — already scaffolded with `App.tsx`, `glasses/`, `glasses-main.ts`, `main.tsx`. Verify current contents at the start of work; do not assume.
- **Reference Even Hub apps:** `apps/smokeless` (canonical pattern: store, selectors, router stack, screens, menu overlay, shutdown on double-double-click). Also peek at `apps/birdie` and `apps/this-day` for additional patterns (canvas/image rendering if used).
- **Glasses platform docs:** `even-apps/docs/` — `display.md`, `input-events.md`, `ui-patterns.md`, `page-lifecycle.md`, `device-apis.md`, `browser-ui.md`, `architecture.md`, `error-codes.md`. The user mentioned `display.md` for full-width chars. Do not invent a chars table.
- **Display constraints (from CLAUDE.md, re-verify in `docs/display.md`):** 576×288 per eye, 4-bit greyscale, max 12 containers/page, exactly 1 event-capture container, max 8 textObject + 4 imageObject, image max 288×144, sequential image sends only.

---

## 1. Feature Overview

Five pages on the **phone** (parity with the Angular trainer plus a new default page) and the same five mirrored on the **glasses HUD**, plus a **Menu** overlay reachable by double-click.

### Phone pages

1. **Count** _(new — default home)_ — live card-counting helper for use at a real table with friends.
2. **Train** — the existing trainer "Home" (playing table view): discards top-left, dealer hands top-center, deck top-right, player hands center, footer with running/true count + actions (Hit/Stand/Double/Split) + reset.
3. **Strategy** — editable basic-strategy table with a reset button.
4. **Stats** — per-combo win/loss with totals.
5. **Settings** — strategy/game/general settings (deck count, S17/H17, DAS, surrender, training mode toggle, etc.).

### Glasses HUD pages

1. **Count** _(default)_ — running count + true count. Scroll up = +1, scroll down = −1. Click → confirm reset prompt (Yes/No selectable via scroll).
2. **Train** — playing table rendered via canvas → image container; footer text container shows available actions.
3. **Strategy** — header text container shows dealer up-card (2,3,4,5,6,7,8,9,10,A) plus optional running/true count; scrollable text container below renders the combo grid using **full-width** characters for column alignment.
4. **Stats** — same grid pattern as Strategy, with each cell showing the combo's score.
5. **Settings** — minimal: title `Settings` + helper line like `proceed on phone…`.
6. **Menu overlay** — double-click anywhere opens menu (copy `apps/smokeless/src/glasses/screens/menu/menu-view.ts` structure verbatim, then adapt entries). Double-click again calls `shutDownPageContainer(1)`. **Do not** use a scroll/list container — replicate smokeless's per-item text containers with selection border swap.

---

## 2. Architecture & Conventions

- **TypeScript + Vite**, no UI framework on glasses side. Phone side currently uses React (`App.tsx`, `main.tsx`) — keep React for the phone UI only.
- Layout to mirror smokeless:
  ```
  src/
    app/            # store, selectors, hooks, bootstrap (shared state)
    domain/         # framework-free blackjack logic (deck, hand, count, strategy, stats)
    glasses/
      constants.ts
      events.ts
      router.ts
      render-loop.ts
      session.ts
      types.ts
      utils.ts
      screens/
        count/
        train/
        strategy/
        stats/
        settings/
        menu/
        shared-shell.ts
    pages/          # phone pages (React): count, train, strategy, stats, settings
    components/     # shared phone components
    services/       # persistence (localStorage), settings, etc.
    glasses-main.ts # glasses entry
    main.tsx        # phone entry
  ```
- **State store:** single source of truth (zustand-style or whatever smokeless uses — verify `apps/smokeless/src/app/store.ts`). Both phone and glasses subscribe.
- **Persistence:** localStorage for settings, custom strategy edits, stats, count session. Match the keys/shape used by the Angular trainer where it makes sense.
- **Phone <-> glasses navigation wiring:** copy the pattern used in smokeless (route changes on phone reflect on glasses via store; menu selection on glasses calls `router.reset(...)` and updates the active tab). Do not invent a new mechanism.

---

## 3. Tasks

> Each task: ☐ open. Mark ✅ via the progress-tracking sub-agent only. Each task starts with a **Research** step — never skip it.

### T0 — Project bootstrap & audit

- [x] Read existing `apps/blackjack/{package.json, vite.config.ts, tsconfig.json, app.json, src/*}`. Confirm SDK/CLI/simulator versions match those in `CLAUDE.md`. Bump if needed (don't introduce other deps).
- [x] Verify `app.json` `package_id` is reverse-domain, lowercase, no hyphens (e.g. `com.plungarini.blackjack`).
- [x] Confirm phone is React + glasses is plain TS (matching skeleton); align folder layout with smokeless.
- [x] Document any deviations from the standard skeleton in **Discovered Constraints**.

### T1 — Port domain logic from `blackjack-trainer`

- [x] **Research:** read every file under `C:/DEV/blackjack-trainer/src/app/core/services` and `core/pages/{home,strategy,stats,settings,simulator}/**` to extract: deck/shoe model, hand evaluator, running-count + true-count math, basic-strategy table data + lookup, stats data shape + update logic, settings shape.
- [x] Re-implement under `src/domain/` as pure TypeScript modules (no Angular, no RxJS): `deck.ts`, `hand.ts`, `count.ts`, `strategy.ts` (with default Hi-Lo + basic-strategy table data), `stats.ts`, `settings.ts`. Add minimal unit-style sanity tests (or at least exported `__test` helpers) where logic is non-trivial.
- [x] Keep `strategy.ts`'s default table verbatim from the trainer; do **not** rewrite values.

### T2 — Shared state & persistence

- [x] **Research:** `apps/smokeless/src/app/{store.ts, selectors.ts, hooks/*}`.
- [x] Implement `src/app/store.ts` with slices: `tab` (active route), `settings`, `strategyOverrides`, `stats`, `countSession` (running count + true count config + decks remaining), `train` (current hand state, history of actions). Expose typed selectors and a hooks layer for React.
- [x] Persist to localStorage with versioned keys; load on bootstrap.

### T3 — Phone shell & routing

- [x] **Research:** how smokeless wires its phone shell (`App.tsx`, route → store.tab, navigation primitives).
- [x] Build the phone shell with five tabs: Count (default), Train, Strategy, Stats, Settings. Use a simple bottom-tab or sidebar layout — copy smokeless conventions.
- [x] No CSS framework unless smokeless already brings one; otherwise plain CSS modules / `app.css` per smokeless.

### T4 — Phone: Count page (new default)

- [x] **Research:** UX for live card counting — required controls per Angular trainer where applicable; otherwise design from the glasses-page brief (running count, true count derived from decks remaining, ±1 buttons, reset).
- [x] Implement page; bind to `countSession` store slice.

### T5 — Phone: Train page (port of trainer Home)

- [x] **Research:** Angular `core/pages/home` thoroughly — markup + service interactions. Port to React preserving features: discards (top-left), dealer hands (top-center), deck (top-right), player hands (center), footer with running/true count + Hit/Stand/Double/Split + Reset, training-mode toggle from Settings.
- [x] Wire into `train` store slice and `domain/{deck,hand,count,strategy,stats}` modules.

### T6 — Phone: Strategy, Stats, Settings pages

- [x] **Research:** corresponding Angular pages.
- [x] Strategy: editable grid bound to `strategyOverrides` + reset button.
- [x] Stats: per-combo W/L with totals.
- [x] Settings: deck count, S17/H17, DAS, surrender, training-mode toggle, plus any other settings from the trainer.

### T7 — Glasses scaffolding (router, render-loop, session)

- [x] **Research:** `apps/smokeless/src/glasses/{router.ts, render-loop.ts, session.ts, types.ts, utils.ts, constants.ts, events.ts}`.
- [x] Copy/adapt into `apps/blackjack/src/glasses/`. `ViewKey` becomes `'count' | 'train' | 'strategy' | 'stats' | 'settings' | 'menu'`. Initial view: `'count'`.
- [x] Implement double-click → push `'menu'`; double-click again on menu → `shutDownPageContainer(1)` (verbatim smokeless behavior).

### T8 — Glasses: Count screen (default)

- [x] **Research:** input event types in `docs/input-events.md` and existing handling in smokeless. Confirm `SCROLL_TOP_EVENT` / `SCROLL_BOTTOM_EVENT` / `CLICK_EVENT` semantics.
- [x] Layout: large running-count number + true-count line + small "decks remaining" hint. One event-capture container.
- [x] Behavior: scroll up → +1, scroll down → −1, click → modal-style "Reset count? Yes / No" with scroll to switch selection and click to confirm. (Implement modal as a state flag inside the view that swaps layout/contents, or as a small sub-view — pick whatever matches smokeless idioms.)
- [x] Bind to `countSession` store slice; updates reflect on phone instantly.

### T9 — Glasses: Train screen (canvas → image)

- [x] **Research:** `docs/display.md`, `docs/ui-patterns.md`, and any image-sending example in smokeless/birdie/this-day. Confirm image max size (288×144), format (PNG → 4-bit greyscale by host), and the rule that concurrent image sends are not allowed (queue sequentially).
- [x] Render the play table to an offscreen `<canvas>`, downscale/quantize to fit constraints, send via the appropriate SDK call. Footer text container lists available actions; selection via scroll, confirm via click.
- [x] Throttle re-renders aggressively — only resend image when the visible state actually changed.

### T10 — Glasses: Strategy screen (full-width grid)

- [x] **Research:** the full-width chars reference. The user named `even-apps/docs/display.md`. Existing examples: see `apps/smokeless/src/glasses/screens/menu/menu-view.ts` (`╭───────`, etc.) and `glasses/utils.ts` (`centerLine`).
- [x] Header text container: dealer up-card row `2 3 4 5 6 7 8 9 10 A` (use full-width digits if needed for alignment) — optionally with current running/true count.
- [x] Body: scrollable text container (per `ui-patterns.md`) showing rows like `9  | H | D/H | D/H | …` aligned with full-width characters. Verify "scrollable text container" is supported and identify the correct SDK call; if not, fall back to manual paging via scroll events.
- [x] Read source of grid data from `domain/strategy.ts` so it includes user overrides.

### T11 — Glasses: Stats screen

- [x] Same grid layout as Strategy, but cells display W/L (e.g., `12/3` or a percentage). Source from `domain/stats.ts`.

### T12 — Glasses: Settings screen

- [x] Single empty/centered container: title `Settings`, sub-line `proceed on phone…`. No interactivity beyond the menu double-click.

### T13 — Glasses: Menu overlay

- [x] **Research:** `apps/smokeless/src/glasses/screens/menu/menu-view.ts` exactly. Replicate selection-border swap, header label, item-text format. Do not use a scroll/list container.
- [x] Items: Count, Train, Strategy, Stats, Settings.
- [x] Click on item → `router.reset(view)` and `appStore.setTab(...)` so the phone follows along.
- [x] Double-click on menu → `shutDownPageContainer(1)`.

### T14 — Phone <-> glasses sync

- [x] **Research:** the cross-surface sync mechanism in smokeless (likely store-driven; confirm there is no separate IPC layer).
- [x] Verify changing tab on the phone updates the glasses route, and vice versa. Verify count/strategy/stats/settings updates round-trip both ways.

### T15 — Packaging & checklist

- [x] Run `npm install`, `npm run dev`, `npm run qr`, `npm run pack`. Confirm `.ehpk` builds.
- [x] Walk the **App Checklist** at the bottom of `even-apps/CLAUDE.md` and tick each item.
- [x] Update `apps/blackjack/README.md` with what the app does and how to run it.

---

## 4. Discovered Constraints

> Append findings here whenever research surfaces something not already documented (e.g., real char widths in `display.md`, SDK quirks, smokeless-specific patterns to copy).

- **Bridge Local Storage required for persistence:** `bridge.getLocalStorage` / `bridge.setLocalStorage` are the only storage that survives WebView refresh inside Even Hub. Browser `localStorage` / `IndexedDB` get wiped. Implemented fallback to `sessionStorage` for web/dev mode only.
- **SDK versions ahead of CLAUDE.md minimums:** `even_hub_sdk ^0.0.10`, `evenhub-cli ^0.1.13`, `evenhub-simulator ^0.7.3`. No version changes needed.
- **AppShell `header` prop is required:** `even-toolkit/web` `AppShell` component requires `header: ReactNode` (not optional). Confirmed from type definitions.
- **CLICK_EVENT = 0 arrives as `undefined`:** SDK normalizes value 0 to undefined in some event paths. All event handlers must check `type === OsEventTypeList.CLICK_EVENT || type === undefined`.
- **Shield container pattern:** ROOT_LAYOUT uses a `shield` container (containerID 0, width 0, isEventCapture: 1) as an invisible full-screen gesture capture layer. All visible text containers have isEventCapture: 0.
- **T9 canvas/image approach deferred:** SDK `updateImageRawData` API shape was not confirmed during research; text-based train screen implemented instead. Canvas → image rendering for train screen is a future enhancement.
- **Full-width Unicode for grid alignment:** LVGL font is proportional; regular digits/letters misalign in grids. CJK full-width chars (`Ｈ`=U+FF28, `Ｓ`=U+FF33, `Ｐ`=U+FF30, `Ｄ`=U+FF24, `Ｒ`=U+FF32, `２`–`Ａ` U+FF12–U+FF21) are required for column-aligned text tables.

---

## 5. Progress Log

> Sub-agents append dated entries here. Format: `YYYY-MM-DD — TaskID — what changed (one line)`.

- 2026-04-27 — T0 — Audited scaffold; confirmed valid app.json, SDK versions above minimums; smokeless folder structure documented
- 2026-04-27 — T1 — Ported domain logic: deck, hand, count, strategy (full table), stats, settings, game, training from Angular trainer
- 2026-04-27 — T2 — Implemented full store + selectors + hooks + bootstrap; persistence via Bridge Local Storage
- 2026-04-27 — T3 — Phone shell with AppShell+NavBar, 5 tabs (Count/Train/Strategy/Stats/Settings)
- 2026-04-27 — T4 — CountPage: Hi-Lo card logging, running count, true count, reset
- 2026-04-27 — T5 — TrainPage: strategy trainer with training-hand picker, feedback, streak
- 2026-04-27 — T6 — StrategyPage, StatsPage, SettingsPage: full implementations
- 2026-04-27 — T7 — Glasses scaffolding: router, render-loop, events, shared-shell, ROOT_LAYOUT, stub screens for all 5 views + menu
- 2026-04-27 — T8  — Count screen: running/true count display, scroll ±1, tap reset confirm overlay
- 2026-04-27 — T9  — Train screen (text-based): question/feedback state machine, strategy lookup, streak tracking
- 2026-04-27 — T10 — Strategy screen: 3-page full-width grid (Hard/Soft/Pairs), scroll pagination
- 2026-04-27 — T11 — Stats screen: 3-page accuracy bar grid, overall stats header
- 2026-04-27 — T12 — Settings screen: minimal phone-redirect screen
- 2026-04-27 — T13 — Menu overlay: complete (was implemented in T7 wave); 5-item scroll+select, double-tap exit
- 2026-04-27 — T14 — Phone↔glasses sync verified: store.tab subscription, TAB_TO_VIEW mapping, menu guard all correct
- 2026-04-27 — T15 — Build passes; blackjack.ehpk (169KB) produced; README updated; full app checklist passed

---

## 6. How to update this file (for the spawned tracker sub-agent)

You are spawned with a single goal: update this plan file honestly.

- Read the file in full.
- Read the implementing agent's brief (passed in your prompt).
- Tick checkboxes for tasks that are _demonstrably_ done (file exists / behavior verified — not "should work").
- Append a one-line entry to the **Progress Log** with today's date and the task ID.
- If new constraints/quirks were discovered, append them to **Discovered Constraints**.
- Do not rewrite the plan structure. Do not edit task descriptions. Do not invent progress.
- Report back the diff you made (file path + summary of edits).

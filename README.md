# Blackjack

Even Realities G2 glasses app.

## Architecture

Two layers run side-by-side in the same Vite bundle:

- **Web UI** (`src/App.tsx`) — built with [even-toolkit](https://www.npmjs.com/package/even-toolkit) (`even-toolkit/web`). Renders inside the iPhone WebView.
- **Glasses HUD** (`src/glasses-main.ts` + `src/glasses/*`) — pure TypeScript using the **official `@evenrealities/even_hub_sdk`** directly. No framework, no toolkit. Side-effect-imported from `main.tsx`.

## Structure

```
src/
  main.tsx              — React entry; side-effect-imports glasses-main
  App.tsx               — Web UI (even-toolkit/web)
  app.css               — Tailwind + even-toolkit theme imports
  glasses-main.ts       — HUD bootstrap (bridge + event loop)
  glasses/
    types.ts            — Layout + view state types
    utils.ts            — Text alignment helpers (centerLine, alignRow, alignThree)
    view.ts             — Layout descriptor + render state builder
    session.ts          — Bridge wrapper (page create / rebuild / upgrade)
```

## Gestures

- **Single click** — refresh / advance (current scaffold just touches the clock)
- **Double click** — `bridge.shutDownPageContainer(1)` exits the HUD

## Dev

```bash
npm run dev      # vite dev server at 0.0.0.0:5173
npm run qr       # QR code to load on your phone
npm run emulator # browser-based G2 simulator
npm run build    # production build
npm run pack     # build + package as .ehpk for Even Hub
```
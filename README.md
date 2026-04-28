# Blackjack

Even Realities G2 smart glasses app — Hi-Lo card counting assistant and basic strategy trainer.

## What it does

Five screens accessible from both the phone and glasses:

- **Count** (default): Live Hi-Lo card counting. Scroll up = +1, scroll down = −1. Running count and true count displayed on glasses; full card-logging interface on phone.
- **Train**: Basic strategy trainer. Shows a blackjack scenario; you pick the correct action. Tracks accuracy per combo; focuses training on your weakest spots.
- **Strategy**: Full basic strategy table (Hard/Soft/Pairs). Read-only reference on glasses; color-coded grid on phone.
- **Stats**: Per-combo accuracy stats. Shows your overall accuracy and weakest spots.
- **Settings**: Deck count, S17/H17, DAS, surrender, training mode, and threshold.

## Architecture

Two layers run side-by-side in the same Vite bundle:

- **Web UI** (`src/pages/*.tsx`) — React + even-toolkit, renders inside the iPhone WebView
- **Glasses HUD** (`src/glasses/`) — plain TypeScript + Even Hub SDK, sends text containers to the G2 display

Shared state via `src/app/store.ts` (custom pub/sub store). Persistence via Even Hub Bridge Local Storage.

## Dev

```bash
npm install
npm run dev      # Vite dev server at 0.0.0.0:5173
npm run qr       # QR code to load on your phone
npm run emulator # Browser-based G2 simulator
npm run build    # Production build
npm run pack     # Build + package as .ehpk
```

## Glasses gestures

| Gesture | Action |
|---|---|
| Scroll up | Count +1 (Count screen) / cycle action up (Train) / prev page (Strategy/Stats) |
| Scroll down | Count −1 (Count screen) / cycle action down (Train) / next page (Strategy/Stats) |
| Single tap | Submit action (Train) / confirm reset (Count) |
| Double tap | Open menu overlay (from any screen) |
| Double tap on menu | Exit app |

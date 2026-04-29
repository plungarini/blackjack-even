# Blackjack

> **See the count. Know the play. Own the table.**

A professional-grade Blackjack strategy trainer and Hi-Lo card-counting assistant built for the Even Realities smart glasses. It puts real-time odds, perfect-strategy feedback, and live count data directly in your heads-up display — so you can train anywhere without ever looking down at your phone.

---

## What it does

Blackjack turns your G2 glasses into a discreet blackjack computer. Whether you're at a table, on a commute, or practicing at home, the app keeps a live running count, calculates the true count, suggests bet sizing, and drills you on perfect basic strategy — all rendered instantly on a 576 × 288 px glasses HUD. A full companion interface on the iPhone lets you log cards, review heat-maps, and tweak rules.

---

## Key Features

- **Live Hi-Lo Count** — Running count, true count, decks remaining, and Kelly-style unit suggestions updated in real time. Log cards with a single scroll or tap.
- **Basic Strategy Trainer** — Deals realistic hands against a configurable dealer. Choose Hit, Stand, Double, or Split and get instant correct/wrong feedback.
- **Weak-Spot Targeting** — Training mode automatically prioritizes the hand combos you get wrong most often (configurable accuracy threshold).
- **Full Strategy Table** — Read-only reference for Hard totals, Soft hands, and Pairs. Color-coded grid on the phone; clean text layout on glasses.
- **Per-Combo Statistics** — Tracks accuracy for every player-hand vs dealer-upcard combination so you can see exactly where to improve.
- **Configurable Rules** — Deck count (1–8), S17/H17, Double-After-Split, Surrender, and training thresholds.
- **Dual-Screen Architecture** — Rich React UI on the iPhone; lightweight, low-latency text HUD on the G2 glasses. State stays perfectly in sync.
- **Persistent Progress** — Settings and training stats survive app restarts via Even Hub Bridge Local Storage.

---

## How it works / User flow

1. **Launch** the app from the Even Hub. The glasses default to the **Count** screen.
2. **At the table (or practicing)** — scroll up on the glasses when a low card (2–6) is dealt, scroll down for a high card (T–A), or tap for neutral. The running count, true count, and suggested bet size update instantly on the HUD.
3. **Switch to Train** — either via the phone bottom-nav or by double-tapping the glasses to open the menu, scrolling to _Train_, and tapping to select.
4. **Train mode** deals a random hand. Scroll to cycle through actions, tap to submit. The glasses show "Correct!" or "Wrong!" with the optimal play immediately.
5. **Review Stats & Strategy** on the phone to see your accuracy heat-map, or on the glasses for a quick reference table.
6. **All settings** (deck count, house rules, training difficulty) persist across sessions.

### Glasses Gestures

| Gesture           | Action                                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| Scroll up         | Count +1 (Count) / previous action (Train) / previous page (Strategy/Stats) |
| Scroll down       | Count −1 (Count) / next action (Train) / next page (Strategy/Stats)         |
| Single tap        | Neutral card (Count) / submit action (Train) / confirm reset                |
| Double tap        | Open menu overlay                                                           |
| Double tap (menu) | Exit app                                                                    |

---

## Tech Stack

- **Frontend** — React 19, TypeScript, Tailwind CSS, Vite
- **Glasses HUD** — Plain TypeScript + Even Hub SDK (`@evenrealities/even_hub_sdk ^0.0.10`)
- **State Management** — Custom pub/sub store shared between Web UI and HUD
- **Persistence** — Even Hub Bridge Local Storage (mirrors to `sessionStorage` for emulator)
- **Build & Pack** — Vite + `evenhub-cli` for `.ehpk` packaging

---

## Getting Started

```bash
cd apps/blackjack
npm install
npm run dev        # Vite dev server at http://0.0.0.0:5173
npm run qr         # QR code to scan with your iPhone
npm run emulator   # Browser-based G2 simulator
npm run build      # Production build
npm run pack       # Build + package as blackjack.ehpk
```

> **Note:** `.ehpk` and `dist/` are git-ignored. Never commit build artifacts.

---

## Why it exists

Traditional card-counting apps force you to stare at a phone screen — conspicuous, slow, and impractical in a real casino environment. Blackjack for G2 solves that by moving the critical data (count, true count, bet suggestion, and strategy feedback) into a heads-up display that only you can see. It turns downtime into deliberate practice: five minutes on the train with the trainer can meaningfully sharpen your edge before you ever sit down at a table.

---

## Architecture at a glance

Two layers run side-by-side in the same Vite bundle:

- **Web UI** (`src/pages/*.tsx`) — React interface rendered inside the iPhone WebView.
- **Glasses HUD** (`src/glasses/`) — Standalone TypeScript views that send text containers to the G2 display via the Even Hub SDK.

Shared domain logic (`src/domain/`) and a custom store (`src/app/store.ts`) keep both interfaces perfectly synchronized.

# Rolling Home

A configurable, mobile-first tabletop gaming companion PWA. Started as a dice roller, grew into a platform for building and running custom tabletop game tools — dice, cards, coins, and Rummikub-style tiles, all configurable instead of fixed.

Built as a companion tool for [Quest Home](#quest-home), a 2-player cooperative card game, but works as a general-purpose toolkit for any tabletop game.

## Features

### Dice
- Dice types: d4, d6, d8, d10, d12, d20, d100
- Quantity selection per die type, roll them all at once
- Dice tray with individual rolls, subtotals per type, and grand total
- Dice tumble animation on roll
- Show/hide individual dice types in settings
- Shake to roll (optional)

### Cards & Decks
- Card picker for drawing from a deck
- Custom deck builder — define your own card sets
- Configurable deck presets, including joker support
- Multi-draw support

### Tiles & Coins
- Tile picker (Rummikub-style tile draws)
- Coin flipper

### Game Templates
- Build reusable game definitions with configurable turns and phases
- Run a saved template directly from the menu

### Save & Persistence
- Save/load system with named saves and state persistence
- Roll history and stats panel
- Hash-based routing between tools

### General
- Slide-out menu for navigating between tools
- Dark/light/system theme toggle
- Roll sound (8-bit style) and vibration feedback, toggleable in settings
- Responsive layout: mobile-first single column, desktop three-column dashboard
- PWA — installable, works offline

## Tech Stack

- React (TypeScript + JSX)
- Vite
- Web Audio API (8-bit sounds)
- Vibration API
- PWA (manifest + service worker)
- Hosted on Vercel

## Development

```bash
npm install
npm run dev
```

## Quest Home

Quest Home is a 2-player cooperative storytelling card game using a standard deck of cards. Draw 10 cards together and survive with health remaining. Red cards are challenges, black cards are resources, and dice rolls determine the specific scenarios you face.

Rolling Home was built to handle the dice rolling at the table so you can focus on the story.

## License

MIT

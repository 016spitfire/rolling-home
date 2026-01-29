# Rolling Home

A simple, mobile-first dice roller PWA. Select dice types, set quantities, roll them all at once.

Built as a companion tool for [Quest Home](#quest-home), a 2-player cooperative card game, but works as a general-purpose dice roller for any tabletop game.

## Features

- **Dice types:** d4, d6, d8, d10, d12, d20, d100
- **Quantity selection:** Roll multiple dice of each type
- **Clear results:** Individual rolls, subtotals per die type, and grand total
- **Clear button:** Reset dice pool quickly
- **Dark mode:** Light, dark, or system theme toggle
- **Shake to roll:** Enable in settings to roll by shaking your phone
- **Customizable dice:** Show/hide individual dice types in settings
- **Mobile-first:** Designed for use at the table on your phone
- **PWA:** Install it like an app, works offline

## Tech Stack

- React
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

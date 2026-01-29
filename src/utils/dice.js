export const DIE_VALUES = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export const DICE_ORDER = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(diceState) {
  const results = [];

  for (const die of DICE_ORDER) {
    const count = diceState[die];
    if (count > 0) {
      const sides = DIE_VALUES[die];
      const rolls = Array.from({ length: count }, () => rollDie(sides));
      const total = rolls.reduce((sum, r) => sum + r, 0);
      results.push({ die, rolls, total });
    }
  }

  return results;
}

export function createEmptyDiceState() {
  return {
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
  };
}

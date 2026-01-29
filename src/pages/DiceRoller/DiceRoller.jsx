import { useState, useCallback, useEffect } from "react";
import { DICE_ORDER, rollDice, createEmptyDiceState } from "../../utils/dice";
import { playRollSound, vibrate } from "../../utils/sound";
import "./DiceRoller.css";

const SHAKE_THRESHOLD = 25;
const SHAKE_COOLDOWN = 1000;

export function DiceRoller({ settings }) {
  const [dice, setDice] = useState(createEmptyDiceState);
  const [results, setResults] = useState([]);

  const hasAnyDice = Object.values(dice).some((count) => count > 0);

  const roll = useCallback(() => {
    if (!Object.values(dice).some((count) => count > 0)) return;

    if (settings.soundEnabled) {
      playRollSound();
    }

    if (settings.vibrateEnabled) {
      vibrate(50);
    }

    const newResults = rollDice(dice);
    setResults(newResults);
  }, [dice, settings.soundEnabled, settings.vibrateEnabled]);

  // Shake to roll effect
  useEffect(() => {
    if (!settings.shakeEnabled) return;

    let lastShake = 0;
    let lastX = 0, lastY = 0, lastZ = 0;
    let initialized = false;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      if (!initialized) {
        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
        initialized = true;
        return;
      }

      const deltaX = Math.abs(acc.x - lastX);
      const deltaY = Math.abs(acc.y - lastY);
      const deltaZ = Math.abs(acc.z - lastZ);

      const totalDelta = deltaX + deltaY + deltaZ;

      if (totalDelta > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShake > SHAKE_COOLDOWN) {
          lastShake = now;
          roll();
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [settings.shakeEnabled, roll]);

  const updateDie = (die, delta) => {
    setDice((prev) => ({
      ...prev,
      [die]: Math.max(0, prev[die] + delta),
    }));
  };

  const clearDice = () => {
    setDice(createEmptyDiceState());
    setResults([]);
  };

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);
  const visibleDice = DICE_ORDER.filter((die) => settings.visibleDice[die]);

  return (
    <div className="dice-roller">
      <div className="dice-selector">
        {visibleDice.map((die) => (
          <div key={die} className="die-row">
            <span className="die-label">{die}</span>
            <button
              className="die-btn"
              onClick={() => updateDie(die, -1)}
              disabled={dice[die] === 0}
            >
              −
            </button>
            <span className="die-count">{dice[die]}</span>
            <button className="die-btn" onClick={() => updateDie(die, 1)}>
              +
            </button>
          </div>
        ))}
      </div>

      <div className="action-buttons">
        <button className="roll-btn" onClick={roll} disabled={!hasAnyDice}>
          Roll
        </button>
        <button
          className="clear-btn"
          onClick={clearDice}
          disabled={!hasAnyDice}
        >
          Clear
        </button>
      </div>

      {results.length > 0 && (
        <div className="results">
          <h2>Results</h2>
          {results.map((result) => (
            <div key={result.die} className="result-row">
              <span className="result-die">{result.die}:</span>
              <span className="result-rolls">{result.rolls.join(", ")}</span>
              <span className="result-total">({result.total})</span>
            </div>
          ))}
          <div className="grand-total">Total: {grandTotal}</div>
        </div>
      )}
    </div>
  );
}

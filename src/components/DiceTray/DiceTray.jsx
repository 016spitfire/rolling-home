import { useState, useEffect } from "react";
import "./DiceTray.css";

const DIE_SHAPES = {
  d4: "polygon(50% 0%, 0% 100%, 100% 100%)",
  d6: "none",
  d8: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  d10: "polygon(50% 0%, 95% 40%, 80% 100%, 20% 100%, 5% 40%)",
  d12: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
  d20: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
  d100: "circle(50%)",
};

function DieShape({ die, value, rotation, settling }) {
  const clipPath = DIE_SHAPES[die];
  const isSquare = die === "d6";
  const currentRotation = settling ? 0 : rotation;

  return (
    <div
      className={`die-shape die-shape-${die}`}
      style={{ transform: `rotate(${currentRotation}deg)` }}
    >
      <div
        className="die-shape-bg"
        style={isSquare ? { borderRadius: "4px" } : { clipPath }}
      />
      <span
        className="die-shape-value"
        style={{ transform: `rotate(${-currentRotation}deg)` }}
      >
        {value}
      </span>
    </div>
  );
}

function getRotation() {
  return Math.floor(Math.random() * 37) - 18;
}

export function DiceTray({ results, history, rollId }) {
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    if (rollId > 0) {
      setSettling(true);
      const timer = setTimeout(() => setSettling(false), 150);
      return () => clearTimeout(timer);
    }
  }, [rollId]);

  const allDice = [];
  if (results.length > 0) {
    let index = 0;
    for (const result of results) {
      for (const roll of result.rolls) {
        allDice.push({
          die: result.die,
          value: roll,
          key: `${result.die}-${index}`,
          rotation: getRotation(index),
        });
        index++;
      }
    }
  }

  const totalRolls = history.reduce(
    (sum, entry) => sum + entry.results.reduce((s, r) => s + r.rolls.length, 0),
    0,
  );
  const allValues = history.flatMap((entry) =>
    entry.results.flatMap((r) => r.rolls),
  );
  const highest = allValues.length > 0 ? Math.max(...allValues) : null;
  const lowest = allValues.length > 0 ? Math.min(...allValues) : null;
  const average =
    allValues.length > 0
      ? (allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(1)
      : null;
  const highestTotal =
    history.length > 0 ? Math.max(...history.map((e) => e.total)) : null;

  return (
    <div className="dice-tray-panel">
      <div className="dice-tray">
        {allDice.length > 0 ? (
          <div className="dice-tray-area">
            {allDice.map((d) => (
              <DieShape
                key={d.key}
                die={d.die}
                value={d.value}
                rotation={d.rotation}
                settling={settling}
              />
            ))}
          </div>
        ) : (
          <div className="dice-tray-empty">No dice rolled yet.</div>
        )}
      </div>

      <div className="dice-stats">
        <div className="stats-header">Stats</div>
        {totalRolls > 0 ? (
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Rolls</span>
              <span className="stat-value">{totalRolls}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">{average}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Highest</span>
              <span className="stat-value">{highest}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lowest</span>
              <span className="stat-value">{lowest}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Best Total</span>
              <span className="stat-value">{highestTotal}</span>
            </div>
          </div>
        ) : (
          <div className="stats-empty">Roll some dice to track stats.</div>
        )}
      </div>
    </div>
  );
}

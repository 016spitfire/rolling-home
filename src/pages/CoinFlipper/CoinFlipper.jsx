import { useState, useCallback } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./CoinFlipper.css";

export function CoinFlipper({ settings, state, onStateChange, onReset }) {
  const { results, flipCount, history } = state;
  const [isFlipping, setIsFlipping] = useState(false);

  const flipCoins = useCallback(() => {
    if (isFlipping) return;

    if (settings.soundEnabled) {
      playRollSound();
    }
    if (settings.vibrateEnabled) {
      vibrate(50);
    }

    setIsFlipping(true);

    setTimeout(() => {
      const flips = [];
      for (let i = 0; i < flipCount; i++) {
        flips.push(Math.random() < 0.5 ? "heads" : "tails");
      }
      onStateChange({
        results: flips,
        history: [...flips, ...history].slice(0, 50),
      });
      setIsFlipping(false);
    }, 300);
  }, [isFlipping, flipCount, history, settings.soundEnabled, settings.vibrateEnabled, onStateChange]);

  const clearHistory = () => {
    onStateChange({
      history: [],
      results: [],
    });
  };

  const updateFlipCount = (delta) => {
    onStateChange({
      flipCount: Math.max(1, Math.min(10, flipCount + delta)),
    });
  };

  const headsCount = results.filter((r) => r === "heads").length;
  const tailsCount = results.filter((r) => r === "tails").length;
  const historyHeads = history.filter((r) => r === "heads").length;
  const historyTails = history.filter((r) => r === "tails").length;

  return (
    <div className="coin-flipper">
      <div className="coin-area">
        {results.length > 0 ? (
          <div className="coin-results">
            {results.map((result, i) => (
              <div key={i} className={"coin " + (isFlipping ? "coin-flipping" : "")}>
                <span className="coin-result">{result === "heads" ? "H" : "T"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={"coin " + (isFlipping ? "coin-flipping" : "")}>
            <span className="coin-placeholder">?</span>
          </div>
        )}
        {results.length > 0 && !isFlipping && (
          <div className="result-summary">
            {results.length === 1 ? (
              results[0].toUpperCase()
            ) : (
              <>Heads: {headsCount} | Tails: {tailsCount}</>
            )}
          </div>
        )}
      </div>

      <div className="flip-count-selector">
        <span className="flip-label">Flip</span>
        <button
          className="die-btn"
          onClick={() => updateFlipCount(-1)}
          disabled={flipCount <= 1}
        >
          −
        </button>
        <span className="flip-count">{flipCount}</span>
        <button
          className="die-btn"
          onClick={() => updateFlipCount(1)}
          disabled={flipCount >= 10}
        >
          +
        </button>
        <span className="flip-label">{flipCount === 1 ? "coin" : "coins"}</span>
      </div>

      <div className="coin-actions">
        <button className="roll-btn" onClick={flipCoins} disabled={isFlipping}>
          {isFlipping ? "Flipping..." : "Flip " + (flipCount === 1 ? "Coin" : flipCount + " Coins")}
        </button>
      </div>

      {history.length > 0 && (
        <div className="coin-history">
          <div className="history-header">
            <span>History ({history.length})</span>
            <span className="history-stats">H: {historyHeads} | T: {historyTails}</span>
          </div>
          <div className="history-items">
            {history.map((r, i) => (
              <span key={i} className={"history-item " + (r === "heads" ? "history-heads" : "history-tails")}>
                {r === "heads" ? "H" : "T"}
              </span>
            ))}
          </div>
          <button className="clear-btn" onClick={clearHistory}>
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}

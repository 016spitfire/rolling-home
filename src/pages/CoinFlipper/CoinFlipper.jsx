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
  }, [
    isFlipping,
    flipCount,
    history,
    settings.soundEnabled,
    settings.vibrateEnabled,
    onStateChange,
  ]);

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
  const headsPercent =
    history.length > 0 ? Math.round((historyHeads / history.length) * 100) : 0;
  const longestStreak =
    history.length > 0
      ? history.reduce(
          (acc, flip) => {
            if (flip === acc.current) {
              acc.run++;
            } else {
              acc.current = flip;
              acc.run = 1;
            }
            if (acc.run > acc.max) {
              acc.max = acc.run;
              acc.maxType = acc.current;
            }
            return acc;
          },
          { current: null, run: 0, max: 0, maxType: null },
        )
      : null;

  return (
    <div className="coin-flipper">
      <div className="coin-area">
        <div className="coin-display">
          {results.length > 0 ? (
            <div className="coin-results">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={"coin " + (isFlipping ? "coin-flipping" : "")}
                >
                  <span className="coin-result">
                    {result === "heads" ? "H" : "T"}
                  </span>
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
                <>
                  Heads: {headsCount} | Tails: {tailsCount}
                </>
              )}
            </div>
          )}
        </div>

        <div className="tool-stats">
          <div className="stats-header">Stats</div>
          {history.length > 0 ? (
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Flips</span>
                <span className="stat-value">{history.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Heads</span>
                <span className="stat-value">{historyHeads}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tails</span>
                <span className="stat-value">{historyTails}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Heads %</span>
                <span className="stat-value">{headsPercent}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Best Streak</span>
                <span className="stat-value">
                  {longestStreak.max}{" "}
                  {longestStreak.maxType === "heads" ? "H" : "T"}
                </span>
              </div>
            </div>
          ) : (
            <div className="stats-empty">Flip some coins to track stats.</div>
          )}
        </div>
      </div>

      <div className="coin-controls">
        <div className="count-selector">
          <span className="count-label">Flip</span>
          <button
            className="inc-btn"
            onClick={() => updateFlipCount(-1)}
            disabled={flipCount <= 1}
          >
            −
          </button>
          <span className="count-value">{flipCount}</span>
          <button
            className="inc-btn"
            onClick={() => updateFlipCount(1)}
            disabled={flipCount >= 10}
          >
            +
          </button>
          <span className="count-label">
            {flipCount === 1 ? "coin" : "coins"}
          </span>
        </div>

        <div className="coin-actions">
          <button
            className="action-btn"
            onClick={flipCoins}
            disabled={isFlipping}
          >
            {isFlipping
              ? "Flipping..."
              : "Flip " + (flipCount === 1 ? "Coin" : flipCount + " Coins")}
          </button>
        </div>
      </div>

      <div className="coin-history">
        <div className="history-header">
          <span>History{history.length > 0 ? ` (${history.length})` : ""}</span>
          {history.length > 0 && (
            <span className="history-stats">
              H: {historyHeads} | T: {historyTails}
            </span>
          )}
        </div>
        {history.length > 0 ? (
          <>
            <div className="history-items">
              {history.map((r, i) => (
                <span
                  key={i}
                  className={
                    "history-item " +
                    (r === "heads" ? "history-heads" : "history-tails")
                  }
                >
                  {r === "heads" ? "H" : "T"}
                </span>
              ))}
            </div>
            <button className="clear-btn" onClick={clearHistory}>
              Clear History
            </button>
          </>
        ) : (
          <div className="history-empty">
            Flip some coins to see your history here.
          </div>
        )}
      </div>
    </div>
  );
}

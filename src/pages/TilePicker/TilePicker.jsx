import { useCallback } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./TilePicker.css";

export function TilePicker({
  settings,
  state,
  onStateChange,
  onReset,
  shuffleArray,
  createFullTileSet,
}) {
  const { bag, hand, drawCount, reshuffleMode, discardPile, history } = state;

  const drawTiles = useCallback(() => {
    if (bag.length === 0) return;

    if (settings.soundEnabled) {
      playRollSound();
    }
    if (settings.vibrateEnabled) {
      vibrate(50);
    }

    let currentBag = bag;
    let currentDiscard = discardPile;

    if (!reshuffleMode && hand.length > 0) {
      currentDiscard = [...hand, ...discardPile];
    } else if (reshuffleMode && hand.length > 0) {
      currentBag = shuffleArray([...bag, ...hand]);
    }

    const numToDraw = Math.min(drawCount, currentBag.length);
    const drawnTiles = currentBag.slice(0, numToDraw);
    const remaining = currentBag.slice(numToDraw);

    onStateChange({
      hand: drawnTiles,
      bag: remaining,
      discardPile: currentDiscard,
      history: [drawnTiles, ...history].slice(0, 20),
    });
  }, [
    bag,
    discardPile,
    hand,
    drawCount,
    reshuffleMode,
    history,
    settings.soundEnabled,
    settings.vibrateEnabled,
    onStateChange,
    shuffleArray,
  ]);

  const clearHand = () => {
    if (hand.length === 0) return;

    if (reshuffleMode) {
      onStateChange({
        bag: shuffleArray([...bag, ...hand]),
        hand: [],
      });
    } else {
      onStateChange({
        discardPile: [...hand, ...discardPile],
        hand: [],
      });
    }
  };

  const reshuffleBag = () => {
    const fullBag = [...bag, ...discardPile, ...hand];
    onStateChange({
      bag: shuffleArray(fullBag),
      discardPile: [],
      hand: [],
    });
  };

  const resetBag = () => {
    onStateChange({
      bag: shuffleArray(createFullTileSet()),
      discardPile: [],
      hand: [],
      history: [],
    });
  };

  const clearHistory = () => {
    onStateChange({ history: [] });
  };

  const updateDrawCount = (delta) => {
    onStateChange({
      drawCount: Math.max(1, Math.min(10, drawCount + delta)),
    });
  };

  const allDrawnTiles = history.flat();
  const totalTiles = allDrawnTiles.length;
  const nonJokerTiles = allDrawnTiles.filter((t) => !t.isJoker);
  const topColor =
    nonJokerTiles.length > 0
      ? Object.entries(
          nonJokerTiles.reduce((acc, t) => {
            acc[t.color] = (acc[t.color] || 0) + 1;
            return acc;
          }, {}),
        ).sort((a, b) => b[1] - a[1])[0]
      : null;
  const topNumber =
    nonJokerTiles.length > 0
      ? Object.entries(
          nonJokerTiles.reduce((acc, t) => {
            acc[t.number] = (acc[t.number] || 0) + 1;
            return acc;
          }, {}),
        ).sort((a, b) => b[1] - a[1])[0]
      : null;

  const getTileClass = (tile, small = false) => {
    const base = small ? "history-tile" : "rummikub-tile";
    if (tile.isJoker) return base + " tile-joker";
    return base + " tile-" + tile.color;
  };

  return (
    <div className="tile-picker">
      <div className="tile-display-panel">
        <div className="tool-status">
          <span>Bag: {bag.length}</span>
          {!reshuffleMode && <span>Drawn: {discardPile.length}</span>}
        </div>

        <div className="drawn-tile-area">
          {hand.length > 0 ? (
            <div className="tile-hand">
              {hand.map((tile) => (
                <div key={tile.id} className={getTileClass(tile)}>
                  <span className="tile-number">
                    {tile.isJoker ? "☺" : tile.number}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rummikub-tile tile-placeholder">
              <span>Draw tiles</span>
            </div>
          )}
        </div>

        <div className="tool-stats">
          <div className="stats-header">Stats</div>
          {totalTiles > 0 ? (
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Draws</span>
                <span className="stat-value">{history.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tiles Drawn</span>
                <span className="stat-value">{totalTiles}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Top Color</span>
                <span className="stat-value">
                  {topColor[0]} ({topColor[1]})
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Top Number</span>
                <span className="stat-value">
                  {topNumber[0]} ({topNumber[1]})
                </span>
              </div>
            </div>
          ) : (
            <div className="stats-empty">Draw some tiles to track stats.</div>
          )}
        </div>
      </div>

      <div className="tile-controls">
        <div className="count-selector">
          <span className="count-label">Draw</span>
          <button
            className="inc-btn"
            onClick={() => updateDrawCount(-1)}
            disabled={drawCount <= 1}
          >
            −
          </button>
          <span className="count-value">{drawCount}</span>
          <button
            className="inc-btn"
            onClick={() => updateDrawCount(1)}
            disabled={drawCount >= 10}
          >
            +
          </button>
          <span className="count-label">
            {drawCount === 1 ? "tile" : "tiles"}
          </span>
        </div>

        <div className="tile-actions">
          <button
            className="action-btn"
            onClick={drawTiles}
            disabled={bag.length === 0}
          >
            Draw {drawCount > 1 ? drawCount + " Tiles" : "Tile"}
          </button>
          {hand.length > 0 && (
            <button className="clear-btn" onClick={clearHand}>
              Clear
            </button>
          )}
        </div>

        <div className="tool-options">
          <div className="setting-row">
            <span className="setting-label">Return after draw</span>
            <button
              className={"toggle-btn " + (reshuffleMode ? "toggle-on" : "")}
              onClick={() => onStateChange({ reshuffleMode: !reshuffleMode })}
            >
              {reshuffleMode ? "On" : "Off"}
            </button>
          </div>
        </div>

        <div className="tile-actions secondary-actions">
          {!reshuffleMode && discardPile.length > 0 && (
            <button className="clear-btn" onClick={reshuffleBag}>
              Return All to Bag
            </button>
          )}
          <button className="clear-btn" onClick={resetBag}>
            New Bag
          </button>
        </div>
      </div>

      <div className="tile-history">
        <div className="history-header">
          <span>
            History{history.length > 0 ? ` (${history.length} draws)` : ""}
          </span>
        </div>
        {history.length > 0 ? (
          <>
            <div className="history-draws">
              {history.map((draw, drawIndex) => (
                <div key={drawIndex} className="history-draw-group">
                  {draw.map((tile, tileIndex) => (
                    <div key={tileIndex} className={getTileClass(tile, true)}>
                      <span className="history-tile-number">
                        {tile.isJoker ? "☺" : tile.number}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button className="clear-btn" onClick={clearHistory}>
              Clear History
            </button>
          </>
        ) : (
          <div className="history-empty">
            Draw some tiles to see your history here.
          </div>
        )}
      </div>
    </div>
  );
}

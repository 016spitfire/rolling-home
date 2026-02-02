import { useCallback } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./TilePicker.css";

export function TilePicker({ settings, state, onStateChange, onReset, shuffleArray, createFullTileSet }) {
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
  }, [bag, discardPile, hand, drawCount, reshuffleMode, history, settings.soundEnabled, settings.vibrateEnabled, onStateChange, shuffleArray]);

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

  const getTileClass = (tile, small = false) => {
    const base = small ? "history-tile" : "rummikub-tile";
    if (tile.isJoker) return base + " tile-joker";
    return base + " tile-" + tile.color;
  };

  return (
    <div className="tile-picker">
      <div className="bag-status">
        <span>Bag: {bag.length}</span>
        {!reshuffleMode && <span>Drawn: {discardPile.length}</span>}
      </div>

      <div className="drawn-tile-area">
        {hand.length > 0 ? (
          <div className="tile-hand">
            {hand.map((tile) => (
              <div key={tile.id} className={getTileClass(tile)}>
                <span className="tile-number">{tile.isJoker ? "☺" : tile.number}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rummikub-tile tile-placeholder">
            <span>Draw tiles</span>
          </div>
        )}
      </div>

      <div className="draw-count-selector">
        <span className="draw-label">Draw</span>
        <button
          className="die-btn"
          onClick={() => updateDrawCount(-1)}
          disabled={drawCount <= 1}
        >
          −
        </button>
        <span className="draw-count">{drawCount}</span>
        <button
          className="die-btn"
          onClick={() => updateDrawCount(1)}
          disabled={drawCount >= 10}
        >
          +
        </button>
        <span className="draw-label">{drawCount === 1 ? "tile" : "tiles"}</span>
      </div>

      <div className="tile-actions">
        <button
          className="roll-btn"
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

      <div className="tile-options">
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

      {history.length > 0 && (
        <div className="tile-history">
          <div className="history-header">
            <span>History ({history.length} draws)</span>
          </div>
          <div className="history-draws">
            {history.map((draw, drawIndex) => (
              <div key={drawIndex} className="history-draw-group">
                {draw.map((tile, tileIndex) => (
                  <div key={tileIndex} className={getTileClass(tile, true)}>
                    <span className="history-tile-number">{tile.isJoker ? "☺" : tile.number}</span>
                  </div>
                ))}
              </div>
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

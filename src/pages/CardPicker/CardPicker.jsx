import { useCallback } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./CardPicker.css";

const SUIT_SYMBOLS = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const MAX_CARD_HISTORY = 20;

export function CardPicker({
  settings,
  state,
  onStateChange,
  onReset,
  shuffleArray,
  createFullDeck,
}) {
  const {
    deckCount,
    deck,
    discard,
    hand,
    drawCount,
    reshuffleMode,
    history = [],
  } = state;

  const drawCards = useCallback(() => {
    if (deck.length === 0) return;

    if (settings.soundEnabled) {
      playRollSound();
    }
    if (settings.vibrateEnabled) {
      vibrate(50);
    }

    let currentDeck = deck;
    let currentDiscard = discard;

    if (!reshuffleMode && hand.length > 0) {
      currentDiscard = [...hand, ...discard];
    } else if (reshuffleMode && hand.length > 0) {
      currentDeck = shuffleArray([...deck, ...hand]);
    }

    const numToDraw = Math.min(drawCount, currentDeck.length);
    const drawnCards = currentDeck.slice(0, numToDraw);
    const remaining = currentDeck.slice(numToDraw);

    onStateChange({
      hand: drawnCards,
      deck: remaining,
      discard: currentDiscard,
      history: [drawnCards, ...history].slice(0, MAX_CARD_HISTORY),
    });
  }, [
    deck,
    discard,
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
        deck: shuffleArray([...deck, ...hand]),
        hand: [],
      });
    } else {
      onStateChange({
        discard: [...hand, ...discard],
        hand: [],
      });
    }
  };

  const reshuffleDeck = () => {
    const fullDeck = [...deck, ...discard, ...hand];
    onStateChange({
      deck: shuffleArray(fullDeck),
      discard: [],
      hand: [],
    });
  };

  const resetDeck = () => {
    onStateChange({
      deck: shuffleArray(createFullDeck(deckCount)),
      discard: [],
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

  const updateDeckCount = (delta) => {
    const newCount = Math.max(1, Math.min(8, deckCount + delta));
    onStateChange({
      deckCount: newCount,
      deck: shuffleArray(createFullDeck(newCount)),
      discard: [],
      hand: [],
      history: [],
    });
  };

  const allDrawnCards = history.flat();
  const totalCards = allDrawnCards.length;
  const topSuit =
    totalCards > 0
      ? Object.entries(
          allDrawnCards.reduce((acc, c) => {
            acc[c.suit] = (acc[c.suit] || 0) + 1;
            return acc;
          }, {}),
        ).sort((a, b) => b[1] - a[1])[0]
      : null;
  const topRank =
    totalCards > 0
      ? Object.entries(
          allDrawnCards.reduce((acc, c) => {
            acc[c.rank] = (acc[c.rank] || 0) + 1;
            return acc;
          }, {}),
        ).sort((a, b) => b[1] - a[1])[0]
      : null;

  return (
    <div className="card-picker">
      <div className="card-display-panel">
        <div className="tool-status">
          <span>Deck: {deck.length}</span>
          {!reshuffleMode && <span>Discard: {discard.length}</span>}
        </div>

        <div className="drawn-card-area">
          {hand.length > 0 ? (
            <div className="hand">
              {hand.map((card) => {
                const isRed =
                  card.suit === "hearts" || card.suit === "diamonds";
                return (
                  <div
                    key={card.id}
                    className={
                      "playing-card " + (isRed ? "card-red" : "card-black")
                    }
                  >
                    <span className="card-rank">{card.rank}</span>
                    <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="playing-card card-placeholder">
              <span>Draw cards</span>
            </div>
          )}
        </div>

        <div className="tool-stats">
          <div className="stats-header">Stats</div>
          {totalCards > 0 ? (
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Draws</span>
                <span className="stat-value">{history.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cards Drawn</span>
                <span className="stat-value">{totalCards}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Top Suit</span>
                <span className="stat-value">
                  {SUIT_SYMBOLS[topSuit[0]]} ({topSuit[1]})
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Top Rank</span>
                <span className="stat-value">
                  {topRank[0]} ({topRank[1]})
                </span>
              </div>
            </div>
          ) : (
            <div className="stats-empty">Draw some cards to track stats.</div>
          )}
        </div>
      </div>

      <div className="card-controls">
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
          <span className="count-label">cards</span>
        </div>

        <div className="card-actions">
          <button
            className="action-btn"
            onClick={drawCards}
            disabled={deck.length === 0}
          >
            Draw {drawCount > 1 ? drawCount + " Cards" : "Card"}
          </button>
          {hand.length > 0 && (
            <button className="clear-btn" onClick={clearHand}>
              Clear
            </button>
          )}
        </div>

        <div className="tool-options">
          <div className="setting-row">
            <span className="setting-label">Decks</span>
            <div className="deck-count-control">
              <button
                className="inc-btn small"
                onClick={() => updateDeckCount(-1)}
                disabled={deckCount <= 1}
              >
                −
              </button>
              <span className="count-value">{deckCount}</span>
              <button
                className="inc-btn small"
                onClick={() => updateDeckCount(1)}
                disabled={deckCount >= 8}
              >
                +
              </button>
            </div>
          </div>
          <div className="setting-row">
            <span className="setting-label">Reshuffle after draw</span>
            <button
              className={"toggle-btn " + (reshuffleMode ? "toggle-on" : "")}
              onClick={() => onStateChange({ reshuffleMode: !reshuffleMode })}
            >
              {reshuffleMode ? "On" : "Off"}
            </button>
          </div>
        </div>

        <div className="card-actions secondary-actions">
          {!reshuffleMode && discard.length > 0 && (
            <button className="clear-btn" onClick={reshuffleDeck}>
              Reshuffle Discard
            </button>
          )}
          <button className="clear-btn" onClick={resetDeck}>
            New Deck
          </button>
        </div>
      </div>

      <div className="card-history">
        <div className="history-header">
          <span>History{history.length > 0 ? ` (${history.length})` : ""}</span>
        </div>
        {history.length > 0 ? (
          <>
            <div className="history-draws">
              {history.map((draw, drawIndex) => (
                <div key={drawIndex} className="history-draw-group">
                  {draw.map((card) => {
                    const isRed =
                      card.suit === "hearts" || card.suit === "diamonds";
                    return (
                      <div
                        key={card.id}
                        className={
                          "playing-card history-card " +
                          (isRed ? "card-red" : "card-black")
                        }
                      >
                        <span className="card-rank">{card.rank}</span>
                        <span className="card-suit">
                          {SUIT_SYMBOLS[card.suit]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <button className="clear-btn" onClick={clearHistory}>
              Clear History
            </button>
          </>
        ) : (
          <div className="history-empty">
            Draw some cards to see your history here.
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./CardPicker.css";

const SUIT_SYMBOLS = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };

export function CardPicker({ settings, state, onStateChange, onReset, shuffleArray, createFullDeck }) {
  const { deckCount, deck, discard, hand, drawCount, reshuffleMode } = state;

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
    });
  }, [deck, discard, hand, drawCount, reshuffleMode, settings.soundEnabled, settings.vibrateEnabled, onStateChange, shuffleArray]);

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
    });
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
    });
  };

  return (
    <div className="card-picker">
      <div className="deck-status">
        <span>Deck: {deck.length}</span>
        {!reshuffleMode && <span>Discard: {discard.length}</span>}
      </div>

      <div className="drawn-card-area">
        {hand.length > 0 ? (
          <div className="hand">
            {hand.map((card) => {
              const isRed = card.suit === "hearts" || card.suit === "diamonds";
              return (
                <div key={card.id} className={"playing-card " + (isRed ? "card-red" : "card-black")}>
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
        <span className="draw-label">cards</span>
      </div>

      <div className="card-actions">
        <button
          className="roll-btn"
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

      <div className="card-options">
        <div className="setting-row">
          <span className="setting-label">Decks</span>
          <div className="deck-count-control">
            <button
              className="die-btn small"
              onClick={() => updateDeckCount(-1)}
              disabled={deckCount <= 1}
            >
              −
            </button>
            <span className="draw-count">{deckCount}</span>
            <button
              className="die-btn small"
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
  );
}

import { useState, useCallback } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./CustomDeck.css";

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function CustomDeckPlay({ deck, settings, onUpdate, onEdit }) {
  const {
    name,
    cardTypes,
    deck: drawPile,
    discard,
    hand,
    drawCount,
    reshuffleMode,
    history,
  } = deck;
  const [editingCard, setEditingCard] = useState(null);
  const [editText, setEditText] = useState("");

  const drawCards = useCallback(() => {
    if (drawPile.length === 0) return;

    if (settings.soundEnabled) {
      playRollSound();
    }
    if (settings.vibrateEnabled) {
      vibrate(50);
    }

    let currentDeck = drawPile;
    let currentDiscard = discard;

    if (!reshuffleMode && hand.length > 0) {
      currentDiscard = [...hand, ...discard];
    } else if (reshuffleMode && hand.length > 0) {
      currentDeck = shuffleArray([...drawPile, ...hand]);
    }

    const numToDraw = Math.min(drawCount, currentDeck.length);
    const drawnCards = currentDeck.slice(0, numToDraw);
    const remaining = currentDeck.slice(numToDraw);

    onUpdate({
      hand: drawnCards,
      deck: remaining,
      discard: currentDiscard,
      history: [drawnCards, ...history].slice(0, 20),
    });
  }, [
    drawPile,
    discard,
    hand,
    drawCount,
    reshuffleMode,
    history,
    settings.soundEnabled,
    settings.vibrateEnabled,
    onUpdate,
  ]);

  const clearHand = () => {
    if (hand.length === 0) return;

    if (reshuffleMode) {
      onUpdate({
        deck: shuffleArray([...drawPile, ...hand]),
        hand: [],
      });
    } else {
      onUpdate({
        discard: [...hand, ...discard],
        hand: [],
      });
    }
  };

  const reshuffleDeck = () => {
    const fullDeck = [...drawPile, ...discard, ...hand];
    onUpdate({
      deck: shuffleArray(fullDeck),
      discard: [],
      hand: [],
    });
  };

  const resetDeck = () => {
    // Rebuild deck from card types
    const cards = [];
    cardTypes.forEach((ct) => {
      for (let i = 0; i < ct.count; i++) {
        cards.push({
          id: ct.id + "-" + i + "-" + Date.now(),
          text: ct.text,
          typeId: ct.id,
        });
      }
    });
    onUpdate({
      deck: shuffleArray(cards),
      discard: [],
      hand: [],
      history: [],
    });
  };

  const updateDrawCount = (delta) => {
    onUpdate({
      drawCount: Math.max(1, Math.min(10, drawCount + delta)),
    });
  };

  const clearHistory = () => {
    onUpdate({ history: [] });
  };

  // Card editing
  const startEditCard = (card) => {
    setEditingCard(card);
    setEditText(card.text);
  };

  const saveCardEdit = (applyToAll) => {
    if (!editingCard) return;

    if (applyToAll) {
      // Update all cards with the same original text
      const originalText = editingCard.text;
      const updateCards = (cards) =>
        cards.map((c) =>
          c.text === originalText ? { ...c, text: editText } : c,
        );

      onUpdate({
        deck: updateCards(drawPile),
        discard: updateCards(discard),
        hand: updateCards(hand),
        history: history.map((h) => updateCards(h)),
        cardTypes: cardTypes.map((ct) =>
          ct.id === editingCard.typeId ? { ...ct, text: editText } : ct,
        ),
      });
    } else {
      // Update just this one card
      const updateCards = (cards) =>
        cards.map((c) =>
          c.id === editingCard.id ? { ...c, text: editText } : c,
        );

      onUpdate({
        deck: updateCards(drawPile),
        discard: updateCards(discard),
        hand: updateCards(hand),
        history: history.map((h) => updateCards(h)),
      });
    }
    setEditingCard(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditText("");
  };

  // Build card type breakdown
  const drawnCounts = {};
  if (reshuffleMode) {
    // Cumulative frequency from history
    history.flat().forEach((c) => {
      drawnCounts[c.text] = (drawnCounts[c.text] || 0) + 1;
    });
  } else {
    // Cards out of the draw pile (hand + discard)
    [...hand, ...discard].forEach((c) => {
      drawnCounts[c.text] = (drawnCounts[c.text] || 0) + 1;
    });
  }

  return (
    <div className="custom-deck-play">
      <div className="custom-display-panel">
        <div className="tool-status">
          <span>Deck: {drawPile.length}</span>
          {!reshuffleMode && <span>Discard: {discard.length}</span>}
        </div>

        <div className="drawn-card-area">
          {hand.length > 0 ? (
            <div className="custom-hand">
              {hand.map((card) => (
                <div
                  key={card.id}
                  className="custom-card"
                  onClick={() => startEditCard(card)}
                >
                  <span className="custom-card-text">{card.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="custom-card card-placeholder">
              <span>Draw cards</span>
            </div>
          )}
        </div>

        <div className="tool-stats">
          <div className="stats-header">
            {reshuffleMode ? "Draw Frequency" : "Cards Drawn"}
          </div>
          <div className="card-type-breakdown">
            {cardTypes.map((ct) => (
              <div key={ct.id} className="breakdown-row">
                <span className="breakdown-label">{ct.text}</span>
                <span className="breakdown-value">
                  {reshuffleMode
                    ? `\u00d7${drawnCounts[ct.text] || 0}`
                    : `${drawnCounts[ct.text] || 0} / ${ct.count}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="custom-controls">
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
            disabled={drawPile.length === 0}
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
            <span className="setting-label">Reshuffle after draw</span>
            <button
              className={"toggle-btn " + (reshuffleMode ? "toggle-on" : "")}
              onClick={() => onUpdate({ reshuffleMode: !reshuffleMode })}
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
          <button className="clear-btn" onClick={onEdit}>
            Edit Deck
          </button>
        </div>
      </div>

      <div className="custom-history">
        <div className="history-header">
          <span>History{history.length > 0 ? ` (${history.length})` : ""}</span>
        </div>
        {history.length > 0 ? (
          <>
            <div className="history-draws">
              {history.map((draw, drawIndex) => (
                <div key={drawIndex} className="history-draw-group">
                  {draw.map((card, cardIndex) => (
                    <div key={cardIndex} className="history-custom-card">
                      {card.text}
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
            Draw some cards to see your history here.
          </div>
        )}
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="modal-backdrop" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Card</h3>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-card-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="clear-btn" onClick={() => saveCardEdit(false)}>
                Change This Card
              </button>
              <button className="action-btn" onClick={() => saveCardEdit(true)}>
                Change All "{editingCard.text}"
              </button>
            </div>
            <button className="cancel-btn" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

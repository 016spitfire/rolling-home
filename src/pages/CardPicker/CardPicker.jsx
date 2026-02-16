import { useState, useCallback } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./CardPicker.css";

const SUIT_SYMBOLS = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  joker: "★",
};
const MAX_CARD_HISTORY = 20;

function createDefaultIncludedCards(SUITS, RANKS) {
  const included = {};
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      included[rank + "-" + suit] = true;
    }
  }
  included["Joker-joker-1"] = false;
  included["Joker-joker-2"] = false;
  return included;
}

export function CardPicker({
  settings,
  state,
  onStateChange,
  onReset,
  shuffleArray,
  createFullDeck,
  SUITS,
  RANKS,
  FACE_RANKS,
  deckPresets,
  onAddPreset,
  onDeletePreset,
}) {
  const {
    deckCount,
    deck,
    discard,
    hand,
    drawCount,
    reshuffleMode,
    activePresetId,
    history = [],
  } = state;

  // Deck config local state
  const [configOpen, setConfigOpen] = useState(false);
  const [workingConfig, setWorkingConfig] = useState(() =>
    createDefaultIncludedCards(SUITS, RANKS),
  );
  const [presetName, setPresetName] = useState("");
  const [loadedPresetId, setLoadedPresetId] = useState(null);

  // --- Quick toggle helpers ---
  const isSuitEnabled = (suit) => {
    return RANKS.every((rank) => workingConfig[rank + "-" + suit]);
  };

  const isSuitPartial = (suit) => {
    const enabled = RANKS.filter(
      (rank) => workingConfig[rank + "-" + suit],
    ).length;
    return enabled > 0 && enabled < RANKS.length;
  };

  const toggleSuit = (suit) => {
    const allOn = isSuitEnabled(suit);
    const updates = {};
    for (const rank of RANKS) {
      updates[rank + "-" + suit] = !allOn;
    }
    setWorkingConfig((prev) => ({ ...prev, ...updates }));
  };

  const areFaceCardsEnabled = () => {
    return SUITS.every((suit) =>
      FACE_RANKS.every((rank) => workingConfig[rank + "-" + suit]),
    );
  };

  const areFaceCardsPartial = () => {
    const total = SUITS.length * FACE_RANKS.length;
    const enabled = SUITS.reduce(
      (acc, suit) =>
        acc +
        FACE_RANKS.filter((rank) => workingConfig[rank + "-" + suit]).length,
      0,
    );
    return enabled > 0 && enabled < total;
  };

  const toggleFaceCards = () => {
    const allOn = areFaceCardsEnabled();
    const updates = {};
    for (const suit of SUITS) {
      for (const rank of FACE_RANKS) {
        updates[rank + "-" + suit] = !allOn;
      }
    }
    setWorkingConfig((prev) => ({ ...prev, ...updates }));
  };

  const areJokersEnabled = () => {
    return workingConfig["Joker-joker-1"] && workingConfig["Joker-joker-2"];
  };

  const areJokersPartial = () => {
    const j1 = workingConfig["Joker-joker-1"];
    const j2 = workingConfig["Joker-joker-2"];
    return (j1 || j2) && !(j1 && j2);
  };

  const toggleJokers = () => {
    const allOn = areJokersEnabled();
    setWorkingConfig((prev) => ({
      ...prev,
      "Joker-joker-1": !allOn,
      "Joker-joker-2": !allOn,
    }));
  };

  const toggleCard = (key) => {
    setWorkingConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const countEnabled = () => {
    return Object.values(workingConfig).filter(Boolean).length;
  };

  // --- Preset management ---
  const loadPreset = (presetId) => {
    if (presetId === "standard") {
      setWorkingConfig(createDefaultIncludedCards(SUITS, RANKS));
      setLoadedPresetId(null);
      return;
    }
    const preset = deckPresets.find((p) => p.id === presetId);
    if (preset) {
      setWorkingConfig({ ...preset.includedCards });
      setLoadedPresetId(preset.id);
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    onAddPreset({
      name: presetName.trim(),
      includedCards: { ...workingConfig },
    });
    setPresetName("");
  };

  // --- Apply config ---
  const applyConfig = () => {
    const presetConfig = { includedCards: workingConfig };
    onStateChange({
      activePresetId: loadedPresetId,
      deck: shuffleArray(createFullDeck(deckCount, presetConfig)),
      discard: [],
      hand: [],
      history: [],
    });
  };

  // --- Active preset helper ---
  const getActivePreset = () => {
    if (!activePresetId) return null;
    const preset = deckPresets.find((p) => p.id === activePresetId);
    return preset || null;
  };

  // --- Card actions ---
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
    const preset = getActivePreset();
    onStateChange({
      deck: shuffleArray(createFullDeck(deckCount, preset)),
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
    const preset = getActivePreset();
    onStateChange({
      deckCount: newCount,
      deck: shuffleArray(createFullDeck(newCount, preset)),
      discard: [],
      hand: [],
      history: [],
    });
  };

  // --- Stats ---
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

  // --- Card rendering helper ---
  const getCardClasses = (card, extraClass = "") => {
    const isJoker = card.suit === "joker";
    const isRed = card.suit === "hearts" || card.suit === "diamonds";
    let cls = "playing-card";
    if (extraClass) cls += " " + extraClass;
    if (isJoker) cls += " card-joker";
    else if (isRed) cls += " card-red";
    else cls += " card-black";
    return cls;
  };

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
              {hand.map((card) => (
                <div key={card.id} className={getCardClasses(card)}>
                  <span className="card-rank">{card.rank}</span>
                  <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
                </div>
              ))}
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

        {/* Deck Config Panel */}
        <div className="deck-config">
          <button
            className="deck-config-toggle"
            onClick={() => setConfigOpen(!configOpen)}
          >
            <span>Deck Config</span>
            <span className="config-toggle-icon">{configOpen ? "▲" : "▼"}</span>
          </button>

          {configOpen && (
            <div className="deck-config-body">
              {/* Preset selector */}
              <div className="config-section">
                <label className="config-label">Preset</label>
                <select
                  className="config-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) loadPreset(e.target.value);
                  }}
                >
                  <option value="">Load a preset...</option>
                  <option value="standard">Standard 52-Card</option>
                  {deckPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick toggles */}
              <div className="config-section">
                <label className="config-label">Quick Toggles</label>
                <div className="quick-toggles">
                  {SUITS.map((suit) => {
                    const on = isSuitEnabled(suit);
                    const partial = isSuitPartial(suit);
                    return (
                      <button
                        key={suit}
                        className={
                          "quick-toggle-btn" +
                          (on ? " toggle-active" : "") +
                          (partial ? " toggle-partial" : "") +
                          (suit === "hearts" || suit === "diamonds"
                            ? " toggle-red"
                            : "")
                        }
                        onClick={() => toggleSuit(suit)}
                        title={suit}
                      >
                        {SUIT_SYMBOLS[suit]}
                      </button>
                    );
                  })}
                  <button
                    className={
                      "quick-toggle-btn" +
                      (areFaceCardsEnabled() ? " toggle-active" : "") +
                      (areFaceCardsPartial() ? " toggle-partial" : "")
                    }
                    onClick={toggleFaceCards}
                    title="Face cards (J, Q, K)"
                  >
                    JQK
                  </button>
                  <button
                    className={
                      "quick-toggle-btn" +
                      (areJokersEnabled() ? " toggle-active" : "") +
                      (areJokersPartial() ? " toggle-partial" : "")
                    }
                    onClick={toggleJokers}
                    title="Jokers"
                  >
                    ★
                  </button>
                </div>
              </div>

              {/* Card grid */}
              <div className="config-section">
                <label className="config-label">Cards ({countEnabled()})</label>
                <div className="card-grid">
                  {SUITS.map((suit) => (
                    <div key={suit} className="card-grid-row">
                      <span
                        className={
                          "grid-suit-label" +
                          (suit === "hearts" || suit === "diamonds"
                            ? " grid-suit-red"
                            : "")
                        }
                      >
                        {SUIT_SYMBOLS[suit]}
                      </span>
                      {RANKS.map((rank) => {
                        const key = rank + "-" + suit;
                        const on = workingConfig[key];
                        return (
                          <button
                            key={key}
                            className={
                              "grid-card-btn" + (on ? " grid-card-on" : "")
                            }
                            onClick={() => toggleCard(key)}
                            title={rank + " of " + suit}
                          >
                            {rank}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {/* Joker row */}
                  <div className="card-grid-row joker-row">
                    <span className="grid-suit-label grid-suit-joker">★</span>
                    <button
                      className={
                        "grid-card-btn grid-joker-btn" +
                        (workingConfig["Joker-joker-1"] ? " grid-card-on" : "")
                      }
                      onClick={() => toggleCard("Joker-joker-1")}
                      title="Joker 1"
                    >
                      J1
                    </button>
                    <button
                      className={
                        "grid-card-btn grid-joker-btn" +
                        (workingConfig["Joker-joker-2"] ? " grid-card-on" : "")
                      }
                      onClick={() => toggleCard("Joker-joker-2")}
                      title="Joker 2"
                    >
                      J2
                    </button>
                  </div>
                </div>
              </div>

              {/* Save preset */}
              <div className="config-section config-save">
                <input
                  type="text"
                  className="config-input"
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") savePreset();
                  }}
                />
                <button
                  className="clear-btn"
                  onClick={savePreset}
                  disabled={!presetName.trim()}
                >
                  Save Preset
                </button>
              </div>

              {/* Delete presets */}
              {deckPresets.length > 0 && (
                <div className="config-section">
                  <label className="config-label">Saved Presets</label>
                  <div className="preset-list">
                    {deckPresets.map((p) => (
                      <div key={p.id} className="preset-list-item">
                        <span
                          className="preset-name"
                          onClick={() => loadPreset(p.id)}
                        >
                          {p.name}
                        </span>
                        <button
                          className="remove-btn"
                          onClick={() => onDeletePreset(p.id)}
                          title="Delete preset"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button */}
              <button
                className="action-btn config-apply-btn"
                onClick={applyConfig}
                disabled={countEnabled() === 0}
              >
                Apply & New Deck
              </button>
            </div>
          )}
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
                  {draw.map((card) => (
                    <div
                      key={card.id}
                      className={getCardClasses(card, "history-card")}
                    >
                      <span className="card-rank">{card.rank}</span>
                      <span className="card-suit">
                        {SUIT_SYMBOLS[card.suit]}
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
            Draw some cards to see your history here.
          </div>
        )}
      </div>
    </div>
  );
}

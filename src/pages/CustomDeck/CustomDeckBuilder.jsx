import { useState } from "react";
import "./CustomDeck.css";

export function CustomDeckBuilder({
  existingDeck = null,
  onSave,
  onDelete = null,
  onCancel,
}) {
  const [name, setName] = useState(existingDeck?.name || "");
  const [cardTypes, setCardTypes] = useState(
    existingDeck?.cardTypes || [{ id: "type-1", text: "", count: 1 }],
  );

  const addCardType = () => {
    setCardTypes([
      ...cardTypes,
      { id: "type-" + Date.now(), text: "", count: 1 },
    ]);
  };

  const updateCardType = (id, updates) => {
    setCardTypes(
      cardTypes.map((ct) => (ct.id === id ? { ...ct, ...updates } : ct)),
    );
  };

  const removeCardType = (id) => {
    if (cardTypes.length <= 1) return;
    setCardTypes(cardTypes.filter((ct) => ct.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const validCardTypes = cardTypes.filter(
      (ct) => ct.text.trim() && ct.count > 0,
    );
    if (validCardTypes.length === 0) return;

    // Build the actual deck from card types
    const cards = [];
    validCardTypes.forEach((ct) => {
      for (let i = 0; i < ct.count; i++) {
        cards.push({
          id: ct.id + "-" + i,
          text: ct.text,
          typeId: ct.id,
        });
      }
    });

    onSave({
      name: name.trim(),
      cardTypes: validCardTypes,
      // Game state
      deck: shuffleArray([...cards]),
      discard: [],
      hand: [],
      drawCount: 1,
      reshuffleMode: false,
      history: [],
    });
  };

  const totalCards = cardTypes.reduce((sum, ct) => sum + (ct.count || 0), 0);
  const isValid =
    name.trim() && cardTypes.some((ct) => ct.text.trim() && ct.count > 0);

  return (
    <div className="custom-deck-builder">
      <header className="builder-header">
        <button className="back-btn" onClick={onCancel}>
          ← Cancel
        </button>
        <h1>{existingDeck ? "Edit Deck" : "New Custom Deck"}</h1>
        <div style={{ width: 48 }}></div>
      </header>

      <div className="builder-content">
        <div className="builder-field">
          <label>Deck Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Player Action Deck"
            className="deck-name-input"
          />
        </div>

        <div className="builder-field">
          <label>Card Types ({totalCards} total cards)</label>
          <div className="card-types-list">
            {cardTypes.map((ct) => (
              <div key={ct.id} className="card-type-row">
                <input
                  type="text"
                  value={ct.text}
                  onChange={(e) =>
                    updateCardType(ct.id, { text: e.target.value })
                  }
                  placeholder="Card text..."
                  className="card-text-input"
                />
                <div className="card-count-control">
                  <button
                    className="inc-btn small"
                    onClick={() =>
                      updateCardType(ct.id, {
                        count: Math.max(1, ct.count - 1),
                      })
                    }
                    disabled={ct.count <= 1}
                  >
                    −
                  </button>
                  <span className="card-count">{ct.count}</span>
                  <button
                    className="inc-btn small"
                    onClick={() =>
                      updateCardType(ct.id, { count: ct.count + 1 })
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeCardType(ct.id)}
                  disabled={cardTypes.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button className="add-card-type-btn" onClick={addCardType}>
            + Add Card Type
          </button>
        </div>
      </div>

      <div className="builder-actions">
        <button className="action-btn" onClick={handleSave} disabled={!isValid}>
          {existingDeck ? "Save Changes" : "Create Deck"}
        </button>
        {existingDeck && onDelete && (
          <button className="delete-btn" onClick={onDelete}>
            Delete Deck
          </button>
        )}
      </div>
    </div>
  );
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

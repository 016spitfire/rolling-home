import { useState, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

// Dice utilities inline to avoid import issues
const DICE_ORDER = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

function createEmptyDiceState() {
  return { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 };
}

// Card utilities
const SUITS = ["spades", "hearts", "diamonds", "clubs"];
const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function createFullDeck(deckCount = 1) {
  const deck = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, id: rank + "-" + suit + "-" + d });
      }
    }
  }
  return deck;
}

// Tile utilities
const COLORS = ["red", "blue", "yellow", "black"];

function createFullTileSet() {
  const tiles = [];
  for (let copy = 0; copy < 2; copy++) {
    for (const color of COLORS) {
      for (let num = 1; num <= 13; num++) {
        tiles.push({
          color,
          number: num,
          isJoker: false,
          id: color + "-" + num + "-" + copy,
        });
      }
    }
  }
  tiles.push({ color: "joker", number: null, isJoker: true, id: "joker-0" });
  tiles.push({ color: "joker", number: null, isJoker: true, id: "joker-1" });
  return tiles;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Default states
const defaultDiceState = {
  dice: createEmptyDiceState(),
  results: [],
  history: [],
  rollId: 0,
};

const defaultCardState = {
  deckCount: 1,
  deck: shuffleArray(createFullDeck(1)),
  discard: [],
  hand: [],
  drawCount: 1,
  reshuffleMode: false,
};

const defaultCoinState = {
  results: [],
  flipCount: 1,
  history: [],
};

const defaultTileState = {
  bag: shuffleArray(createFullTileSet()),
  hand: [],
  drawCount: 1,
  reshuffleMode: false,
  discardPile: [],
  history: [],
};

export function useToolStates() {
  // Dice state
  const [diceState, setDiceState] = useState(defaultDiceState);

  // Card state
  const [cardState, setCardState] = useState(defaultCardState);

  // Coin state
  const [coinState, setCoinState] = useState(defaultCoinState);

  // Tile state
  const [tileState, setTileState] = useState(defaultTileState);

  // Custom decks stored in localStorage for persistence across sessions
  const [customDecks, setCustomDecks] = useLocalStorage("custom-decks", []);

  // Saved games stored in localStorage
  const [savedGames, setSavedGames] = useLocalStorage("saved-games", []);

  // Game templates stored in localStorage
  const [gameTemplates, setGameTemplates] = useLocalStorage(
    "game-templates",
    [],
  );

  // Dice actions
  const updateDiceState = useCallback((updates) => {
    setDiceState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetDice = useCallback(() => {
    setDiceState(defaultDiceState);
  }, []);

  // Card actions
  const updateCardState = useCallback((updates) => {
    setCardState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetCards = useCallback((deckCount = 1) => {
    setCardState({
      ...defaultCardState,
      deckCount,
      deck: shuffleArray(createFullDeck(deckCount)),
    });
  }, []);

  // Coin actions
  const updateCoinState = useCallback((updates) => {
    setCoinState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetCoins = useCallback(() => {
    setCoinState(defaultCoinState);
  }, []);

  // Tile actions
  const updateTileState = useCallback((updates) => {
    setTileState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetTiles = useCallback(() => {
    setTileState({
      ...defaultTileState,
      bag: shuffleArray(createFullTileSet()),
    });
  }, []);

  // Custom deck actions
  const addCustomDeck = useCallback(
    (deck) => {
      const newDeck = {
        ...deck,
        id: "deck-" + Date.now(),
        createdAt: Date.now(),
      };
      setCustomDecks((prev) => [...prev, newDeck]);
      return newDeck.id;
    },
    [setCustomDecks],
  );

  const updateCustomDeck = useCallback(
    (deckId, updates) => {
      setCustomDecks((prev) =>
        prev.map((d) => (d.id === deckId ? { ...d, ...updates } : d)),
      );
    },
    [setCustomDecks],
  );

  const deleteCustomDeck = useCallback(
    (deckId) => {
      setCustomDecks((prev) => prev.filter((d) => d.id !== deckId));
    },
    [setCustomDecks],
  );

  // Save/Load game actions
  const saveGame = useCallback(
    (name, existingSaveId = null) => {
      const gameState = {
        diceState,
        cardState,
        coinState,
        tileState,
        customDecks,
      };

      if (existingSaveId) {
        setSavedGames((prev) =>
          prev.map((save) =>
            save.id === existingSaveId
              ? { ...save, state: gameState, timestamp: Date.now() }
              : save,
          ),
        );
      } else {
        const newSave = {
          id: "save-" + Date.now(),
          name,
          state: gameState,
          timestamp: Date.now(),
        };
        setSavedGames((prev) => [...prev, newSave]);
      }
    },
    [diceState, cardState, coinState, tileState, customDecks, setSavedGames],
  );

  const loadGame = useCallback(
    (saveId) => {
      const save = savedGames.find((s) => s.id === saveId);
      if (!save) return;

      const { state } = save;
      setDiceState(state.diceState || defaultDiceState);
      setCardState(state.cardState || defaultCardState);
      setCoinState(state.coinState || defaultCoinState);
      setTileState(state.tileState || defaultTileState);
      if (state.customDecks) {
        setCustomDecks(state.customDecks);
      }
    },
    [savedGames, setCustomDecks],
  );

  const deleteGame = useCallback(
    (saveId) => {
      setSavedGames((prev) => prev.filter((s) => s.id !== saveId));
    },
    [setSavedGames],
  );

  // Game template actions
  const addGameTemplate = useCallback(
    (template) => {
      const newTemplate = {
        ...template,
        id: "template-" + Date.now(),
        createdAt: Date.now(),
      };
      setGameTemplates((prev) => [...prev, newTemplate]);
      return newTemplate.id;
    },
    [setGameTemplates],
  );

  const updateGameTemplate = useCallback(
    (templateId, updates) => {
      setGameTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, ...updates } : t)),
      );
    },
    [setGameTemplates],
  );

  const deleteGameTemplate = useCallback(
    (templateId) => {
      setGameTemplates((prev) => prev.filter((t) => t.id !== templateId));
    },
    [setGameTemplates],
  );

  return {
    // Dice
    diceState,
    updateDiceState,
    resetDice,

    // Cards
    cardState,
    updateCardState,
    resetCards,

    // Coins
    coinState,
    updateCoinState,
    resetCoins,

    // Tiles
    tileState,
    updateTileState,
    resetTiles,

    // Custom decks
    customDecks,
    addCustomDeck,
    updateCustomDeck,
    deleteCustomDeck,

    // Save/Load
    savedGames,
    saveGame,
    loadGame,
    deleteGame,

    // Game templates
    gameTemplates,
    addGameTemplate,
    updateGameTemplate,
    deleteGameTemplate,

    // Utilities for components
    shuffleArray,
    createFullDeck,
    createFullTileSet,
  };
}

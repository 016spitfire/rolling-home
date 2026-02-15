import { useState } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./GameTemplate.css";

const SUIT_SYMBOLS = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

export function GameTemplateRunner({
  template,
  settings,
  toolStates,
  onExit,
  initialVariables,
}) {
  const [variables, setVariables] = useState(() => {
    if (initialVariables) return initialVariables;
    const defaults = {};
    template.setupVariables.forEach((v) => {
      defaults[v.name] = v.default;
    });
    return defaults;
  });
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResult, setStepResult] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [cycleCount, setCycleCount] = useState(1);
  const [sessionLog, setSessionLog] = useState([]);
  const [expandedLogEntries, setExpandedLogEntries] = useState({});

  const currentPhase = template.phases[currentPhaseIndex];
  const currentStep = currentPhase?.steps[currentStepIndex];

  const evaluateExpression = (expr) => {
    if (!expr) return 0;
    if (typeof expr === "number") return expr;

    let evaluated = expr.toString();
    Object.entries(variables).forEach(([name, value]) => {
      evaluated = evaluated.replace(new RegExp(name, "g"), value);
    });

    try {
      return Math.max(
        0,
        Math.floor(Function('"use strict"; return (' + evaluated + ")")()),
      );
    } catch {
      return parseInt(evaluated) || 0;
    }
  };

  const executeAutoAction = () => {
    if (!currentStep) return;

    if (settings.soundEnabled) playRollSound();
    if (settings.vibrateEnabled) vibrate(50);

    const { actionType, config } = currentStep;

    switch (actionType) {
      case "cards": {
        const count = evaluateExpression(config.drawCount);
        const deckSource = config.deckSource || "standard";

        if (deckSource === "standard") {
          const { deck, discard, hand } = toolStates.cardState;
          let currentDeck = deck;
          let currentDiscard = discard;

          if (hand.length > 0) {
            currentDiscard = [...hand, ...discard];
          }

          const numToDraw = Math.min(count, currentDeck.length);
          const drawnCards = currentDeck.slice(0, numToDraw);
          const remaining = currentDeck.slice(numToDraw);

          toolStates.updateCardState({
            hand: drawnCards,
            deck: remaining,
            discard: currentDiscard,
          });

          setStepResult({ type: "cards", cards: drawnCards });
        } else {
          const customDeck = toolStates.customDecks.find(
            (d) => d.id === deckSource,
          );
          if (customDeck) {
            let currentDeck = customDeck.deck || [];
            let currentDiscard = customDeck.discard || [];
            let currentHand = customDeck.hand || [];

            if (currentHand.length > 0) {
              currentDiscard = [...currentHand, ...currentDiscard];
            }

            const numToDraw = Math.min(count, currentDeck.length);
            const drawnCards = currentDeck.slice(0, numToDraw);
            const remaining = currentDeck.slice(numToDraw);

            toolStates.updateCustomDeck(deckSource, {
              hand: drawnCards,
              deck: remaining,
              discard: currentDiscard,
            });

            setStepResult({
              type: "custom-cards",
              cards: drawnCards,
              deckName: customDeck.name,
            });
          }
        }
        break;
      }

      case "tiles": {
        const count = evaluateExpression(config.drawCount);
        const { bag, discardPile, hand, history } = toolStates.tileState;

        let currentBag = bag;
        let currentDiscard = discardPile;

        if (hand.length > 0) {
          currentDiscard = [...hand, ...discardPile];
        }

        const numToDraw = Math.min(count, currentBag.length);
        const drawnTiles = currentBag.slice(0, numToDraw);
        const remaining = currentBag.slice(numToDraw);

        toolStates.updateTileState({
          hand: drawnTiles,
          bag: remaining,
          discardPile: currentDiscard,
          history: [drawnTiles, ...history].slice(0, 20),
        });

        setStepResult({ type: "tiles", tiles: drawnTiles });
        break;
      }

      case "coins": {
        const count = evaluateExpression(config.flipCount);
        const flips = [];
        for (let i = 0; i < count; i++) {
          flips.push(Math.random() < 0.5 ? "heads" : "tails");
        }

        toolStates.updateCoinState({
          results: flips,
          history: [...flips, ...toolStates.coinState.history].slice(0, 50),
        });

        setStepResult({ type: "coins", flips });
        break;
      }

      case "dice": {
        const results = [];
        const diceOrder = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
        const diceValues = {
          d4: 4,
          d6: 6,
          d8: 8,
          d10: 10,
          d12: 12,
          d20: 20,
          d100: 100,
        };

        diceOrder.forEach((die) => {
          const count = evaluateExpression(config[die]);
          if (count > 0) {
            const rolls = [];
            for (let i = 0; i < count; i++) {
              rolls.push(Math.floor(Math.random() * diceValues[die]) + 1);
            }
            results.push({
              die,
              rolls,
              total: rolls.reduce((a, b) => a + b, 0),
            });
          }
        });

        toolStates.updateDiceState({ results });
        setStepResult({ type: "dice", results });
        break;
      }
    }
  };

  const executeInputAction = () => {
    if (!currentStep) return;

    const count = parseInt(inputValue) || 0;
    if (count <= 0) return;

    if (settings.soundEnabled) playRollSound();
    if (settings.vibrateEnabled) vibrate(50);

    const { actionType, config } = currentStep;

    switch (actionType) {
      case "cards": {
        const deckSource = config.deckSource || "standard";

        if (deckSource === "standard") {
          const { deck, discard, hand } = toolStates.cardState;
          let currentDeck = deck;
          let currentDiscard = discard;

          if (hand.length > 0) {
            currentDiscard = [...hand, ...discard];
          }

          const numToDraw = Math.min(count, currentDeck.length);
          const drawnCards = currentDeck.slice(0, numToDraw);
          const remaining = currentDeck.slice(numToDraw);

          toolStates.updateCardState({
            hand: drawnCards,
            deck: remaining,
            discard: currentDiscard,
          });

          setStepResult({ type: "cards", cards: drawnCards });
        } else {
          const customDeck = toolStates.customDecks.find(
            (d) => d.id === deckSource,
          );
          if (customDeck) {
            let currentDeck = customDeck.deck || [];
            let currentDiscard = customDeck.discard || [];
            let currentHand = customDeck.hand || [];

            if (currentHand.length > 0) {
              currentDiscard = [...currentHand, ...currentDiscard];
            }

            const numToDraw = Math.min(count, currentDeck.length);
            const drawnCards = currentDeck.slice(0, numToDraw);
            const remaining = currentDeck.slice(numToDraw);

            toolStates.updateCustomDeck(deckSource, {
              hand: drawnCards,
              deck: remaining,
              discard: currentDiscard,
            });

            setStepResult({
              type: "custom-cards",
              cards: drawnCards,
              deckName: customDeck.name,
            });
          }
        }
        break;
      }

      case "tiles": {
        const { bag, discardPile, hand, history } = toolStates.tileState;

        let currentBag = bag;
        let currentDiscard = discardPile;

        if (hand.length > 0) {
          currentDiscard = [...hand, ...discardPile];
        }

        const numToDraw = Math.min(count, currentBag.length);
        const drawnTiles = currentBag.slice(0, numToDraw);
        const remaining = currentBag.slice(numToDraw);

        toolStates.updateTileState({
          hand: drawnTiles,
          bag: remaining,
          discardPile: currentDiscard,
          history: [drawnTiles, ...history].slice(0, 20),
        });

        setStepResult({ type: "tiles", tiles: drawnTiles });
        break;
      }

      case "coins": {
        const flips = [];
        for (let i = 0; i < count; i++) {
          flips.push(Math.random() < 0.5 ? "heads" : "tails");
        }

        toolStates.updateCoinState({
          results: flips,
          history: [...flips, ...toolStates.coinState.history].slice(0, 50),
        });

        setStepResult({ type: "coins", flips });
        break;
      }

      case "dice": {
        setStepResult({
          type: "dice-input",
          message: "Navigate to dice roller to complete",
        });
        break;
      }
    }

    setInputValue("");
  };

  const logCurrentStep = () => {
    if (!currentStep) return;

    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      phaseName: currentPhase.name,
      phaseIndex: currentPhaseIndex,
      cycle: cycleCount,
      step: { ...currentStep },
      result: stepResult ? { ...stepResult } : null,
    };

    setSessionLog((prev) => [...prev, entry]);
  };

  const toggleLogEntry = (entryId) => {
    setExpandedLogEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const nextStep = () => {
    logCurrentStep();
    setStepResult(null);
    setInputValue("");

    if (currentStepIndex < currentPhase.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (currentPhaseIndex < template.phases.length - 1) {
      setCurrentPhaseIndex(currentPhaseIndex + 1);
      setCurrentStepIndex(0);
    } else {
      setCurrentPhaseIndex(0);
      setCurrentStepIndex(0);
      setCycleCount(cycleCount + 1);
    }
  };

  const prevStep = () => {
    setStepResult(null);
    setInputValue("");

    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex(currentPhaseIndex - 1);
      setCurrentStepIndex(
        template.phases[currentPhaseIndex - 1].steps.length - 1,
      );
    }
  };

  const getActionDescription = (step) => {
    if (step.actionType === "cards") {
      return "Draw " + evaluateExpression(step.config.drawCount) + " cards";
    }
    if (step.actionType === "tiles") {
      return "Draw " + evaluateExpression(step.config.drawCount) + " tiles";
    }
    if (step.actionType === "coins") {
      return "Flip " + evaluateExpression(step.config.flipCount) + " coins";
    }
    if (step.actionType === "dice") {
      return "Roll dice";
    }
    return "Execute action";
  };

  // Group session log entries by cycle and phase for display
  const groupedLog = [];
  let lastCycle = null;
  let lastPhase = null;

  sessionLog.forEach((entry) => {
    if (entry.cycle !== lastCycle) {
      groupedLog.push({ type: "cycle-header", cycle: entry.cycle });
      lastCycle = entry.cycle;
      lastPhase = null;
    }
    if (entry.phaseName !== lastPhase) {
      groupedLog.push({ type: "phase-header", phaseName: entry.phaseName });
      lastPhase = entry.phaseName;
    }
    groupedLog.push({ type: "entry", entry });
  });

  const renderLogResult = (result) => {
    if (!result) return null;

    switch (result.type) {
      case "cards":
        return (
          <div className="log-result-cards">
            {result.cards.map((card) => {
              const isRed = card.suit === "hearts" || card.suit === "diamonds";
              return (
                <span
                  key={card.id}
                  className={"log-card " + (isRed ? "card-red" : "card-black")}
                >
                  {card.rank}
                  {SUIT_SYMBOLS[card.suit]}
                </span>
              );
            })}
          </div>
        );
      case "custom-cards":
        return (
          <div className="log-result-custom-cards">
            {result.cards.map((card) => (
              <span key={card.id} className="log-custom-card">
                {card.text}
              </span>
            ))}
          </div>
        );
      case "tiles":
        return (
          <div className="log-result-tiles">
            {result.tiles.map((tile) => (
              <span key={tile.id} className={"log-tile tile-" + tile.color}>
                {tile.isJoker ? "☺" : tile.number}
              </span>
            ))}
          </div>
        );
      case "coins":
        return (
          <div className="log-result-coins">
            {result.flips.map((flip, i) => (
              <span key={i} className={"log-coin " + flip}>
                {flip === "heads" ? "H" : "T"}
              </span>
            ))}
          </div>
        );
      case "dice":
        return (
          <div className="log-result-dice">
            {result.results.map((r) => (
              <span key={r.die} className="log-die-result">
                {r.die}: {r.rolls.join(", ")} ({r.total})
              </span>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="game-template-runner">
      <header className="runner-header">
        <button className="back-btn" onClick={onExit}>
          ← Exit
        </button>
        <h1>{template.name}</h1>
        <span className="cycle-count">Cycle {cycleCount}</span>
      </header>

      <div className="runner-layout">
        <div className="runner-content">
          <div className="phase-indicator">
            {template.phases.map((phase, idx) => (
              <span
                key={phase.id}
                className={
                  "phase-dot " +
                  (idx === currentPhaseIndex
                    ? "active"
                    : idx < currentPhaseIndex
                      ? "done"
                      : "")
                }
              >
                {phase.name}
              </span>
            ))}
          </div>

          <div className="current-phase">
            <h2>{currentPhase.name}</h2>
            <span className="step-counter">
              Step {currentStepIndex + 1} of {currentPhase.steps.length}
            </span>
          </div>

          {currentStep && (
            <div className="current-step">
              {currentStep.type === "text" && (
                <div className="step-text-display">
                  {currentStep.title && (
                    <h3 className="step-title">{currentStep.title}</h3>
                  )}
                  <p>{currentStep.text}</p>
                </div>
              )}

              {currentStep.type === "auto-action" && !stepResult && (
                <div className="step-auto-action">
                  <p className="action-description">
                    {getActionDescription(currentStep)}
                  </p>
                  <button className="action-btn" onClick={executeAutoAction}>
                    Execute
                  </button>
                </div>
              )}

              {currentStep.type === "input-action" && !stepResult && (
                <div className="step-input-action">
                  <p className="action-prompt">
                    {currentStep.prompt || "Enter a number:"}
                  </p>
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter number..."
                    min="0"
                    className="input-action-input"
                  />
                  <button
                    className="action-btn"
                    onClick={executeInputAction}
                    disabled={!inputValue || parseInt(inputValue) <= 0}
                  >
                    Execute
                  </button>
                </div>
              )}

              {stepResult && (
                <div className="step-result">
                  {stepResult.type === "cards" && (
                    <div className="result-cards">
                      {stepResult.cards.map((card) => {
                        const isRed =
                          card.suit === "hearts" || card.suit === "diamonds";
                        return (
                          <div
                            key={card.id}
                            className={
                              "mini-card " + (isRed ? "card-red" : "card-black")
                            }
                          >
                            <span>{card.rank}</span>
                            <span>{SUIT_SYMBOLS[card.suit]}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {stepResult.type === "custom-cards" && (
                    <div className="result-custom-cards">
                      <p className="deck-name">{stepResult.deckName}</p>
                      <div className="custom-cards-list">
                        {stepResult.cards.map((card) => (
                          <div key={card.id} className="mini-custom-card">
                            {card.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stepResult.type === "tiles" && (
                    <div className="result-tiles">
                      {stepResult.tiles.map((tile) => (
                        <div
                          key={tile.id}
                          className={"mini-tile tile-" + tile.color}
                        >
                          {tile.isJoker ? "☺" : tile.number}
                        </div>
                      ))}
                    </div>
                  )}

                  {stepResult.type === "coins" && (
                    <div className="result-coins">
                      {stepResult.flips.map((flip, i) => (
                        <div key={i} className={"mini-coin " + flip}>
                          {flip === "heads" ? "H" : "T"}
                        </div>
                      ))}
                      <p className="coin-summary">
                        Heads:{" "}
                        {stepResult.flips.filter((f) => f === "heads").length} |
                        Tails:{" "}
                        {stepResult.flips.filter((f) => f === "tails").length}
                      </p>
                    </div>
                  )}

                  {stepResult.type === "dice" && (
                    <div className="result-dice">
                      {stepResult.results.map((r) => (
                        <div key={r.die} className="dice-result-row">
                          <span className="die-name">{r.die}:</span>
                          <span className="die-rolls">
                            {r.rolls.join(", ")}
                          </span>
                          <span className="die-total">({r.total})</span>
                        </div>
                      ))}
                      <p className="dice-grand-total">
                        Total:{" "}
                        {stepResult.results.reduce(
                          (sum, r) => sum + r.total,
                          0,
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="runner-nav">
            <button
              className="clear-btn"
              onClick={prevStep}
              disabled={currentPhaseIndex === 0 && currentStepIndex === 0}
            >
              ← Previous
            </button>
            <button className="action-btn" onClick={nextStep}>
              Next →
            </button>
          </div>
        </div>

        <div className="session-log">
          <div className="session-log-header">
            <span>
              Session Log
              {sessionLog.length > 0 ? ` (${sessionLog.length})` : ""}
            </span>
          </div>
          {sessionLog.length > 0 ? (
            <div className="session-log-entries">
              {groupedLog.map((item, idx) => {
                if (item.type === "cycle-header") {
                  return (
                    <div key={"cycle-" + idx} className="log-cycle-header">
                      Cycle {item.cycle}
                    </div>
                  );
                }
                if (item.type === "phase-header") {
                  return (
                    <div key={"phase-" + idx} className="log-phase-header">
                      {item.phaseName}
                    </div>
                  );
                }

                const { entry } = item;
                const isExpanded = expandedLogEntries[entry.id];

                return (
                  <div key={entry.id} className="log-entry">
                    {entry.step.type === "text" && (
                      <div
                        className="log-entry-text"
                        onClick={() =>
                          entry.step.text && toggleLogEntry(entry.id)
                        }
                      >
                        <span className="log-entry-label">
                          {entry.step.title ||
                            entry.step.text?.slice(0, 40) +
                              (entry.step.text?.length > 40 ? "..." : "")}
                        </span>
                        {isExpanded && entry.step.text && (
                          <p className="log-entry-full-text">
                            {entry.step.text}
                          </p>
                        )}
                      </div>
                    )}
                    {(entry.step.type === "auto-action" ||
                      entry.step.type === "input-action") && (
                      <div className="log-entry-action">
                        <span className="log-entry-label">
                          {getActionDescription(entry.step)}
                        </span>
                        {renderLogResult(entry.result)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="history-empty">
              Complete steps to build your session log.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

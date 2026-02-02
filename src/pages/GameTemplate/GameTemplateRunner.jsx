import { useState, useEffect } from "react";
import { playRollSound, vibrate } from "../../utils/sound";
import "./GameTemplate.css";

const SUIT_SYMBOLS = { spades: "\u2660", hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663" };

export function GameTemplateRunner({ 
  template, 
  settings,
  toolStates,
  onExit 
}) {
  const [variables, setVariables] = useState({});
  const [setupComplete, setSetupComplete] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResult, setStepResult] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [cycleCount, setCycleCount] = useState(1);

  useEffect(() => {
    const defaults = {};
    template.setupVariables.forEach(v => {
      defaults[v.name] = v.default;
    });
    setVariables(defaults);
  }, [template]);

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
      return Math.max(0, Math.floor(Function('"use strict"; return (' + evaluated + ')')()));
    } catch {
      return parseInt(evaluated) || 0;
    }
  };

  const handleSetupComplete = () => {
    setSetupComplete(true);
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
          const customDeck = toolStates.customDecks.find(d => d.id === deckSource);
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
            
            setStepResult({ type: "custom-cards", cards: drawnCards, deckName: customDeck.name });
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
        const diceValues = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100 };
        
        diceOrder.forEach(die => {
          const count = evaluateExpression(config[die]);
          if (count > 0) {
            const rolls = [];
            for (let i = 0; i < count; i++) {
              rolls.push(Math.floor(Math.random() * diceValues[die]) + 1);
            }
            results.push({ die, rolls, total: rolls.reduce((a, b) => a + b, 0) });
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
          const customDeck = toolStates.customDecks.find(d => d.id === deckSource);
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
            
            setStepResult({ type: "custom-cards", cards: drawnCards, deckName: customDeck.name });
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
        setStepResult({ type: "dice-input", message: "Navigate to dice roller to complete" });
        break;
      }
    }
    
    setInputValue("");
  };

  const nextStep = () => {
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
      setCurrentStepIndex(template.phases[currentPhaseIndex - 1].steps.length - 1);
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

  if (!setupComplete) {
    return (
      <div className="game-template-runner">
        <header className="runner-header">
          <button className="back-btn" onClick={onExit}>← Exit</button>
          <h1>{template.name}</h1>
          <div style={{ width: 48 }}></div>
        </header>

        <div className="setup-screen">
          <h2>Game Setup</h2>
          
          {template.setupVariables.length === 0 ? (
            <p className="setup-hint">No setup required. Press Start to begin!</p>
          ) : (
            <div className="setup-variables">
              {template.setupVariables.map(v => (
                <div key={v.id} className="setup-var-row">
                  <label>{v.label || v.name}</label>
                  <input
                    type="number"
                    value={variables[v.name] || v.default}
                    onChange={(e) => setVariables({ ...variables, [v.name]: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              ))}
            </div>
          )}

          <button className="roll-btn start-btn" onClick={handleSetupComplete}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-template-runner">
      <header className="runner-header">
        <button className="back-btn" onClick={onExit}>← Exit</button>
        <h1>{template.name}</h1>
        <span className="cycle-count">Cycle {cycleCount}</span>
      </header>

      <div className="runner-content">
        <div className="phase-indicator">
          {template.phases.map((phase, idx) => (
            <span 
              key={phase.id} 
              className={"phase-dot " + (idx === currentPhaseIndex ? "active" : idx < currentPhaseIndex ? "done" : "")}
            >
              {phase.name}
            </span>
          ))}
        </div>

        <div className="current-phase">
          <h2>{currentPhase.name}</h2>
          <span className="step-counter">Step {currentStepIndex + 1} of {currentPhase.steps.length}</span>
        </div>

        {currentStep && (
          <div className="current-step">
            {currentStep.type === "text" && (
              <div className="step-text-display">
                <p>{currentStep.text}</p>
              </div>
            )}

            {currentStep.type === "auto-action" && !stepResult && (
              <div className="step-auto-action">
                <p className="action-description">{getActionDescription(currentStep)}</p>
                <button className="roll-btn" onClick={executeAutoAction}>Execute</button>
              </div>
            )}

            {currentStep.type === "input-action" && !stepResult && (
              <div className="step-input-action">
                <p className="action-prompt">{currentStep.prompt || "Enter a number:"}</p>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter number..."
                  min="0"
                  className="input-action-input"
                />
                <button 
                  className="roll-btn" 
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
                    {stepResult.cards.map(card => {
                      const isRed = card.suit === "hearts" || card.suit === "diamonds";
                      return (
                        <div key={card.id} className={"mini-card " + (isRed ? "card-red" : "card-black")}>
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
                      {stepResult.cards.map(card => (
                        <div key={card.id} className="mini-custom-card">{card.text}</div>
                      ))}
                    </div>
                  </div>
                )}

                {stepResult.type === "tiles" && (
                  <div className="result-tiles">
                    {stepResult.tiles.map(tile => (
                      <div key={tile.id} className={"mini-tile tile-" + tile.color}>
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
                      Heads: {stepResult.flips.filter(f => f === "heads").length} | Tails: {stepResult.flips.filter(f => f === "tails").length}
                    </p>
                  </div>
                )}

                {stepResult.type === "dice" && (
                  <div className="result-dice">
                    {stepResult.results.map(r => (
                      <div key={r.die} className="dice-result-row">
                        <span className="die-name">{r.die}:</span>
                        <span className="die-rolls">{r.rolls.join(", ")}</span>
                        <span className="die-total">({r.total})</span>
                      </div>
                    ))}
                    <p className="dice-grand-total">
                      Total: {stepResult.results.reduce((sum, r) => sum + r.total, 0)}
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
          <button className="roll-btn" onClick={nextStep}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

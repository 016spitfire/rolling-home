import { useState } from "react";
import "./GameTemplate.css";

const ACTION_TYPES = [
  { id: "cards", label: "Draw Cards", icon: "♠" },
  { id: "tiles", label: "Draw Tiles", icon: "■" },
  { id: "coins", label: "Flip Coins", icon: "●" },
  { id: "dice", label: "Roll Dice", icon: "⚄" },
];

const DICE_OPTIONS = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

function generateId(prefix) {
  return (
    prefix + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
  );
}

export function GameTemplateBuilder({
  existingTemplate = null,
  customDecks = [],
  deckPresets = [],
  onSave,
  onDelete = null,
  onCancel,
}) {
  const [name, setName] = useState(existingTemplate?.name || "");
  const [setupVariables, setSetupVariables] = useState(
    existingTemplate?.setupVariables || [],
  );
  const [phases, setPhases] = useState(
    existingTemplate?.phases || [
      { id: generateId("phase"), name: "Phase 1", steps: [] },
    ],
  );
  const [expandedPhase, setExpandedPhase] = useState(phases[0]?.id || null);
  const [editingStep, setEditingStep] = useState(null);

  // Setup Variables
  const addVariable = () => {
    setSetupVariables([
      ...setupVariables,
      {
        id: generateId("var"),
        name: "",
        label: "",
        type: "number",
        default: 1,
      },
    ]);
  };

  const updateVariable = (id, updates) => {
    setSetupVariables(
      setupVariables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  };

  const removeVariable = (id) => {
    setSetupVariables(setupVariables.filter((v) => v.id !== id));
  };

  // Phases
  const addPhase = () => {
    const newPhase = { id: generateId("phase"), name: "New Phase", steps: [] };
    setPhases([...phases, newPhase]);
    setExpandedPhase(newPhase.id);
  };

  const updatePhase = (id, updates) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removePhase = (id) => {
    if (phases.length <= 1) return;
    setPhases(phases.filter((p) => p.id !== id));
    if (expandedPhase === id) {
      setExpandedPhase(phases.find((p) => p.id !== id)?.id || null);
    }
  };

  const movePhase = (id, direction) => {
    const index = phases.findIndex((p) => p.id === id);
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === phases.length - 1)
    )
      return;
    const newPhases = [...phases];
    [newPhases[index], newPhases[index + direction]] = [
      newPhases[index + direction],
      newPhases[index],
    ];
    setPhases(newPhases);
  };

  // Steps
  const addStep = (phaseId, type) => {
    const newStep = {
      id: generateId("step"),
      type,
      ...(type === "text" ? { title: "", text: "" } : {}),
      ...(type === "auto-action" || type === "input-action"
        ? {
            actionType: "cards",
            config: {},
            ...(type === "input-action" ? { prompt: "" } : {}),
          }
        : {}),
    };
    setPhases(
      phases.map((p) =>
        p.id === phaseId ? { ...p, steps: [...p.steps, newStep] } : p,
      ),
    );
    setEditingStep({ phaseId, step: newStep });
  };

  const updateStep = (phaseId, stepId, updates) => {
    setPhases(
      phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              steps: p.steps.map((s) =>
                s.id === stepId ? { ...s, ...updates } : s,
              ),
            }
          : p,
      ),
    );
  };

  const removeStep = (phaseId, stepId) => {
    setPhases(
      phases.map((p) =>
        p.id === phaseId
          ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) }
          : p,
      ),
    );
  };

  const moveStep = (phaseId, stepId, direction) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const index = phase.steps.findIndex((s) => s.id === stepId);
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === phase.steps.length - 1)
    )
      return;
    const newSteps = [...phase.steps];
    [newSteps[index], newSteps[index + direction]] = [
      newSteps[index + direction],
      newSteps[index],
    ];
    updatePhase(phaseId, { steps: newSteps });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (phases.length === 0) return;

    onSave({
      name: name.trim(),
      setupVariables,
      phases,
    });
  };

  const isValid = name.trim() && phases.length > 0;

  return (
    <div className="game-template-builder">
      <header className="builder-header">
        <button className="back-btn" onClick={onCancel}>
          ← Cancel
        </button>
        <h1>{existingTemplate ? "Edit Template" : "New Game Template"}</h1>
        <div style={{ width: 48 }}></div>
      </header>

      <div className="builder-content">
        {/* Template Name */}
        <div className="builder-section">
          <label>Template Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Castle Defense"
            className="template-name-input"
          />
        </div>

        {/* Setup Variables */}
        <div className="builder-section">
          <div className="section-header">
            <label>Setup Variables</label>
            <button className="add-btn-small" onClick={addVariable}>
              + Add
            </button>
          </div>
          {setupVariables.length === 0 ? (
            <p className="empty-hint">
              Variables let you use values like player count in your steps.
            </p>
          ) : (
            <div className="variables-list">
              {setupVariables.map((v) => (
                <div key={v.id} className="variable-row">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) =>
                      updateVariable(v.id, {
                        name: e.target.value.replace(/\s/g, ""),
                      })
                    }
                    placeholder="variableName"
                    className="var-name-input"
                  />
                  <input
                    type="text"
                    value={v.label}
                    onChange={(e) =>
                      updateVariable(v.id, { label: e.target.value })
                    }
                    placeholder="Display Label"
                    className="var-label-input"
                  />
                  <input
                    type="number"
                    value={v.default}
                    onChange={(e) =>
                      updateVariable(v.id, {
                        default: parseInt(e.target.value) || 1,
                      })
                    }
                    className="var-default-input"
                    min="1"
                  />
                  <button
                    className="remove-btn"
                    onClick={() => removeVariable(v.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phases */}
        <div className="builder-section">
          <div className="section-header">
            <label>Phases (will loop)</label>
            <button className="add-btn-small" onClick={addPhase}>
              + Add Phase
            </button>
          </div>
          <div className="phases-list">
            {phases.map((phase, phaseIndex) => (
              <div key={phase.id} className="phase-card">
                <div
                  className="phase-header"
                  onClick={() =>
                    setExpandedPhase(
                      expandedPhase === phase.id ? null : phase.id,
                    )
                  }
                >
                  <div className="phase-title-row">
                    <span className="phase-number">{phaseIndex + 1}.</span>
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => {
                        e.stopPropagation();
                        updatePhase(phase.id, { name: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="phase-name-input"
                      placeholder="Phase name"
                    />
                  </div>
                  <div className="phase-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        movePhase(phase.id, -1);
                      }}
                      disabled={phaseIndex === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        movePhase(phase.id, 1);
                      }}
                      disabled={phaseIndex === phases.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhase(phase.id);
                      }}
                      disabled={phases.length <= 1}
                    >
                      ✕
                    </button>
                    <span className="expand-icon">
                      {expandedPhase === phase.id ? "▼" : "▶"}
                    </span>
                  </div>
                </div>

                {expandedPhase === phase.id && (
                  <div className="phase-content">
                    {phase.steps.length === 0 ? (
                      <p className="empty-hint">
                        No steps yet. Add a step below.
                      </p>
                    ) : (
                      <div className="steps-list">
                        {phase.steps.map((step, stepIndex) => (
                          <div key={step.id} className="step-row">
                            <span className="step-number">
                              {stepIndex + 1}.
                            </span>
                            <div
                              className="step-summary"
                              onClick={() =>
                                setEditingStep({ phaseId: phase.id, step })
                              }
                            >
                              {step.type === "text" && (
                                <span className="step-text">
                                  ✎ {step.title || step.text || "(empty text)"}
                                </span>
                              )}
                              {step.type === "auto-action" && (
                                <span className="step-action">
                                  ⚡ Auto:{" "}
                                  {ACTION_TYPES.find(
                                    (a) => a.id === step.actionType,
                                  )?.label || step.actionType}
                                </span>
                              )}
                              {step.type === "input-action" && (
                                <span className="step-action">
                                  ✋ Input:{" "}
                                  {ACTION_TYPES.find(
                                    (a) => a.id === step.actionType,
                                  )?.label || step.actionType}
                                </span>
                              )}
                            </div>
                            <div className="step-actions">
                              <button
                                onClick={() => moveStep(phase.id, step.id, -1)}
                                disabled={stepIndex === 0}
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveStep(phase.id, step.id, 1)}
                                disabled={stepIndex === phase.steps.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => removeStep(phase.id, step.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="add-step-buttons">
                      <button onClick={() => addStep(phase.id, "text")}>
                        + Text
                      </button>
                      <button onClick={() => addStep(phase.id, "auto-action")}>
                        + Auto Action
                      </button>
                      <button onClick={() => addStep(phase.id, "input-action")}>
                        + Input Action
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="builder-actions">
        <button className="action-btn" onClick={handleSave} disabled={!isValid}>
          {existingTemplate ? "Save Changes" : "Create Template"}
        </button>
        {existingTemplate && onDelete && (
          <button className="delete-btn" onClick={onDelete}>
            Delete Template
          </button>
        )}
      </div>

      {/* Step Editor Modal */}
      {editingStep && (
        <StepEditorModal
          step={editingStep.step}
          phaseId={editingStep.phaseId}
          setupVariables={setupVariables}
          customDecks={customDecks}
          deckPresets={deckPresets}
          onSave={(updates) => {
            updateStep(editingStep.phaseId, editingStep.step.id, updates);
            setEditingStep(null);
          }}
          onCancel={() => setEditingStep(null)}
        />
      )}
    </div>
  );
}

function StepEditorModal({
  step,
  phaseId,
  setupVariables,
  customDecks,
  deckPresets,
  onSave,
  onCancel,
}) {
  const [localStep, setLocalStep] = useState({ ...step });

  const updateLocal = (updates) => {
    setLocalStep((prev) => ({ ...prev, ...updates }));
  };

  const updateConfig = (updates) => {
    setLocalStep((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }));
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="step-editor-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Step</h3>

        {localStep.type === "text" && (
          <>
            <div className="editor-field">
              <label>Title (shown in session log)</label>
              <input
                type="text"
                value={localStep.title || ""}
                onChange={(e) => updateLocal({ title: e.target.value })}
                placeholder="e.g., Deal starting hands"
              />
            </div>
            <div className="editor-field">
              <label>Full Text</label>
              <textarea
                value={localStep.text || ""}
                onChange={(e) => updateLocal({ text: e.target.value })}
                placeholder="Enter instruction for players..."
                rows={3}
              />
            </div>
          </>
        )}

        {(localStep.type === "auto-action" ||
          localStep.type === "input-action") && (
          <>
            {localStep.type === "input-action" && (
              <div className="editor-field">
                <label>Prompt Text</label>
                <input
                  type="text"
                  value={localStep.prompt || ""}
                  onChange={(e) => updateLocal({ prompt: e.target.value })}
                  placeholder="e.g., How many coins to flip?"
                />
              </div>
            )}

            <div className="editor-field">
              <label>Action Type</label>
              <div className="action-type-buttons">
                {ACTION_TYPES.map((action) => (
                  <button
                    key={action.id}
                    className={
                      "action-type-btn " +
                      (localStep.actionType === action.id ? "active" : "")
                    }
                    onClick={() =>
                      updateLocal({ actionType: action.id, config: {} })
                    }
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards Config */}
            {localStep.actionType === "cards" && (
              <div className="action-config">
                <div className="editor-field">
                  <label>Deck Source</label>
                  <select
                    value={localStep.config.deckSource || "standard"}
                    onChange={(e) =>
                      updateConfig({ deckSource: e.target.value })
                    }
                  >
                    <option value="standard">Standard Deck</option>
                    {deckPresets.length > 0 && (
                      <optgroup label="Deck Presets">
                        {deckPresets.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {customDecks.length > 0 && (
                      <optgroup label="Custom Decks">
                        {customDecks.map((deck) => (
                          <option key={deck.id} value={deck.id}>
                            {deck.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                {localStep.type === "auto-action" && (
                  <div className="editor-field">
                    <label>
                      Draw Count (use variable name like playersCount or a
                      number)
                    </label>
                    <input
                      type="text"
                      value={localStep.config.drawCount || ""}
                      onChange={(e) =>
                        updateConfig({ drawCount: e.target.value })
                      }
                      placeholder="e.g., 4 or playersCount"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tiles Config */}
            {localStep.actionType === "tiles" &&
              localStep.type === "auto-action" && (
                <div className="action-config">
                  <div className="editor-field">
                    <label>Draw Count (use variable name or number)</label>
                    <input
                      type="text"
                      value={localStep.config.drawCount || ""}
                      onChange={(e) =>
                        updateConfig({ drawCount: e.target.value })
                      }
                      placeholder="e.g., 4 or playersCount * 2"
                    />
                  </div>
                </div>
              )}

            {/* Coins Config */}
            {localStep.actionType === "coins" &&
              localStep.type === "auto-action" && (
                <div className="action-config">
                  <div className="editor-field">
                    <label>Flip Count (use variable name or number)</label>
                    <input
                      type="text"
                      value={localStep.config.flipCount || ""}
                      onChange={(e) =>
                        updateConfig({ flipCount: e.target.value })
                      }
                      placeholder="e.g., 3 or playersCount"
                    />
                  </div>
                </div>
              )}

            {/* Dice Config */}
            {localStep.actionType === "dice" &&
              localStep.type === "auto-action" && (
                <div className="action-config">
                  <div className="editor-field">
                    <label>Dice to Roll</label>
                    {DICE_OPTIONS.map((die) => (
                      <div key={die} className="dice-config-row">
                        <span>{die}</span>
                        <input
                          type="text"
                          value={localStep.config[die] || ""}
                          onChange={(e) =>
                            updateConfig({ [die]: e.target.value })
                          }
                          placeholder="0 or variable"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </>
        )}

        <div className="modal-actions">
          <button className="clear-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="action-btn" onClick={() => onSave(localStep)}>
            Save Step
          </button>
        </div>
      </div>
    </div>
  );
}

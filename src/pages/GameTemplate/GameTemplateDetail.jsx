import { useState, useEffect } from "react";
import "./GameTemplate.css";

export function GameTemplateDetail({ template, onRun, onEdit }) {
  const [variables, setVariables] = useState({});

  useEffect(() => {
    const defaults = {};
    template.setupVariables.forEach((v) => {
      defaults[v.name] = v.default;
    });
    setVariables(defaults);
  }, [template]);

  return (
    <div className="game-template-detail">
      <div className="template-info">
        <h2>{template.name}</h2>
        <p className="template-meta">
          {template.phases.length} phase
          {template.phases.length !== 1 ? "s" : ""} |{" "}
          {template.phases.reduce((sum, p) => sum + p.steps.length, 0)} total
          steps
        </p>

        {template.setupVariables.length > 0 && (
          <div className="template-variables">
            <h4>Setup Variables</h4>
            <div className="setup-variables">
              {template.setupVariables.map((v) => (
                <div key={v.id} className="setup-var-row">
                  <label>{v.label || v.name}</label>
                  <input
                    type="number"
                    value={variables[v.name] || v.default}
                    onChange={(e) =>
                      setVariables({
                        ...variables,
                        [v.name]: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="template-phases-preview">
          <h4>Phases</h4>
          <ol>
            {template.phases.map((phase) => (
              <li key={phase.id}>
                <strong>{phase.name}</strong>
                <span className="step-count">
                  {" "}
                  ({phase.steps.length} steps)
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="template-detail-actions">
        <button className="action-btn" onClick={() => onRun(variables)}>
          Start Game
        </button>
        <button className="clear-btn" onClick={onEdit}>
          Edit Template
        </button>
      </div>
    </div>
  );
}

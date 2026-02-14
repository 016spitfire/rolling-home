import "./GameTemplate.css";

export function GameTemplateDetail({ template, onRun, onEdit }) {
  return (
    <div className="game-template-detail">
      <div className="template-info">
        <h2>{template.name}</h2>
        <p className="template-meta">
          {template.phases.length} phase
          {template.phases.length !== 1 ? "s" : ""} |
          {template.phases.reduce((sum, p) => sum + p.steps.length, 0)} total
          steps
        </p>

        {template.setupVariables.length > 0 && (
          <div className="template-variables">
            <h4>Setup Variables</h4>
            <ul>
              {template.setupVariables.map((v) => (
                <li key={v.id}>
                  {v.label || v.name} (default: {v.default})
                </li>
              ))}
            </ul>
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
        <button className="action-btn" onClick={onRun}>
          Start Game
        </button>
        <button className="clear-btn" onClick={onEdit}>
          Edit Template
        </button>
      </div>
    </div>
  );
}

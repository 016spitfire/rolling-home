import { useState } from "react";
import "./SaveLoad.css";

export function SaveLoadModal({ isOpen, onClose, saves, onSave, onLoad, onDelete }) {
  const [newSaveName, setNewSaveName] = useState("");
  const [showNewSave, setShowNewSave] = useState(false);
  const [confirmLoad, setConfirmLoad] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!isOpen) return null;

  const handleNewSave = () => {
    if (!newSaveName.trim()) return;
    onSave(newSaveName.trim());
    setNewSaveName("");
    setShowNewSave(false);
  };

  const handleOverwrite = (saveId) => {
    onSave(null, saveId);
  };

  const handleLoad = (saveId) => {
    if (confirmLoad === saveId) {
      onLoad(saveId);
      setConfirmLoad(null);
      onClose();
    } else {
      setConfirmLoad(saveId);
      setConfirmDelete(null);
    }
  };

  const handleDelete = (saveId) => {
    if (confirmDelete === saveId) {
      onDelete(saveId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(saveId);
      setConfirmLoad(null);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="save-load-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Saved Games</h2>
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* New Save Section */}
          {showNewSave ? (
            <div className="new-save-form">
              <input
                type="text"
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
                placeholder="Enter save name..."
                className="save-name-input"
                autoFocus
              />
              <div className="new-save-actions">
                <button className="roll-btn" onClick={handleNewSave} disabled={!newSaveName.trim()}>
                  Save
                </button>
                <button className="clear-btn" onClick={() => { setShowNewSave(false); setNewSaveName(""); }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="new-save-btn" onClick={() => setShowNewSave(true)}>
              + New Save
            </button>
          )}

          {/* Saves List */}
          {saves.length === 0 ? (
            <div className="no-saves">
              <p>No saved games yet.</p>
              <p className="no-saves-hint">Create a new save to store your current game state.</p>
            </div>
          ) : (
            <div className="saves-list">
              {saves.map((save) => (
                <div key={save.id} className="save-item">
                  <div className="save-info">
                    <span className="save-name">{save.name}</span>
                    <span className="save-date">Last saved: {formatDate(save.timestamp)}</span>
                  </div>
                  <div className="save-actions">
                    {confirmLoad === save.id ? (
                      <button className="confirm-btn load" onClick={() => handleLoad(save.id)}>
                        Confirm Load?
                      </button>
                    ) : (
                      <button className="action-btn" onClick={() => handleLoad(save.id)}>
                        Load
                      </button>
                    )}
                    <button className="action-btn" onClick={() => handleOverwrite(save.id)}>
                      Overwrite
                    </button>
                    {confirmDelete === save.id ? (
                      <button className="confirm-btn delete" onClick={() => handleDelete(save.id)}>
                        Confirm?
                      </button>
                    ) : (
                      <button className="action-btn delete" onClick={() => handleDelete(save.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

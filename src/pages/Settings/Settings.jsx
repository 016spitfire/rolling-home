import { DICE_ORDER } from "../../utils/dice";
import "./Settings.css";

const THEME_LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const THEME_CYCLE = ["light", "dark", "system"];

export function Settings({ settings, onSettingsChange, onBack }) {
  const cycleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(settings.themeMode);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    onSettingsChange({ themeMode: THEME_CYCLE[nextIndex] });
  };

  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission === "granted") {
          onSettingsChange({ shakeEnabled: true });
        }
      } catch (e) {
        console.error("Motion permission denied", e);
      }
    } else {
      onSettingsChange({ shakeEnabled: true });
    }
  };

  const toggleShake = () => {
    if (!settings.shakeEnabled) {
      requestMotionPermission();
    } else {
      onSettingsChange({ shakeEnabled: false });
    }
  };

  const toggleDieVisibility = (die) => {
    onSettingsChange({
      visibleDice: {
        ...settings.visibleDice,
        [die]: !settings.visibleDice[die],
      },
    });
  };

  return (
    <div className="settings">
      <header className="settings-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Settings</h1>
        <div style={{ width: 48 }}></div>
      </header>

      <div className="settings-list">
        <div className="setting-row">
          <span className="setting-label">Theme</span>
          <button className="setting-value" onClick={cycleTheme}>
            {THEME_LABELS[settings.themeMode]}
          </button>
        </div>

        <div className="setting-row">
          <span className="setting-label">Shake to Roll</span>
          <button
            className={`toggle-btn ${settings.shakeEnabled ? "toggle-on" : ""}`}
            onClick={toggleShake}
          >
            {settings.shakeEnabled ? "On" : "Off"}
          </button>
        </div>

        <div className="setting-row">
          <span className="setting-label">Roll Sound</span>
          <button
            className={`toggle-btn ${settings.soundEnabled ? "toggle-on" : ""}`}
            onClick={() => onSettingsChange({ soundEnabled: !settings.soundEnabled })}
          >
            {settings.soundEnabled ? "On" : "Off"}
          </button>
        </div>

        <div className="setting-row">
          <span className="setting-label">Vibration</span>
          <button
            className={`toggle-btn ${settings.vibrateEnabled ? "toggle-on" : ""}`}
            onClick={() => onSettingsChange({ vibrateEnabled: !settings.vibrateEnabled })}
          >
            {settings.vibrateEnabled ? "On" : "Off"}
          </button>
        </div>

        <div className="setting-section">
          <span className="setting-section-label">Show/Hide Dice</span>
          <div className="dice-toggles">
            {DICE_ORDER.map((die) => (
              <button
                key={die}
                className={`dice-toggle-btn ${settings.visibleDice[die] ? "dice-toggle-on" : ""}`}
                onClick={() => toggleDieVisibility(die)}
              >
                {die}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import "./App.css";

type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
type ThemeMode = "light" | "dark" | "system";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface DiceState {
  d4: number;
  d6: number;
  d8: number;
  d10: number;
  d12: number;
  d20: number;
  d100: number;
}

interface RollResult {
  die: DieType;
  rolls: number[];
  total: number;
}

const DIE_VALUES: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

const DICE_ORDER: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"];
const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const SHAKE_THRESHOLD = 15;
const SHAKE_COOLDOWN = 1000;

function App() {
  const [dice, setDice] = useState<DiceState>({
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
  });

  const [results, setResults] = useState<RollResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    return saved && THEME_CYCLE.includes(saved) ? saved : "system";
  });

  const [shakeEnabled, setShakeEnabled] = useState(() => {
    const saved = localStorage.getItem("shake-enabled");
    return saved === "true";
  });

  const [visibleDice, setVisibleDice] = useState<Record<DieType, boolean>>(
    () => {
      const saved = localStorage.getItem("visible-dice");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return Object.fromEntries(DICE_ORDER.map((d) => [d, true])) as Record<
            DieType,
            boolean
          >;
        }
      }
      return Object.fromEntries(DICE_ORDER.map((d) => [d, true])) as Record<
        DieType,
        boolean
      >;
    },
  );

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const hasAnyDice = Object.values(dice).some((count) => count > 0);

  const roll = useCallback(() => {
    const currentDice = dice;
    const hasDice = Object.values(currentDice).some((count) => count > 0);
    if (!hasDice) return;

    const newResults: RollResult[] = [];

    for (const die of DICE_ORDER) {
      const count = currentDice[die];
      if (count > 0) {
        const sides = DIE_VALUES[die];
        const rolls = Array.from({ length: count }, () => rollDie(sides));
        const total = rolls.reduce((sum, r) => sum + r, 0);
        newResults.push({ die, rolls, total });
      }
    }

    setResults(newResults);
  }, [dice]);

  // Theme effect
  useEffect(() => {
    const applyTheme = () => {
      const effectiveTheme =
        themeMode === "system" ? getSystemTheme() : themeMode;
      document.documentElement.setAttribute("data-theme", effectiveTheme);
    };

    applyTheme();
    localStorage.setItem("theme", themeMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [themeMode]);

  // Shake to roll effect
  useEffect(() => {
    if (!shakeEnabled) return;

    let lastShake = 0;
    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    let initialized = false;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      if (!initialized) {
        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
        initialized = true;
        return;
      }

      const deltaX = Math.abs(acc.x - lastX);
      const deltaY = Math.abs(acc.y - lastY);
      const deltaZ = Math.abs(acc.z - lastZ);

      const totalDelta = deltaX + deltaY + deltaZ;

      if (totalDelta > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShake > SHAKE_COOLDOWN) {
          lastShake = now;
          roll();
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [shakeEnabled, roll]);

  // Save shake preference
  useEffect(() => {
    localStorage.setItem("shake-enabled", shakeEnabled.toString());
  }, [shakeEnabled]);

  // Save visible dice preference
  useEffect(() => {
    localStorage.setItem("visible-dice", JSON.stringify(visibleDice));
  }, [visibleDice]);

  // Install prompt effect
  useEffect(() => {
    const dismissed = localStorage.getItem("install-banner-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("install-banner-dismissed", "true");
  };

  const cycleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setThemeMode(THEME_CYCLE[nextIndex]);
  };

  const updateDie = (die: DieType, delta: number) => {
    setDice((prev) => ({
      ...prev,
      [die]: Math.max(0, prev[die] + delta),
    }));
  };

  const clearDice = () => {
    setDice({
      d4: 0,
      d6: 0,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      d100: 0,
    });
    setResults([]);
  };

  const requestMotionPermission = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === "granted") {
          setShakeEnabled(true);
        }
      } catch (e) {
        console.error("Motion permission denied", e);
      }
    } else {
      setShakeEnabled(true);
    }
  };

  const toggleShake = () => {
    if (!shakeEnabled) {
      requestMotionPermission();
    } else {
      setShakeEnabled(false);
    }
  };

  const toggleDieVisibility = (die: DieType) => {
    setVisibleDice((prev) => ({
      ...prev,
      [die]: !prev[die],
    }));
  };

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);

  if (showSettings) {
    return (
      <div className="app">
        <header className="header">
          <button className="back-btn" onClick={() => setShowSettings(false)}>
            ← Back
          </button>
          <h1>Settings</h1>
          <div style={{ width: 48 }}></div>
        </header>

        <div className="settings-list">
          <div className="setting-row">
            <span className="setting-label">Theme</span>
            <button className="setting-value" onClick={cycleTheme}>
              {THEME_LABELS[themeMode]}
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">Shake to Roll</span>
            <button
              className={`toggle-btn ${shakeEnabled ? "toggle-on" : ""}`}
              onClick={toggleShake}
            >
              {shakeEnabled ? "On" : "Off"}
            </button>
          </div>

          <div className="setting-section">
            <span className="setting-section-label">Show/Hide Dice</span>
            <div className="dice-toggles">
              {DICE_ORDER.map((die) => (
                <button
                  key={die}
                  className={`dice-toggle-btn ${visibleDice[die] ? "dice-toggle-on" : ""}`}
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

  return (
    <div className="app">
      <header className="header">
        <h1>Rolling Home</h1>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      <div className="dice-selector">
        {DICE_ORDER.filter((die) => visibleDice[die]).map((die) => (
          <div key={die} className="die-row">
            <span className="die-label">{die}</span>
            <button
              className="die-btn"
              onClick={() => updateDie(die, -1)}
              disabled={dice[die] === 0}
            >
              −
            </button>
            <span className="die-count">{dice[die]}</span>
            <button className="die-btn" onClick={() => updateDie(die, 1)}>
              +
            </button>
          </div>
        ))}
      </div>

      <div className="action-buttons">
        <button className="roll-btn" onClick={roll} disabled={!hasAnyDice}>
          Roll
        </button>
        <button
          className="clear-btn"
          onClick={clearDice}
          disabled={!hasAnyDice}
        >
          Clear
        </button>
      </div>

      {results.length > 0 && (
        <div className="results">
          <h2>Results</h2>
          {results.map((result) => (
            <div key={result.die} className="result-row">
              <span className="result-die">{result.die}:</span>
              <span className="result-rolls">{result.rolls.join(", ")}</span>
              <span className="result-total">({result.total})</span>
            </div>
          ))}
          {results.length > 1 && (
            <div className="grand-total">Total: {grandTotal}</div>
          )}
          {results.length === 1 && (
            <div className="grand-total">Total: {results[0].total}</div>
          )}
        </div>
      )}

      {showInstallBanner && (
        <div className="install-banner">
          <span>Install Rolling Home for quick access</span>
          <div className="install-banner-buttons">
            <button className="install-btn" onClick={handleInstall}>
              Install
            </button>
            <button className="dismiss-btn" onClick={dismissBanner}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

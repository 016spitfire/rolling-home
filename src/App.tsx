import { useState, useEffect } from "react";
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
const THEME_ICONS: Record<ThemeMode, string> = {
  light: "☀️",
  dark: "🌙",
  system: "⚙️",
};

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

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
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    return saved && THEME_CYCLE.includes(saved) ? saved : "system";
  });

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

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

  const roll = () => {
    const newResults: RollResult[] = [];

    for (const die of DICE_ORDER) {
      const count = dice[die];
      if (count > 0) {
        const sides = DIE_VALUES[die];
        const rolls = Array.from({ length: count }, () => rollDie(sides));
        const total = rolls.reduce((sum, r) => sum + r, 0);
        newResults.push({ die, rolls, total });
      }
    }

    setResults(newResults);
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

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);
  const hasAnyDice = Object.values(dice).some((count) => count > 0);

  return (
    <div className="app">
      <header className="header">
        <h1>Rolling Home</h1>
        <button
          className="theme-btn"
          onClick={cycleTheme}
          title={`Theme: ${themeMode}`}
        >
          {THEME_ICONS[themeMode]}
        </button>
      </header>

      <div className="dice-selector">
        {DICE_ORDER.map((die) => (
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

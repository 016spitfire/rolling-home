import { useState, useEffect } from "react";
import { Menu } from "./components/Menu/Menu";
import { DiceRoller } from "./pages/DiceRoller/DiceRoller";
import { Settings } from "./pages/Settings/Settings";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { DICE_ORDER } from "./utils/dice";
import "./App.css";

type ThemeMode = "light" | "dark" | "system";
type PageId = "home" | "settings";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface AppSettings {
  themeMode: ThemeMode;
  shakeEnabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  visibleDice: Record<string, boolean>;
}

const defaultVisibleDice = Object.fromEntries(
  DICE_ORDER.map((d) => [d, true]),
) as Record<string, boolean>;

const defaultSettings: AppSettings = {
  themeMode: "system",
  shakeEnabled: false,
  soundEnabled: false,
  vibrateEnabled: false,
  visibleDice: defaultVisibleDice,
};

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage(
    "app-settings",
    defaultSettings,
  );

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Theme effect
  useEffect(() => {
    const applyTheme = () => {
      const effectiveTheme =
        settings.themeMode === "system" ? getSystemTheme() : settings.themeMode;
      document.documentElement.setAttribute("data-theme", effectiveTheme);
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [settings.themeMode]);

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

  const handleSettingsChange = (updates: Partial<AppSettings>) => {
    setSettings((prev: AppSettings) => ({ ...prev, ...updates }));
  };

  const handleNavigate = (pageId: PageId) => {
    setCurrentPage(pageId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "settings":
        return (
          <Settings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onBack={() => setCurrentPage("home")}
          />
        );
      case "home":
      default:
        return <DiceRoller settings={settings} />;
    }
  };

  return (
    <div className="app">
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {currentPage === "home" && (
        <header className="header">
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1>Rolling Home</h1>
          <div style={{ width: 36 }}></div>
        </header>
      )}

      <main className="main-content">{renderPage()}</main>

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

import { useState, useEffect } from "react";
import { Menu } from "./components/Menu/Menu";
import { SaveLoadModal } from "./components/SaveLoad/SaveLoadModal";
import { DiceRoller } from "./pages/DiceRoller/DiceRoller";
import { CardPicker } from "./pages/CardPicker/CardPicker";
import { CoinFlipper } from "./pages/CoinFlipper/CoinFlipper";
import { TilePicker } from "./pages/TilePicker/TilePicker";
import { CustomDeckBuilder } from "./pages/CustomDeck/CustomDeckBuilder";
import { CustomDeckPlay } from "./pages/CustomDeck/CustomDeckPlay";
import { Settings } from "./pages/Settings/Settings";
import { GameTemplateBuilder } from "./pages/GameTemplate/GameTemplateBuilder";
import { GameTemplateRunner } from "./pages/GameTemplate/GameTemplateRunner";
import { GameTemplateDetail } from "./pages/GameTemplate/GameTemplateDetail";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToolStates } from "./hooks/useToolStates";
import { DICE_ORDER } from "./utils/dice";
import "./App.css";
import "./components/SaveLoad/SaveLoad.css";

type ThemeMode = "light" | "dark" | "system";

const PAGE_TITLES: Record<string, string> = {
  dice: "Dice Roller",
  cards: "Card Picker",
  coin: "Coin Flip",
  tiles: "Tile Picker",
  settings: "Settings",
  "new-custom-deck": "New Custom Deck",
  "new-template": "New Game Template",
};

const VALID_PAGES = ["dice", "cards", "coin", "tiles", "settings", "new-custom-deck", "new-template"];

// Pages where the FAB should be shown
const FAB_PAGES = ["dice", "cards", "coin", "tiles"];

function getPageFromHash(): string {
  const hash = window.location.hash.replace("#/", "");
  if (!hash) return "dice";
  if (hash.startsWith("deck-") || hash.startsWith("edit-deck-")) {
    return hash;
  }
  if (hash.startsWith("template-") || hash.startsWith("edit-template-") || hash.startsWith("run-template-")) {
    return hash;
  }
  if (VALID_PAGES.includes(hash)) {
    return hash;
  }
  return "dice";
}

function setHashForPage(pageId: string) {
  window.location.hash = "/" + pageId;
}

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
  const [currentPage, setCurrentPage] = useState<string>(getPageFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage(
    "app-settings",
    defaultSettings,
  );

  const toolStates = useToolStates();

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Hash change listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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

  const handleNavigate = (pageId: string) => {
    setHashForPage(pageId);
    setCurrentPage(pageId);
  };

  const getPageTitle = () => {
    if (PAGE_TITLES[currentPage]) {
      return PAGE_TITLES[currentPage];
    }
    if (currentPage.startsWith("deck-")) {
      const deck = toolStates.customDecks.find((d: any) => d.id === currentPage);
      return deck?.name || "Custom Deck";
    }
    if (currentPage.startsWith("edit-deck-")) {
      return "Edit Deck";
    }
    if (currentPage.startsWith("template-")) {
      const template = toolStates.gameTemplates.find((t: any) => t.id === currentPage);
      return template?.name || "Game Template";
    }
    if (currentPage.startsWith("edit-template-")) {
      return "Edit Template";
    }
    if (currentPage.startsWith("run-template-")) {
      const templateId = currentPage.replace("run-", "");
      const template = toolStates.gameTemplates.find((t: any) => t.id === templateId);
      return template?.name || "Running Template";
    }
    return "Rolling Home";
  };

  const renderPage = () => {
    // Game Template routes
    if (currentPage.startsWith("run-template-")) {
      const templateId = currentPage.replace("run-", "");
      const template = toolStates.gameTemplates.find((t: any) => t.id === templateId);
      if (template) {
        return (
          <GameTemplateRunner
            template={template}
            settings={settings}
            toolStates={toolStates}
            onExit={() => handleNavigate(templateId)}
          />
        );
      }
    }

    if (currentPage.startsWith("edit-template-")) {
      const templateId = currentPage.replace("edit-template-", "");
      const template = toolStates.gameTemplates.find((t: any) => t.id === templateId);
      if (template) {
        return (
          <GameTemplateBuilder
            existingTemplate={template}
            customDecks={toolStates.customDecks}
            onSave={(updates: any) => {
              toolStates.updateGameTemplate(templateId, updates);
              handleNavigate(templateId);
            }}
            // @ts-ignore - optional prop
            onDelete={() => {
              toolStates.deleteGameTemplate(templateId);
              handleNavigate("dice");
            }}
            onCancel={() => handleNavigate(templateId)}
          />
        );
      }
    }

    if (currentPage.startsWith("template-")) {
      const template = toolStates.gameTemplates.find((t: any) => t.id === currentPage);
      if (template) {
        return (
          <GameTemplateDetail
            template={template}
            onRun={() => handleNavigate("run-" + currentPage)}
            onEdit={() => handleNavigate("edit-" + currentPage)}
          />
        );
      }
    }

    if (currentPage.startsWith("edit-deck-")) {
      const deckId = currentPage.replace("edit-deck-", "");
      const deck = toolStates.customDecks.find((d: any) => d.id === deckId);
      if (deck) {
        return (
          <CustomDeckBuilder
            existingDeck={deck}
            onSave={(updates: any) => {
              toolStates.updateCustomDeck(deckId, updates);
              handleNavigate(deckId);
            }}
            // @ts-ignore - optional prop
            onDelete={() => {
              toolStates.deleteCustomDeck(deckId);
              handleNavigate("dice");
            }}
            onCancel={() => handleNavigate(deckId)}
          />
        );
      }
    }

    if (currentPage.startsWith("deck-")) {
      const deck = toolStates.customDecks.find((d: any) => d.id === currentPage);
      if (deck) {
        return (
          <CustomDeckPlay
            deck={deck}
            settings={settings}
            onUpdate={(updates: any) => toolStates.updateCustomDeck(currentPage, updates)}
            onEdit={() => handleNavigate("edit-" + currentPage)}
          />
        );
      }
    }

    switch (currentPage) {
      case "settings":
        return (
          <Settings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onBack={() => handleNavigate("dice")}
          />
        );
      case "cards":
        return (
          <CardPicker
            settings={settings}
            state={toolStates.cardState}
            onStateChange={toolStates.updateCardState}
            onReset={toolStates.resetCards}
            shuffleArray={toolStates.shuffleArray}
            createFullDeck={toolStates.createFullDeck}
          />
        );
      case "coin":
        return (
          <CoinFlipper
            settings={settings}
            state={toolStates.coinState}
            onStateChange={toolStates.updateCoinState}
            onReset={toolStates.resetCoins}
          />
        );
      case "tiles":
        return (
          <TilePicker
            settings={settings}
            state={toolStates.tileState}
            onStateChange={toolStates.updateTileState}
            onReset={toolStates.resetTiles}
            shuffleArray={toolStates.shuffleArray}
            createFullTileSet={toolStates.createFullTileSet}
          />
        );
      case "new-custom-deck":
        return (
          <CustomDeckBuilder
            onSave={(deck: any) => {
              const newId = toolStates.addCustomDeck(deck);
              handleNavigate(newId);
            }}
            onCancel={() => handleNavigate("dice")}
          />
        );
      case "new-template":
        return (
          <GameTemplateBuilder
            customDecks={toolStates.customDecks}
            onSave={(template: any) => {
              const newId = toolStates.addGameTemplate(template);
              handleNavigate(newId);
            }}
            onCancel={() => handleNavigate("dice")}
          />
        );
      case "dice":
      default:
        return (
          <DiceRoller
            settings={settings}
            state={toolStates.diceState}
            onStateChange={toolStates.updateDiceState}
            onReset={toolStates.resetDice}
          />
        );
    }
  };

  const showHeader = currentPage !== "settings" && !currentPage.startsWith("edit-deck-") && currentPage !== "new-custom-deck" && !currentPage.startsWith("edit-template-") && currentPage !== "new-template" && !currentPage.startsWith("run-template-");
  const showFab = FAB_PAGES.includes(currentPage) || currentPage.startsWith("deck-") || currentPage.startsWith("template-");

  return (
    <div className={"app" + (showInstallBanner ? " has-install-banner" : "")}>
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        customDecks={toolStates.customDecks}
        gameTemplates={toolStates.gameTemplates}
      />

      <SaveLoadModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        saves={toolStates.savedGames}
        onSave={(name: string | null, existingId?: string) => {
          if (existingId) { (toolStates.saveGame as any)(null, existingId); } else if (name) { toolStates.saveGame(name); }
        }}
        onLoad={(saveId: string) => {
          toolStates.loadGame(saveId);
        }}
        onDelete={(saveId: string) => {
          toolStates.deleteGame(saveId);
        }}
      />

      {showHeader && (
        <header className="header">
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1>{getPageTitle()}</h1>
          <div style={{ width: 36 }}></div>
        </header>
      )}

      <main className="main-content">{renderPage()}</main>

      {showFab && (
        <button
          className="save-fab"
          onClick={() => setSaveModalOpen(true)}
          aria-label="Save/Load game"
        >
          💾
        </button>
      )}

      {showInstallBanner && (
        <div className="install-banner">
          <span>Install for quick access</span>
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

import "./Menu.css";

export function Menu({ isOpen, onClose, currentPage, onNavigate, customDecks = [] }) {
  const baseMenuItems = [
    { id: "dice", label: "Dice Roller" },
    { id: "cards", label: "Card Picker" },
    { id: "coin", label: "Coin Flip" },
    { id: "tiles", label: "Tile Picker" },
  ];

  const handleNavigate = (pageId) => {
    onNavigate(pageId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`menu-backdrop ${isOpen ? "menu-backdrop-open" : ""}`}
        onClick={onClose}
      />

      {/* Slide-out menu */}
      <nav className={`menu ${isOpen ? "menu-open" : ""}`}>
        <div className="menu-header">
          <h2>Rolling Home</h2>
        </div>
        <ul className="menu-items">
          {baseMenuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`menu-item ${currentPage === item.id ? "menu-item-active" : ""}`}
                onClick={() => handleNavigate(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
          
          {customDecks.length > 0 && (
            <li className="menu-divider">
              <span>Custom Decks</span>
            </li>
          )}
          
          {customDecks.map((deck) => (
            <li key={deck.id}>
              <button
                className={`menu-item ${currentPage === deck.id ? "menu-item-active" : ""}`}
                onClick={() => handleNavigate(deck.id)}
              >
                {deck.name}
              </button>
            </li>
          ))}
          
          <li>
            <button
              className={`menu-item menu-item-add ${currentPage === "new-custom-deck" ? "menu-item-active" : ""}`}
              onClick={() => handleNavigate("new-custom-deck")}
            >
              + New Custom Deck
            </button>
          </li>
          
          <li className="menu-divider"></li>
          
          <li>
            <button
              className={`menu-item ${currentPage === "settings" ? "menu-item-active" : ""}`}
              onClick={() => handleNavigate("settings")}
            >
              Settings
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

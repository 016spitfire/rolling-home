import "./Menu.css";

export function Menu({ isOpen, onClose, currentPage, onNavigate }) {
  const menuItems = [
    { id: "home", label: "Home" },
    { id: "settings", label: "Settings" },
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
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`menu-item ${currentPage === item.id ? "menu-item-active" : ""}`}
                onClick={() => handleNavigate(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

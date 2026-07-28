import { useState, type PropsWithChildren } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AppLink } from "../router";

const navItems = [
  { to: "/documents", icon: "bi-grid-1x2", label: "Журнал", index: "01" },
  {
    to: "/directories/organizations",
    icon: "bi-layers",
    label: "Справочники",
    index: "02",
  },
  { to: "/settings", icon: "bi-gear", label: "Настройки", index: "03" },
];

export function Layout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const operatorInitial = user?.email.charAt(0).toUpperCase() ?? "A";

  return (
    <div className={`command-shell ${menuOpen ? "menu-open" : ""}`}>
      <aside className="app-sidebar" aria-label="Боковая навигация">
        <AppLink className="command-brand" to="/documents">
          <span className="brand-mark">T</span>
          <span>
            <strong>Tech Center</strong>
            <small>Asset command</small>
          </span>
        </AppLink>

        <div className="sidebar-status">
          <span className="status-dot" />
          <span>System live</span>
          <small>v1.0</small>
        </div>

        <nav className="command-nav" onClick={() => setMenuOpen(false)}>
          <span className="nav-caption">Navigation</span>
          {navItems.map((item) => (
            <AppLink
              key={item.to}
              className={(isActive) => `command-nav-link ${isActive ? "active" : ""}`}
              to={item.to}
            >
              <span className="nav-icon"><i className={`bi ${item.icon}`} /></span>
              <span>{item.label}</span>
              <small>{item.index}</small>
            </AppLink>
          ))}
        </nav>

        <AppLink
          className={(isActive) => `sidebar-operator ${isActive ? "active" : ""}`}
          to="/profile"
        >
          <span className="operator-avatar">{operatorInitial}</span>
          <span className="operator-copy">
            <small>Operator</small>
            <strong title={user?.email}>{user?.email}</strong>
          </span>
          <i className="bi bi-chevron-right operator-chevron" aria-hidden="true" />
        </AppLink>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="app-workspace">
        <header className="command-topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <i className="bi bi-list" />
            </button>
            <span className="live-indicator">
              <span className="status-dot" />
              <span>Operations online</span>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-time">
              <small>Last sync</small>
              <strong>Just now</strong>
            </span>
            <button
              className="icon-button"
              type="button"
              onClick={toggle}
              aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
              title="Сменить тему"
            >
              <i className={`bi ${theme === "light" ? "bi-moon" : "bi-sun"}`} />
            </button>
            <button
              className="icon-button danger"
              type="button"
              onClick={() => void logout()}
              aria-label="Выйти"
              title="Выйти"
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </header>

        <main className="command-content">{children}</main>
        <footer className="command-footer">
          <span>Tech Center / Asset Operations</span>
          <span>Secure administrative workspace</span>
        </footer>
      </div>
    </div>
  );
}

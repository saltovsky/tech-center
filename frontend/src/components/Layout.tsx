import { useState, type PropsWithChildren } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { AppLink } from "../router";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { to: "/documents", icon: "bi-grid-1x2", labelKey: "layout.journal", index: "01" },
  {
    to: "/directories/organizations",
    icon: "bi-layers",
    labelKey: "layout.directories",
    index: "02",
  },
  { to: "/settings", icon: "bi-gear", labelKey: "layout.settings", index: "03" },
] as const;

export function Layout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const operatorInitial = user?.email.charAt(0).toUpperCase() ?? "A";

  return (
    <div className={`command-shell ${menuOpen ? "menu-open" : ""}`}>
      <aside className="app-sidebar" aria-label={t("layout.sidebar")}>
        <AppLink className="command-brand" to="/documents">
          <span className="brand-mark">T</span>
          <span>
            <strong>Tech Center</strong>
            <small>{t("layout.assetCommand")}</small>
          </span>
        </AppLink>

        <div className="sidebar-status">
          <span className="status-dot" />
          <span>{t("layout.systemLive")}</span>
          <small>v1.0</small>
        </div>

        <nav className="command-nav" onClick={() => setMenuOpen(false)}>
          <span className="nav-caption">{t("layout.navigation")}</span>
          {navItems.map((item) => (
            <AppLink
              key={item.to}
              className={(isActive) => `command-nav-link ${isActive ? "active" : ""}`}
              to={item.to}
            >
              <span className="nav-icon"><i className={`bi ${item.icon}`} /></span>
              <span>{t(item.labelKey)}</span>
              <small>{item.index}</small>
            </AppLink>
          ))}
        </nav>

        <AppLink
          className={(isActive) => `sidebar-operator ${isActive ? "active" : ""}`}
          to="/profile"
          aria-label={t("layout.openProfile")}
        >
          <span className="operator-avatar">{operatorInitial}</span>
          <span className="operator-copy">
            <small>{t("layout.operator")}</small>
            <strong title={user?.email}>{user?.email}</strong>
          </span>
          <i className="bi bi-chevron-right operator-chevron" aria-hidden="true" />
        </AppLink>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label={t("layout.closeMenu")}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="app-workspace">
        <header className="command-topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-label={t("layout.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <i className="bi bi-list" />
            </button>
            <span className="live-indicator">
              <span className="status-dot" />
              <span>{t("layout.operationsOnline")}</span>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-time">
              <small>{t("layout.lastSync")}</small>
              <strong>{t("layout.justNow")}</strong>
            </span>
            <LanguageSwitcher compact />
            <button
              className="icon-button"
              type="button"
              onClick={toggle}
              aria-label={theme === "light" ? t("layout.darkTheme") : t("layout.lightTheme")}
              title={t("layout.changeTheme")}
            >
              <i className={`bi ${theme === "light" ? "bi-moon" : "bi-sun"}`} />
            </button>
            <button
              className="icon-button danger"
              type="button"
              onClick={() => void logout()}
              aria-label={t("layout.logout")}
              title={t("layout.logout")}
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </header>

        <main className="command-content">{children}</main>
        <footer className="command-footer">
          <span>{t("layout.footer")}</span>
          <span>{t("layout.secureWorkspace")}</span>
        </footer>
      </div>
    </div>
  );
}

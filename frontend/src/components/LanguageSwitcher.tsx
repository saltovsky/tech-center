import { useLanguage } from "../contexts/LanguageContext";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`language-switcher ${compact ? "compact" : ""}`}
      role="group"
      aria-label={t("language.label")}
    >
      {(["ru", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          className={language === item ? "active" : ""}
          aria-pressed={language === item}
          onClick={() => setLanguage(item)}
        >
          {t(`language.${item}`)}
        </button>
      ))}
    </div>
  );
}

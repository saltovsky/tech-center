import { useLanguage } from "../contexts/LanguageContext";

export function Loading() {
  const { t } = useLanguage();
  return (
    <div className="d-flex justify-content-center p-5" role="status" aria-label={t("common.loading")}>
      <div className="spinner-border text-primary" />
    </div>
  );
}

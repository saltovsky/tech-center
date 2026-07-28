import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { errorMessage } from "../api/client";
import { Alert } from "../components/Alert";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useRouter } from "../router";

type FormData = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("common.emailInvalid")),
        password: z.string().min(8, t("common.min8")),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) navigate("/documents", true);
  }, [navigate, user]);
  if (user) return null;

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate("/documents", true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <main className="login-shell">
      <section className="login-brief" aria-labelledby="login-brief-title">
        <div className="login-brand">
          <span className="brand-mark">T</span>
          <span>
            <strong>Tech Center</strong>
            <small>{t("layout.assetCommand")}</small>
          </span>
        </div>
        <div className="login-message">
          <span className="page-kicker">{t("login.kicker")}</span>
          <h1 id="login-brief-title">
            {t("login.title").split("\n").map((line, index) => (
              <span key={line}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          <p>{t("login.description")}</p>
        </div>
        <div className="login-signal-grid" aria-label={t("login.systemState")}>
          <div>
            <small>{t("login.apiStatus")}</small>
            <strong><span className="status-dot" /> {t("login.online")}</strong>
          </div>
          <div>
            <small>{t("login.access")}</small>
            <strong>{t("login.adminOnly")}</strong>
          </div>
          <div>
            <small>{t("login.security")}</small>
            <strong>JWT + CSRF</strong>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-header">
          <span className="page-kicker">{t("login.secureAccess")}</span>
          <div className="login-panel-tools">
            <span className="login-panel-index">02</span>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="login-form-wrap">
          <h2 id="login-title">{t("login.signIn")}</h2>
          <p className="text-body-secondary">{t("login.hint")}</p>
          <Alert message={error} />
          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                {...register("email")}
              />
              <div className="invalid-feedback">{errors.email?.message}</div>
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="password">{t("login.password")}</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                {...register("password")}
              />
              <div className="invalid-feedback">{errors.password?.message}</div>
            </div>
            <button className="btn btn-primary w-100 login-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-arrow-right me-2" />
              )}
              {t("login.continue")}
            </button>
          </form>
        </div>
        <div className="login-panel-footer">
          <span>{t("login.protected")}</span>
          <i className="bi bi-shield-check" />
        </div>
      </section>
    </main>
  );
}

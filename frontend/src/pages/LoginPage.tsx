import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { errorMessage } from "../api/client";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "../router";

const schema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { user, login } = useAuth();
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
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
            <small>Asset command</small>
          </span>
        </div>
        <div className="login-message">
          <span className="page-kicker">Equipment operations / 01</span>
          <h1 id="login-brief-title">Командный центр<br />для учёта техники</h1>
          <p>
            Единое рабочее пространство для выдачи устройств, контроля статусов
            и управления справочными данными.
          </p>
        </div>
        <div className="login-signal-grid" aria-label="Состояние системы">
          <div>
            <small>API status</small>
            <strong><span className="status-dot" /> Online</strong>
          </div>
          <div>
            <small>Access</small>
            <strong>Admin only</strong>
          </div>
          <div>
            <small>Security</small>
            <strong>JWT + CSRF</strong>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-header">
          <span className="page-kicker">Secure access</span>
          <span className="login-panel-index">02</span>
        </div>
        <div className="login-form-wrap">
          <h2 id="login-title">Вход в систему</h2>
          <p className="text-body-secondary">Используйте учётную запись администратора.</p>
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
              <label className="form-label" htmlFor="password">Пароль</label>
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
              Продолжить
            </button>
          </form>
        </div>
        <div className="login-panel-footer">
          <span>Protected workspace</span>
          <i className="bi bi-shield-check" />
        </div>
      </section>
    </main>
  );
}


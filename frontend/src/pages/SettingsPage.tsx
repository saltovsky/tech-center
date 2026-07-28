import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api, { errorMessage } from "../api/client";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import type { User } from "../types";

type UserForm = {
  email: string;
  password: string;
};

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("common.emailInvalid")),
        password: z.string().min(12, t("common.min12")),
      }),
    [t],
  );
  const form = useForm<UserForm>({ resolver: zodResolver(schema) });

  const loadUsers = useCallback(async () => {
    try {
      setUsers((await api.get<User[]>("/auth/users")).data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const addUser = async (data: UserForm) => {
    setError(null);
    setMessage(null);
    try {
      await api.post("/auth/register", data);
      form.reset();
      setMessage(t("settings.added"));
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(t("settings.confirmDelete", { email: user.email }))) return;

    setDeletingId(user.id);
    setError(null);
    setMessage(null);
    try {
      await api.delete(`/auth/users/${user.id}`);
      setMessage(t("settings.deleted"));
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="mb-4">
        <span className="page-kicker">{t("settings.kicker")}</span>
        <h1 className="h3 mt-2 mb-2">{t("settings.title")}</h1>
        <p className="text-body-secondary mb-0">{t("settings.description")}</p>
      </div>

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={message} variant="success" onClose={() => setMessage(null)} />

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <section className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">{t("settings.newAdmin")}</div>
            <div className="card-body">
              <form onSubmit={(event) => void form.handleSubmit(addUser)(event)}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="newEmail">Email</label>
                  <input
                    id="newEmail"
                    type="email"
                    autoComplete="email"
                    className={`form-control ${form.formState.errors.email ? "is-invalid" : ""}`}
                    {...form.register("email")}
                  />
                  <div className="invalid-feedback">{form.formState.errors.email?.message}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="newUserPassword">
                    {t("settings.tempPassword")}
                  </label>
                  <input
                    id="newUserPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`form-control ${form.formState.errors.password ? "is-invalid" : ""}`}
                    {...form.register("password")}
                  />
                  <div className="invalid-feedback">{form.formState.errors.password?.message}</div>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {t("settings.addAdmin")}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-7">
          <section className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">
              {t("settings.admins")}
              <span className="badge text-bg-secondary ms-2">{users.length}</span>
            </div>
            <ul className="list-group list-group-flush">
              {users.map((user) => {
                const isCurrent = user.id === currentUser?.id;
                return (
                  <li key={user.id} className="list-group-item settings-user-row">
                    <div className="min-w-0">
                      <strong className="d-block text-break">{user.email}</strong>
                      <span className="text-body-secondary small">
                        {isCurrent ? t("settings.currentUser") : t("settings.activeAdmin")}
                      </span>
                    </div>
                    {isCurrent ? (
                      <span className="badge text-bg-success">{t("settings.you")}</span>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={deletingId !== null}
                        type="button"
                        onClick={() => void deleteUser(user)}
                        aria-label={t("settings.deleteUser", { email: user.email })}
                      >
                        {deletingId === user.id ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            aria-hidden="true"
                          />
                        ) : (
                          <i className="bi bi-trash3" aria-hidden="true" />
                        )}
                        <span>{t("common.delete")}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

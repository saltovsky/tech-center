import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api, { errorMessage } from "../api/client";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../types";

const userSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(12, "Минимум 12 символов"),
});

type UserForm = z.infer<typeof userSchema>;

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const form = useForm<UserForm>({ resolver: zodResolver(userSchema) });

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
      setMessage("Администратор добавлен");
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const deleteUser = async (user: User) => {
    if (
      !window.confirm(
        `Удалить администратора ${user.email}? Доступ к системе будет немедленно отозван.`,
      )
    ) {
      return;
    }

    setDeletingId(user.id);
    setError(null);
    setMessage(null);
    try {
      const response = await api.delete<{ detail: string }>(`/auth/users/${user.id}`);
      setMessage(response.data.detail);
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
        <span className="page-kicker">Administration / access control</span>
        <h1 className="h3 mt-2 mb-2">Настройки</h1>
        <p className="text-body-secondary mb-0">
          Управление администраторами и доступом к системе
        </p>
      </div>

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={message} variant="success" onClose={() => setMessage(null)} />

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <section className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">
              Новый администратор
            </div>
            <div className="card-body">
              <form onSubmit={(event) => void form.handleSubmit(addUser)(event)}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="newEmail">
                    Email
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    autoComplete="email"
                    className={`form-control ${form.formState.errors.email ? "is-invalid" : ""}`}
                    {...form.register("email")}
                  />
                  <div className="invalid-feedback">
                    {form.formState.errors.email?.message}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="newUserPassword">
                    Временный пароль
                  </label>
                  <input
                    id="newUserPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`form-control ${form.formState.errors.password ? "is-invalid" : ""}`}
                    {...form.register("password")}
                  />
                  <div className="invalid-feedback">
                    {form.formState.errors.password?.message}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  Добавить администратора
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-7">
          <section className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">
              Администраторы
              <span className="badge text-bg-secondary ms-2">{users.length}</span>
            </div>
            <ul className="list-group list-group-flush">
              {users.map((user) => {
                const isCurrent = user.id === currentUser?.id;
                return (
                  <li
                    key={user.id}
                    className="list-group-item settings-user-row"
                  >
                    <div className="min-w-0">
                      <strong className="d-block text-break">{user.email}</strong>
                      <span className="text-body-secondary small">
                        {isCurrent ? "Текущий пользователь" : "Активный администратор"}
                      </span>
                    </div>
                    {isCurrent ? (
                      <span className="badge text-bg-success">Вы</span>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={deletingId !== null}
                        type="button"
                        onClick={() => void deleteUser(user)}
                        aria-label={`Удалить пользователя ${user.email}`}
                      >
                        {deletingId === user.id ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            aria-hidden="true"
                          />
                        ) : (
                          <i className="bi bi-trash3" aria-hidden="true" />
                        )}
                        <span>Удалить</span>
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

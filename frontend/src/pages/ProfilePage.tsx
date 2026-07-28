import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api, { errorMessage, setSession } from "../api/client";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "../router";
import { useState } from "react";

const passwordSchema = z
  .object({
    current_password: z.string().min(8, "Минимум 8 символов"),
    new_password: z.string().min(12, "Минимум 12 символов"),
    confirm: z.string(),
  })
  .refine((value) => value.new_password === value.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const passwordFields: Array<{
  name: keyof PasswordForm;
  label: string;
  autoComplete: string;
}> = [
  {
    name: "current_password",
    label: "Текущий пароль",
    autoComplete: "current-password",
  },
  {
    name: "new_password",
    label: "Новый пароль",
    autoComplete: "new-password",
  },
  {
    name: "confirm",
    label: "Повторите новый пароль",
    autoComplete: "new-password",
  },
];

export function ProfilePage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const changePassword = async (data: PasswordForm) => {
    setError(null);
    try {
      const response = await api.post<{ detail: string }>("/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setSession(null);
      window.alert(response.data.detail);
      navigate("/login", true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <div className="mb-4">
        <span className="page-kicker">Operator / personal security</span>
        <h1 className="h3 mt-2 mb-2">Профиль пользователя</h1>
        <p className="text-body-secondary mb-0">
          Личные данные и безопасность учётной записи
        </p>
      </div>

      <Alert message={error} onClose={() => setError(null)} />

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <section className="card shadow-sm h-100">
            <div className="card-header bg-body fw-semibold">Учётная запись</div>
            <div className="card-body d-flex align-items-center gap-3">
              <span className="profile-avatar" aria-hidden="true">
                {user?.email.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="text-body-secondary small">Email администратора</div>
                <strong className="d-block text-break">{user?.email}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-8">
          <section className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">Смена пароля</div>
            <div className="card-body">
              <form
                className="profile-password-form"
                onSubmit={(event) => void form.handleSubmit(changePassword)(event)}
              >
                {passwordFields.map((field) => (
                  <div className="mb-3" key={field.name}>
                    <label className="form-label" htmlFor={field.name}>
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      type="password"
                      autoComplete={field.autoComplete}
                      className={`form-control ${form.formState.errors[field.name] ? "is-invalid" : ""}`}
                      {...form.register(field.name)}
                    />
                    <div className="invalid-feedback">
                      {form.formState.errors[field.name]?.message}
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-primary"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  Изменить пароль
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
